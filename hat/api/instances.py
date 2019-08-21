import json

from django.contrib.gis.geos import Point
from rest_framework import viewsets
from rest_framework.response import Response

from hat.vector_control.models import APIImport
from .catches import timestamp_to_utc_datetime
from iaso.models import Instance, OrgUnit

from django.core.paginator import Paginator

from django.http import StreamingHttpResponse, HttpResponse
from .export_utils import Echo, generate_xlsx, iter_items
from iaso.utils import timestamp_to_datetime
import ntpath


class InstancesViewSet(viewsets.ViewSet):
    authentication_classes = []
    permission_classes = []

    def list(self, request):
        queryset = Instance.objects.order_by("-id")
        limit = request.GET.get("limit", None)
        as_location = request.GET.get("as_location", None)
        page_offset = request.GET.get("page", 1)
        orders = request.GET.get("order", "updated_at").split(",")
        form_id = request.GET.get("form_id", None)
        csv_format = request.GET.get("csv", None)
        xlsx_format = request.GET.get("xlsx", None)

        queryset = (
            queryset.exclude(file="")
            .exclude(device__test_device=True)
            .order_by(*orders)
        )  ## quickfix to avoid updating the front, but here, we should also display entries without xml

        queryset = queryset.prefetch_related("org_unit")
        queryset = queryset.prefetch_related("org_unit__org_unit_type")
        queryset = queryset.prefetch_related("form")

        if form_id:
            queryset = queryset.filter(form_id=form_id)
        if csv_format is None and xlsx_format is None:

            if limit:
                limit = int(limit)
                page_offset = int(page_offset)

                paginator = Paginator(queryset, limit)
                res = {"count": paginator.count}
                if page_offset > paginator.num_pages:
                    page_offset = paginator.num_pages
                page = paginator.page(page_offset)

                res["instances"] = map(lambda x: x.as_dict(), page.object_list)
                res["has_next"] = page.has_next()
                res["has_previous"] = page.has_previous()
                res["page"] = page_offset
                res["pages"] = paginator.num_pages
                res["limit"] = limit
                return Response(res)
            elif as_location:
                return Response(
                    [
                        instance.as_location()
                        for instance in queryset.filter(
                            location__isnull=False
                        ).prefetch_related("instancefile_set")
                    ]
                )
            else:
                return Response(
                    {"instances": [instance.as_dict() for instance in queryset]}
                )
        else:
            columns = [
                {"title": "ID du formulaire", "width": 20},
                {"title": "Latitude", "width": 40},
                {"title": "Longitude", "width": 20},
                {"title": "Date de création", "width": 20},
                {"title": "Date de modification", "width": 20},
            ]
            file_content_template = queryset.first().as_dict()["file_content"]
            for title in file_content_template:
                columns.append({"title": title, "width": 50})
            filename = "instances"

            def get_row(instance, **kwargs):
                idict = instance.as_dict()
                created_at = timestamp_to_datetime(idict.get("created_at"))
                updated_at = timestamp_to_datetime(idict.get("updated_at"))
                instance_values = [
                    idict.get("form_id"),
                    idict.get("latitude"),
                    idict.get("longitude"),
                    created_at,
                    updated_at,
                ]

                for k in file_content_template:
                    instance_values.append(idict["file_content"].get(k, None))
                return instance_values

            if xlsx_format:
                filename = filename + ".xlsx"
                response = HttpResponse(
                    generate_xlsx("Forms", columns, queryset, get_row),
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            if csv_format:
                response = StreamingHttpResponse(
                    streaming_content=(iter_items(queryset, Echo(), columns, get_row)),
                    content_type="text/csv",
                )
                filename = filename + ".csv"
            response["Content-Disposition"] = "attachment; filename=%s" % filename
            return response

    def create(self, request):
        instances = request.data
        new_instances = []
        api_import = APIImport()
        if not request.user.is_anonymous:
            api_import.user = request.user
        api_import.import_type = "instance"
        api_import.json_body = instances
        api_import.save()
        try:
            for instance in instances:
                file_name = ntpath.basename(instance.get("file", None))
                uuid = instance.get("id", None)
                latitude = instance.get("latitude", None)
                longitude = instance.get("longitude", None)
                altitude = instance.get("altitude", 0)
                org_unit_location = None

                if latitude and longitude:
                    org_unit_location = Point(x=longitude, y=latitude, srid=4326)

                instances = Instance.objects.filter(uuid=uuid)
                if len(instances) == 1:
                    instance_db = instances[0]
                    instance_db.file_name = file_name
                elif len(instances) == 0:
                    instance_db, _ = Instance.objects.get_or_create(file_name=file_name)
                    instance_db.uuid = uuid
                else:
                    return Response(
                        {"res": "Problem: multiple instances exist with that uuid"}
                    )
                instance_db.name = instance.get("name", None)
                instance_db.accuracy = instance.get("accuracy", None)
                instance_db.parent_id = instance.get("parentId", None)
                tentative_org_unit_id = instance.get("orgUnitId", None)
                if str(tentative_org_unit_id).isdigit():
                    instance_db.org_unit_id = tentative_org_unit_id
                else:
                    org_unit = OrgUnit.objects.get(uuid=tentative_org_unit_id)
                    instance_db.org_unit = org_unit

                instance_db.form_id = instance.get("formId")

                t = instance.get("created_at", None)
                if t:
                    instance_db.created_at = timestamp_to_utc_datetime(int(t))
                else:
                    instance_db.created_at = instance.get("created_at", None)

                t = instance.get("updated_at", None)
                if t:
                    instance_db.updated_at = timestamp_to_utc_datetime(int(t))
                else:
                    instance_db.updated_at = instance.get("created_at", None)

                instance_db.source = "API"
                instance_db.api_import = api_import
                if org_unit_location:
                    instance_db.location = org_unit_location

                new_instances.append(instance_db)
                instance_db.save()

            return Response({"res": "ok"})
        except Exception as e:
            print("exception", e)
            api_import.has_problem = True
            api_import.save()
            return Response({"result": "ok"})
