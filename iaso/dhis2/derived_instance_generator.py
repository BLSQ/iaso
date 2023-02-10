import logging
from io import BytesIO
from timeit import default_timer as timer
from uuid import uuid4

from django.contrib.postgres.fields.jsonb import KeyTextTransform
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import Avg, Count, FloatField, Sum, Exists, OuterRef, Q
from django.db.models.functions import Cast
from lxml import etree  # type: ignore

from iaso.models import Instance

logger = logging.getLogger(__name__)


def generate_instance_xml(instance, form_version):
    # create XML
    root = etree.Element("data")

    for k in instance.json.keys():
        # another child with text
        if k != "_version":
            child = etree.Element(k)
            child.text = str(instance.json[k])
            root.append(child)

    root.attrib["version"] = form_version.version_id
    root.attrib["id"] = form_version.form.form_id

    # generate <meta><instanceID>uuid:3679c645-24ec-4860-93ea-fce1d068b58f</instanceID></meta>
    meta = etree.Element("meta")
    root.append(meta)
    instance_id = etree.Element("instanceID")
    instance_id.text = "uuid:" + instance.uuid
    meta.append(instance_id)

    instance_xml = etree.tostring(root, pretty_print=True, encoding="UTF-8")

    return instance_xml


def generate_instances(project, cvs_form, cvs_stat_mapping_version, period):
    batch_start = timer()

    # build query set for aggregation

    # The .values() set what we aggregate on
    queryset = cvs_form.instances.filter(form=cvs_form, period=period).values("period", "org_unit_id", "form_id")
    # don't aggregate deleted instances
    queryset = queryset.filter(deleted=False)
    # don't aggregate instances with json empty or test devices
    queryset = queryset.exclude(file="").exclude(device__test_device=True)

    aggregations = cvs_stat_mapping_version.json["aggregations"]
    for aggregation in aggregations:

        answer = Cast(KeyTextTransform(aggregation["questionName"], "json"), FloatField())
        # Blanks are generally there because the "calculate" in the xlsform ended up to NaN
        # because other dependencies where not 'relevant' or 'filled'
        # for the moment excluding them looks better than considering them as 0
        # this can be changed later, and we consider make it configurable on the aggregation settings
        question_name = aggregation["questionName"]
        fieldname = "json__" + question_name
        filter_out_blanks = ~Q(**{fieldname: ""})
        agg_filter = filter_out_blanks
        # Additional filter that can be passed to the aggregate
        for condition in aggregation.get("where", []):
            q = condition_to_q(condition)
            agg_filter &= q

        if aggregation["aggregationType"] == "sum":
            queryset = queryset.annotate(**{aggregation["id"]: Sum(answer, filter=agg_filter)})
        elif aggregation["aggregationType"] == "avg":
            queryset = queryset.annotate(**{aggregation["id"]: Avg(answer, filter=agg_filter)})
        elif aggregation["aggregationType"] == "count":
            queryset = queryset.annotate(**{aggregation["id"]: Count(answer, filter=agg_filter)})
        else:
            raise Exception("unsupported aggregationType : " + aggregation["aggregationType"])

    queryset = queryset.order_by("period", "org_unit_id", "form_id")

    logger.debug("generate_instances : queryset" + str(queryset.count()))
    # generate "derived" instances

    page_size = 50

    paginator = Paginator(queryset, page_size)

    progress = {"new": 0, "updated": 0, "skipped": 0, "nullified": 0, "deleted": 0}

    for page in range(1, paginator.num_pages + 1):
        process_page(paginator, page, project, cvs_stat_mapping_version, progress, aggregations)

    batch_end = timer()
    batch_time = batch_end - batch_start

    nullify_stats_without_cvs(progress, cvs_form, cvs_stat_mapping_version, period)

    instances = Instance.objects.filter(period=period, form=cvs_stat_mapping_version.form_version.form, project=project)
    logger.debug(
        "generate_instances : took"
        + str(batch_time)
        + "to generate"
        + str(instances.count())
        + "instances : "
        + str(progress)
    )
    return progress


def condition_to_q(condition):
    """This is our custom format to filter on a question value in the json field.

    It takes 3 parameter, the questionName, the operator (e.g. exact) and the value (attention type matter don't quote)
    if you want to filter an int
    Check JSONField.get_lookups() for valid operators. You can prepend ~ to negate them.


    """
    lookup = condition["operator"]
    cond_fieldname = "json__" + condition["questionName"]
    cond_value = condition["value"]
    negated = False
    if lookup.startswith("~"):
        negated = True
        lookup = lookup[1:]
    fieldname_lookup = cond_fieldname + "__" + lookup
    q = Q(**{fieldname_lookup: cond_value}, _negated=negated)
    return q


@transaction.atomic
def process_page(paginator, page, project, cvs_stat_mapping_version, progress, aggregations):
    page_start = timer()

    counts = paginator.page(page).object_list
    logger.debug("generate_instances : page : " + str(page))

    for record in counts:
        process_instance(record, project, cvs_stat_mapping_version, progress, aggregations)

    page_time = timer() - page_start
    logger.debug("generate_instances :" + str(progress) + "in" + str(page_time) + "seconds")


def process_instance(record, project, cvs_stat_mapping_version, progress, aggregations):

    instance, _created = Instance.objects.get_or_create(
        org_unit_id=record["org_unit_id"],
        period=record["period"],
        form=cvs_stat_mapping_version.form_version.form,
        project=project,
    )
    flagged_as_new = False
    if instance.uuid is None:
        instance.uuid = str(uuid4())
        flagged_as_new = True

    json_data = {"_version": cvs_stat_mapping_version.form_version.version_id}

    for aggregation in aggregations:
        aggregation_field = aggregation["id"]
        default_value = aggregation.get("defaultValue", None)
        value = record[aggregation_field]
        if value is None:
            json_data[aggregation_field] = default_value
        else:
            json_data[aggregation_field] = value

    if json_data == instance.json:
        progress["skipped"] += 1
    else:
        if flagged_as_new:
            progress["new"] += 1
        else:
            progress["updated"] += 1
            # TODO do we "nullify last export success"

        instance.json = json_data
        xml_string = generate_instance_xml(instance, cvs_stat_mapping_version.form_version)
        buffer = BytesIO(xml_string)
        buffer.seek(0, 2)  # Seek to the end of the stream, so we can get its length with `buf.tell()`
        instance.file_name = cvs_stat_mapping_version.form_version.form.form_id + "_" + instance.uuid
        file = InMemoryUploadedFile(
            file=buffer,
            field_name="file",
            name=instance.file_name,
            content_type="application/xml",
            size=buffer.tell(),
            charset="utf-8",
        )
        instance.file = file
        instance.save()


def nullify_stats_without_cvs(progress, cvs_form, cvs_stat_mapping_version, period):

    stats_instances = cvs_stat_mapping_version.form_version.form.instances
    subquery_cvs = (
        cvs_form.instances.filter(period=period)
        .filter(deleted=False)
        .exclude(file="")
        .exclude(device__test_device=True)
    )
    stats_instances = stats_instances.annotate(
        cvs_exists=Exists(subquery_cvs.filter(period=OuterRef("period"), org_unit_id=OuterRef("org_unit_id")))
    ).filter(cvs_exists=False)
    aggregations = cvs_stat_mapping_version.json["aggregations"]

    for stat_instance in stats_instances:
        if stat_instance.last_export_success_at:
            for aggregation in aggregations:
                stat_instance.json[aggregation["id"]] = None
            stat_instance.last_export_success_at = None
            stat_instance.save()
            progress["nullified"] += 1
        else:
            stat_instance.delete()
            progress["deleted"] += 1
