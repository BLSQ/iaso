from django.contrib.gis.geos import Point
from rest_framework import viewsets
from rest_framework.response import Response

from hat.common.utils import queryset_iterator
from hat.vector_control.models import APIImport
from iaso.models import Instance, OrgUnit, DeviceOwnership, Form
from django.db.models import Q
from django.shortcuts import get_object_or_404

from django.core.paginator import Paginator

from django.http import StreamingHttpResponse, HttpResponse
from hat.api.export_utils import (
    Echo,
    generate_xlsx,
    iter_items,
    timestamp_to_utc_datetime,
)
from iaso.utils import timestamp_to_datetime
from time import gmtime, strftime
import ntpath


def import_data(instances, api_import):
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
            print("file_name", file_name)
            instance_db, _ = Instance.objects.get_or_create(file_name=file_name)
            instance_db.uuid = uuid
        else:
            return Response({"res": "Problem: multiple instances exist with that uuid"})
        instance_db.name = instance.get("name", None)
        instance_db.accuracy = instance.get("accuracy", None)
        instance_db.parent_id = instance.get("parentId", None)
        tentative_org_unit_id = instance.get("orgUnitId", None)
        if str(tentative_org_unit_id).isdigit():
            instance_db.org_unit_id = tentative_org_unit_id
        else:
            print("tentative_org_unit_id", tentative_org_unit_id)
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

        instance_db.save()


class InstancesViewSet(viewsets.ViewSet):
    authentication_classes = []
    permission_classes = []

    def list(self, request):
        queryset = Instance.objects.order_by("-id")
        limit = request.GET.get("limit", None)
        as_location = request.GET.get("asLocation", None)
        page_offset = request.GET.get("page", 1)
        orders = request.GET.get("order", "updated_at").split(",")
        form_id = request.GET.get("form_id", None)
        csv_format = request.GET.get("csv", None)
        xlsx_format = request.GET.get("xlsx", None)
        with_location = request.GET.get("withLocation", None)
        org_unit_type_id = request.GET.get("orgUnitTypeId", None)
        device_id = request.GET.get("deviceId", None)
        device_ownership_id = request.GET.get("deviceOwnershipId", None)
        org_unit_parent_id = request.GET.get("orgUnitParentId", None)
        org_unit_id = request.GET.get("orgUnitId", None)

        queryset = (
            queryset.exclude(file="")
            .exclude(device__test_device=True)
            .order_by(*orders)
        )  ## quickfix to avoid updating the front, but here, we should also display entries without xml

        queryset = queryset.prefetch_related("org_unit")
        queryset = queryset.prefetch_related("org_unit__org_unit_type")
        queryset = queryset.prefetch_related("form")
        if org_unit_type_id:
            queryset = queryset.filter(org_unit__org_unit_type=org_unit_type_id)
        if org_unit_id:
            queryset = queryset.filter(org_unit_id=org_unit_id)

        if org_unit_parent_id:
            queryset = queryset.filter(
                Q(org_unit__id=org_unit_parent_id)
                | Q(org_unit__parent__id=org_unit_parent_id)
                | Q(org_unit__parent__parent__id=org_unit_parent_id)
                | Q(org_unit__parent__parent__parent__id=org_unit_parent_id)
                | Q(org_unit__parent__parent__parent__parent__id=org_unit_parent_id)
                | Q(
                    org_unit__parent__parent__parent__parent__parent__id=org_unit_parent_id
                )
                | Q(
                    org_unit__parent__parent__parent__parent__parent__parent__id=org_unit_parent_id
                )
                | Q(
                    org_unit__parent__parent__parent__parent__parent__parent__parent__id=org_unit_parent_id
                )
            )

        if with_location == "true":
            queryset = queryset.filter(location__isnull=False)

        if with_location == "false":
            queryset = queryset.filter(location__isnull=True)

        if device_id:
            queryset = queryset.filter(device__id=device_id)

        if device_ownership_id:
            device_ownership = get_object_or_404(
                DeviceOwnership, pk=device_ownership_id
            )
            queryset = queryset.filter(device__id=device_ownership.device.id)

        if form_id:
            form = Form.objects.get(pk=form_id)
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
                        for instance in queryset.filter(location__isnull=False)
                        .prefetch_related("instancefile_set")
                        .prefetch_related("device")
                        .defer("json")
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
                {"title": "Org unit", "width": 20},
                {"title": "Org unit id", "width": 20},
                {"title": "Référence externe", "width": 20},
                {"title": "parent1", "width": 20},
                {"title": "parent2", "width": 20},
                {"title": "parent3", "width": 20},
                {"title": "parent4", "width": 20},
            ]

            filename = "instances"

            if form:
                filename = "%s-%s" % (filename, form.id)

            if form and form.fields:
                file_content_template = form.fields
                for title in file_content_template:
                    columns.append({"title": title, "width": 50})
            else:
                file_content_template = queryset.first().as_dict()["file_content"]
                for title in file_content_template:
                    columns.append({"title": title, "width": 50})

            filename = "%s-%s" % (filename, strftime("%Y-%m-%d-%H-%M", gmtime()))

            def get_row(instance, **kwargs):
                idict = instance.as_dict_with_parents()
                created_at = timestamp_to_datetime(idict.get("created_at"))
                updated_at = timestamp_to_datetime(idict.get("updated_at"))
                org_unit = idict.get("org_unit")
                instance_values = [
                    idict.get("id"),
                    idict.get("latitude"),
                    idict.get("longitude"),
                    created_at,
                    updated_at,
                    org_unit.get("name") if org_unit else None,
                    org_unit.get("id") if org_unit else None,
                    org_unit.get("source_ref") if org_unit else None,
                ]

                parent = org_unit["parent"]
                for i in range(4):
                    if parent:
                        instance_values.append(parent["name"])
                        parent = parent["parent"]
                    else:
                        instance_values.append("")

                for k in file_content_template:
                    instance_values.append(idict["file_content"].get(k, None))
                return instance_values

            queryset.prefetch_related(
                "org_unit__parent__parent__parent__parent"
            ).prefetch_related("org_unit__parent__parent__parent").prefetch_related(
                "org_unit__parent__parent"
            ).prefetch_related(
                "org_unit__parent"
            ).prefetch_related(
                "org_unit"
            )

            if xlsx_format:
                filename = filename + ".xlsx"
                response = HttpResponse(
                    generate_xlsx(
                        "Forms", columns, queryset_iterator(queryset, 100), get_row
                    ),
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
        api_import = APIImport()
        if not request.user.is_anonymous:
            api_import.user = request.user
        api_import.import_type = "instance"
        api_import.json_body = instances
        api_import.save()
        try:
            import_data(instances, api_import)
            return Response({"res": "ok"})
        except Exception as e:
            print("exception", e)
            api_import.has_problem = True
            api_import.save()
            return Response({"result": "ok"})

    def retrieve(self, request, pk=None):
        instance = get_object_or_404(Instance, pk=pk)
        res = instance.as_full_model()
        return Response(res)
