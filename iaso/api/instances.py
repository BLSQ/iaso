from django.contrib.gis.geos import Point
from rest_framework import viewsets, permissions
from rest_framework.request import Request
from rest_framework.response import Response
from django.http import Http404
from hat.common.utils import queryset_iterator
from hat.vector_control.models import APIImport
from iaso.models import Instance, OrgUnit, Form, Project
from django.db.models import Q, Count
from django.core.exceptions import PermissionDenied
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

from .instance_filters import parse_instance_filters


class HasInstancePermission(permissions.BasePermission):
    """Rules:

    - POSTing instances can be done anonymously
    - Other methods require authentication
    - Actions on specific instance can only be performed by users linked to an account associated with one of the form
      projects
    """

    def has_permission(self, request: Request, view):
        if request.method == "POST":  # Allow anonymous instance creation - mobile app
            return True

        return request.user.is_authenticated and request.user.has_perm(
            "menupermissions.iaso_forms"
        )

    def has_object_permission(self, request: Request, view, obj: Instance):
        return request.user.iaso_profile.account == obj.project.account


def import_data(instances, api_import, app_id=None):
    try:
        project = Project.objects.get(app_id=app_id)
    except Project.DoesNotExist:
        project = None

    if project and project.needs_authentication:
        user = api_import.user
        if (
            not user
            or user.is_anonymous
            or project.account.id != user.iaso_profile.account.id
        ):
            raise PermissionDenied("User permission problem")

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
            return Response({"res": "Problem: multiple instances exist with that uuid"})
        instance_db.name = instance.get("name", None)
        instance_db.period = instance.get("period", None)
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
        instance_db.project = project
        instance_db.save()


class InstancesViewSet(viewsets.ViewSet):
    permission_classes = [HasInstancePermission]

    def list(self, request):
        limit = request.GET.get("limit", None)
        as_small_dict = request.GET.get("asSmallDict", None)
        page_offset = request.GET.get("page", 1)
        orders = request.GET.get("order", "updated_at").split(",")
        csv_format = request.GET.get("csv", None)
        xlsx_format = request.GET.get("xlsx", None)

        filters = parse_instance_filters(request.GET)

        form_id = filters["form_id"]
        if form_id:
            form = Form.objects.get(pk=form_id)

        queryset = Instance.objects.order_by("-id")
        if not request.user.is_anonymous:
            profile = request.user.iaso_profile
            queryset = queryset.filter(project__account=profile.account)
        else:
            raise PermissionDenied("Please log in")

        queryset = (
            queryset.exclude(file="")
            .exclude(device__test_device=True)
            .order_by(*orders)
        )

        queryset = queryset.prefetch_related("org_unit")
        queryset = queryset.prefetch_related("org_unit__org_unit_type")
        queryset = queryset.prefetch_related("form")

        queryset = queryset.for_filters(**filters)

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
            elif as_small_dict:
                queryset = queryset.annotate(instancefile_count=Count("instancefile"))
                return Response(
                    [
                        instance.as_small_dict()
                        for instance in queryset.filter(
                            Q(location__isnull=False) | Q(instancefile_count__gt=0)
                        )
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
                {"title": "Export id", "width": 20},
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
                if form.correlatable:
                    columns.append({"title": "correlation id", "width": 20})

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
                    idict.get("export_id"),
                    idict.get("latitude"),
                    idict.get("longitude"),
                    created_at,
                    updated_at,
                    org_unit.get("name") if org_unit else None,
                    org_unit.get("id") if org_unit else None,
                    org_unit.get("source_ref") if org_unit else None,
                ]

                parent = org_unit["parent"] if org_unit else None
                for i in range(4):
                    if parent:
                        instance_values.append(parent["name"])
                        parent = parent["parent"]
                    else:
                        instance_values.append("")
                if instance.form.correlatable:
                    instance_values.append(instance.correlation_id)

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
        app_id = request.GET.get("app_id", "org.bluesquarehub.iaso")
        api_import.import_type = "instance"
        api_import.json_body = instances
        api_import.save()
        try:
            import_data(instances, api_import, app_id)
            print("imported")
            return Response({"res": "ok"})
        except Exception as e:
            print("exception", e)
            api_import.has_problem = True
            api_import.save()
            return Response({"result": "ok"})

    def retrieve(self, _, pk=None):
        try:
            instance = Instance.objects.with_status().get(pk=pk)
        except:
            raise Http404

        res = instance.as_full_model()
        return Response(res)
