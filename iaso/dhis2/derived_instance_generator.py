from django.db.models.expressions import RawSQL
from django.db.models import Sum, FloatField, Avg, Count
from django.db.models.functions import Cast
from django.contrib.postgres.fields import JSONField
from django.contrib.postgres.fields.jsonb import KeyTextTransform
from django.core.paginator import Paginator
from django.core.files.uploadedfile import UploadedFile
from iaso.models import Instance


def generate_instances(project, cvs_form, cvs_mapping_version, cvs_stat_form, cvs_stat_mapping_version):

    # fetch aggregated values
    aggregations = cvs_mapping_version.json["aggregations"]

    queryset = cvs_form.instances.filter(form_id=cvs_form.id, period="2018Q1").values(
        "period", "org_unit_id", "form_id",
    )

    for aggregation in aggregations:
        answer = Cast(
            KeyTextTransform(aggregation["questionKey"], "json"), FloatField(),
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

    # generate "derived" instances
    page_size = 50

    paginator = Paginator(queryset, page_size)
    for page in range(1, paginator.num_pages + 1):
        counts = paginator.page(page).object_list
        instances = []
        for record in counts:
            instance = Instance(project=project)
            instance.org_unit_id = record["org_unit_id"]
            instance.period = record["period"]

            json_data = {"_version": cvs_stat_mapping_version.form_version.version_id}

            for aggregation in aggregations:
                json_data[aggregation["id"]] = record[aggregation["id"]]

            instance.json = json_data
            instance.form = cvs_stat_form
            instance.file = UploadedFile(
                open("iaso/tests/fixtures/hydroponics_test_upload.xml")
            )

            instances.append(instance)

        Instance.objects.bulk_create(instances)

