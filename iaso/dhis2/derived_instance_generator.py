from django.db.models.expressions import RawSQL
from django.db.models import Sum, FloatField, Avg, Count
from django.db.models.functions import Cast
from django.contrib.postgres.fields import JSONField
from django.contrib.postgres.fields.jsonb import KeyTextTransform
from django.core.paginator import Paginator
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.db import transaction

from lxml import etree
from io import StringIO
from uuid import uuid4

from iaso.models import Instance
from timeit import default_timer as timer


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

    instance_xml = etree.tostring(root, pretty_print=True)
    return instance_xml


@transaction.atomic
def generate_instances(project, cvs_form, cvs_stat_mapping_version, period):
    batch_start = timer()

    # build query set for aggregation

    aggregations = cvs_stat_mapping_version.json["aggregations"]

    queryset = cvs_form.instances.filter(form=cvs_form, period=period).values(
        "period", "org_unit_id", "form_id"
    )
    # don't aggregate deleted instances
    queryset = queryset.filter(deleted=False)
    # don't aggregate instances with json empty or test devices
    queryset = queryset.exclude(file="").exclude(device__test_device=True)

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

    # TODO how to delete the non regenerated one ?

    page_size = 50

    paginator = Paginator(queryset, page_size)

    for page in range(1, paginator.num_pages + 1):
        page_start = timer()

        counts = paginator.page(page).object_list
        print("generate_instances : page : ", page)
        instances = []

        for record in counts:

            instance, _created = Instance.objects.get_or_create(
                org_unit_id=record["org_unit_id"],
                period=record["period"],
                form=cvs_stat_mapping_version.form_version.form,
                project=project,
            )

            if instance.uuid == None:
                instance.uuid = str(uuid4())

            json_data = {"_version": cvs_stat_mapping_version.form_version.version_id}

            for aggregation in aggregations:
                json_data[aggregation["id"]] = record[aggregation["id"]]

            instance.json = json_data
            xml_string = generate_instance_xml(
                instance, cvs_stat_mapping_version.form_version
            )
            buffer = StringIO(str(xml_string))
            buffer.seek(
                0, 2
            )  # Seek to the end of the stream, so we can get its length with `buf.tell()`
            instance.file_name = (
                cvs_stat_mapping_version.form_version.form.form_id + "_" + instance.uuid
            )
            file = InMemoryUploadedFile(
                buffer, "file", instance.file_name, None, buffer.tell(), None
            )
            instance.file = file

            saved = instance.save()
            instances.append(instance)

        page_time = timer() - page_start
        print("created or update", len(instances), "in", page_time, "seconds")

    batch_end = timer()
    batch_time = batch_end - batch_start
    instances = Instance.objects.filter(
        period=period, form=cvs_stat_mapping_version.form_version.form, project=project
    )
    print("took", batch_time, "to generate", instances.count(), "instances")
