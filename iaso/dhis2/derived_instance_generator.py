from io import StringIO
from timeit import default_timer as timer
from uuid import uuid4

from lxml import etree


from django.contrib.postgres.fields.jsonb import KeyTextTransform
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import Avg, Count, FloatField, Sum, Exists, OuterRef
from django.db.models.functions import Cast
from iaso.models import Instance


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

    return instance_xml.decode("utf-8")


def generate_instances(project, cvs_form, cvs_stat_mapping_version, period):
    batch_start = timer()

    # build query set for aggregation

    queryset = cvs_form.instances.filter(form=cvs_form, period=period).values(
        "period", "org_unit_id", "form_id"
    )
    # don't aggregate deleted instances
    queryset = queryset.filter(deleted=False)
    # don't aggregate instances with json empty or test devices
    queryset = queryset.exclude(file="").exclude(device__test_device=True)

    aggregations = cvs_stat_mapping_version.json["aggregations"]
    for aggregation in aggregations:

        answer = Cast(
            KeyTextTransform(aggregation["questionName"], "json"), FloatField()
        )

        if aggregation["aggregationType"] == "sum":
            queryset = queryset.annotate(**{aggregation["id"]: Sum(answer)})
        elif aggregation["aggregationType"] == "avg":
            queryset = queryset.annotate(**{aggregation["id"]: Avg(answer)})
        elif aggregation["aggregationType"] == "count":
            queryset = queryset.annotate(**{aggregation["id"]: Count(answer)})
        else:
            raise Exception(
                "unsupported aggregationType : " + aggregation["aggregationType"]
            )

    queryset = queryset.order_by("period", "org_unit_id", "form_id")

    print("generate_instances : queryset", queryset.count())
    # generate "derived" instances

    page_size = 50

    paginator = Paginator(queryset, page_size)

    progress = {"new": 0, "updated": 0, "skipped": 0, "nullified": 0, "deleted": 0}

    for page in range(1, paginator.num_pages + 1):
        process_page(
            paginator, page, project, cvs_stat_mapping_version, progress, aggregations
        )

    batch_end = timer()
    batch_time = batch_end - batch_start

    nullify_stats_without_cvs(progress, cvs_form, cvs_stat_mapping_version, period)

    instances = Instance.objects.filter(
        period=period, form=cvs_stat_mapping_version.form_version.form, project=project
    )
    print(
        "generate_instances :",
        "took",
        batch_time,
        "to generate",
        instances.count(),
        "instances : ",
        progress,
    )
    return progress


@transaction.atomic
def process_page(
    paginator, page, project, cvs_stat_mapping_version, progress, aggregations
):
    page_start = timer()

    counts = paginator.page(page).object_list
    print("generate_instances : page : ", page)

    for record in counts:
        instance = process_instance(
            record, project, cvs_stat_mapping_version, progress, aggregations
        )

    page_time = timer() - page_start
    print("generate_instances :", progress, "in", page_time, "seconds")


def process_instance(record, project, cvs_stat_mapping_version, progress, aggregations):

    instance, _created = Instance.objects.get_or_create(
        org_unit_id=record["org_unit_id"],
        period=record["period"],
        form=cvs_stat_mapping_version.form_version.form,
        project=project,
    )
    flagged_as_new = False
    if instance.uuid == None:
        instance.uuid = str(uuid4())
        flagged_as_new = True

    json_data = {"_version": cvs_stat_mapping_version.form_version.version_id}

    for aggregation in aggregations:
        json_data[aggregation["id"]] = record[aggregation["id"]]

    if json_data == instance.json:
        progress["skipped"] += 1
    else:
        if flagged_as_new:
            progress["new"] += 1
        else:
            progress["updated"] += 1
            # TODO do we "nullify last export success"

        instance.json = json_data
        xml_string = generate_instance_xml(
            instance, cvs_stat_mapping_version.form_version
        )
        buffer = StringIO(xml_string)
        buffer.seek(
            0, 2
        )  # Seek to the end of the stream, so we can get its length with `buf.tell()`
        instance.file_name = (
            cvs_stat_mapping_version.form_version.form.form_id + "_" + instance.uuid
        )
        file = InMemoryUploadedFile(
            file=buffer,
            field_name="file",
            name=instance.file_name,
            content_type="application/xml",
            size=buffer.tell(),
            charset="utf-8",
        )
        instance.file = file

        saved = instance.save()


def nullify_stats_without_cvs(progress, cvs_form, cvs_stat_mapping_version, period):

    stats_instances = cvs_stat_mapping_version.form_version.form.instances
    subquery_cvs = (
        cvs_form.instances.filter(period=period)
        .filter(deleted=False)
        .exclude(file="")
        .exclude(device__test_device=True)
    )
    stats_instances = stats_instances.annotate(
        cvs_exists=Exists(
            subquery_cvs.filter(
                period=OuterRef("period"), org_unit_id=OuterRef("org_unit_id")
            )
        )
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
