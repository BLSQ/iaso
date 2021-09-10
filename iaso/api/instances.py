import pandas as pd
from django.db import connection
from django.contrib.gis.geos import Point
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.decorators import action
from rest_framework.response import Response
from hat.common.utils import queryset_iterator
from iaso.models import Instance, OrgUnit, Form, Project
from django.db.models import Q, Count
from django.core.paginator import Paginator
from time import gmtime, strftime
import ntpath
import json
from django.http import StreamingHttpResponse, HttpResponse
from hat.api.export_utils import Echo, generate_xlsx, iter_items, timestamp_to_utc_datetime
from iaso.utils import timestamp_to_datetime
from .common import safe_api_import
from .instance_filters import parse_instance_filters
from hat.audit.models import log_modification, INSTANCE_API
from rest_framework import serializers, status
import iaso.periods as periods


class InstanceSerializer(serializers.ModelSerializer):
    org_unit = serializers.PrimaryKeyRelatedField(queryset=OrgUnit.objects.all())
    period = serializers.CharField(max_length=6, allow_blank=True)

    class Meta:
        model = Instance
        fields = ["org_unit", "period", "deleted"]

    def validate_org_unit(self, value):
        """
        Check if user has acces to this org_unit.
        """
        if value.org_unit_type in self.instance.form.org_unit_types.all():
            try:
                return OrgUnit.objects.filter_for_user_and_app_id(self.context["request"].user, None).get(pk=value.pk)
            except OrgUnit.DoesNotExist:
                pass  # that way, if the condition is false, the exception is raised as well
        raise serializers.ValidationError("Org unit type not assigned to this form or not accessible to this user")

    def validate_period(self, value):
        """
        Check if period is of self.instance.form.period_type.
        """

        if self.instance.period and (periods.detect(value) == self.instance.form.period_type):
            return value
        raise serializers.ValidationError("Wrong period type")


class HasInstancePermission(permissions.BasePermission):
    def has_permission(self, request: Request, view):
        if request.method == "POST":
            return True

        return request.user.is_authenticated and request.user.has_perm("menupermissions.iaso_forms")

    def has_object_permission(self, request: Request, view, obj: Instance):
        # TODO: should not be necessary once the instances viewset uses a get_queryset that handle accounts
        return request.user.iaso_profile.account in [p.account for p in obj.form.projects.all()]


class InstancesViewSet(viewsets.ViewSet):
    """Instances API

    Posting instances can be done anonymously (if the project allows it), all other methods are restricted
    to authenticated users having the "menupermissions.iaso_forms" permission.

    GET /api/instances/
    GET /api/instances/<id>
    DELETE /api/instances/<id>
    POST /api/instances/
    """

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

        profile = request.user.iaso_profile
        queryset = queryset.filter(project__account=profile.account)

        queryset = queryset.exclude(file="").exclude(device__test_device=True)

        queryset = queryset.prefetch_related("org_unit")
        queryset = queryset.prefetch_related("org_unit__org_unit_type")
        queryset = queryset.prefetch_related("form")
        queryset = queryset.for_filters(**filters)
        queryset = queryset.order_by(*orders)

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
                        for instance in queryset.filter(Q(location__isnull=False) | Q(instancefile_count__gt=0))
                        .prefetch_related("instancefile_set")
                        .prefetch_related("device")
                        .defer("json")
                    ]
                )
            else:
                return Response({"instances": [instance.as_dict() for instance in queryset]})
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

            sub_columns = ["" for __ in columns]
            latest_form_version = form.form_versions.order_by("id").last()
            questions_by_name = latest_form_version.questions_by_name() if latest_form_version else {}
            if form and form.latest_version:
                file_content_template = questions_by_name
                for title in file_content_template:
                    sub_columns.append(file_content_template.get(title, {}).get("label", ""))
                    columns.append({"title": title, "width": 50})
            else:
                file_content_template = queryset.first().as_dict()["file_content"]
                for title in file_content_template:
                    columns.append({"title": title, "width": 50})
                    sub_columns.append(questions_by_name.get(title, {}).get("label", ""))
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
                    v = idict["file_content"].get(k, None)
                    if type(v) is list:
                        instance_values.append(json.dumps(v))
                    else:
                        instance_values.append(v)
                return instance_values

            queryset.prefetch_related("org_unit__parent__parent__parent__parent").prefetch_related(
                "org_unit__parent__parent__parent"
            ).prefetch_related("org_unit__parent__parent").prefetch_related("org_unit__parent").prefetch_related(
                "org_unit"
            )

            if xlsx_format:
                filename = filename + ".xlsx"
                response = HttpResponse(
                    generate_xlsx("Forms", columns, queryset_iterator(queryset, 100), get_row, sub_columns),
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            if csv_format:
                response = StreamingHttpResponse(
                    streaming_content=(iter_items(queryset, Echo(), columns, get_row)), content_type="text/csv"
                )
                filename = filename + ".csv"
            response["Content-Disposition"] = "attachment; filename=%s" % filename
            return response

    @safe_api_import("instance")
    def create(self, _, request):
        import_data(request.data, request.user, request.query_params.get("app_id"))

        return Response({"res": "ok"})

    def retrieve(self, request, pk=None):
        instance = get_object_or_404(Instance.objects.with_status(), pk=pk)
        self.check_object_permissions(request, instance)

        return Response(instance.as_full_model())

    def delete(self, request, pk=None):
        instance = get_object_or_404(Instance.objects.with_status(), pk=pk)
        self.check_object_permissions(request, instance)
        instance.soft_delete(request.user)
        return Response(instance.as_full_model())

    def patch(self, request, pk=None):
        original = get_object_or_404(Instance.objects.with_status(), pk=pk)
        instance = get_object_or_404(Instance.objects.with_status(), pk=pk)
        self.check_object_permissions(request, instance)
        instance_serializer = InstanceSerializer(
            instance, data=request.data, partial=True, context={"request": self.request}
        )
        instance_serializer.is_valid(raise_exception=True)
        instance_serializer.save()

        log_modification(original, instance, INSTANCE_API, user=request.user)
        return Response(instance.as_full_model())

    @action(detail=False, methods=["POST"], permission_classes=[permissions.IsAuthenticated, HasInstancePermission])
    def bulkdelete(self, request):
        select_all = request.data.get("select_all", None)
        selected_ids = request.data.get("selected_ids", None)
        unselected_ids = request.data.get("unselected_ids", None)
        is_deletion = request.data.get("is_deletion", True)
        filters = parse_instance_filters(request.data)
        instances_query = Instance.objects.order_by("-id")
        profile = request.user.iaso_profile
        instances_query = instances_query.filter(project__account=profile.account)
        instances_query = instances_query.prefetch_related("form")
        instances_query = instances_query.exclude(file="").exclude(device__test_device=True)
        instances_query = instances_query.for_filters(**filters)
        if not select_all:
            instances_query = instances_query.filter(pk__in=selected_ids)
        else:
            instances_query = instances_query.exclude(pk__in=unselected_ids)

        try:
            instances_query.update(deleted=is_deletion)
        except Exception as e:
            return Response(
                {"result": "A problem happened while deleting instances"}, status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {
                "result": "success",
            },
            status=201,
        )

    QUERY = """
    select DATE_TRUNC('month', created_at) as month,
           (select name from iaso_form where id = iaso_instance.form_id),
           count(*)                        as value
    from iaso_instance
    where created_at > '2019-01-01'
      and project_id = ANY (%s)
      and form_id is not null
    group by DATE_TRUNC('month', created_at), form_id
    order by DATE_TRUNC('month', created_at)"""

    @action(detail=False)
    def stats(self, request):
        projects = request.user.iaso_profile.account.project_set.all()
        projects_ids = list(projects.values_list("id", flat=True))

        df = pd.read_sql_query(self.QUERY, connection, params=[projects_ids])
        df = df.pivot(index="month", columns="name", values="value")
        if not df.empty:
            df.index = df.index.to_period("M")
            df = df.sort_index()
            df = df.reindex(pd.period_range(df.index[0], df.index[-1], freq="M"))
            df["name"] = df.index.astype(str)
        r = df.to_json(orient="table")
        return HttpResponse(r, content_type="application/json")

    @action(detail=False)
    def stats_sum(self, request):
        projects = request.user.iaso_profile.account.project_set.all()
        projects_ids = list(projects.values_list("id", flat=True))
        QUERY = """
        select DATE_TRUNC('day', created_at) as period,
        count(*)                        as value
        from iaso_instance
        where created_at > now() - interval '2700 days'
        and project_id = ANY (%s)
        group by DATE_TRUNC('day', created_at)
        order by 1"""
        df = pd.read_sql_query(QUERY, connection, params=[projects_ids])
        df["total"] = df["value"].cumsum()
        df["name"] = df["period"].apply(lambda x: x.strftime("%Y-%m-%d"))
        r = df.to_json(orient="table")
        return HttpResponse(r, content_type="application/json")


def import_data(instances, user, app_id):
    project = Project.objects.get_for_user_and_app_id(user, app_id)

    for instance_data in instances:
        uuid = instance_data.get("id", None)

        if Instance.objects.filter(uuid=uuid).exists():
            continue

        # Get or create instance based on file_name - this "get or create" logic is important:
        # it is possible (although it won't happen often) that the instance has already been created by the
        # POST /sync/ endpoint.
        file_name = ntpath.basename(instance_data.get("file", None))
        instance, _ = Instance.objects.get_or_create(file_name=file_name)

        instance.uuid = uuid
        instance.project = project
        instance.name = instance_data.get("name", None)
        instance.period = instance_data.get("period", None)
        instance.accuracy = instance_data.get("accuracy", None)

        tentative_org_unit_id = instance_data.get("orgUnitId", None)
        if str(tentative_org_unit_id).isdigit():
            instance.org_unit_id = tentative_org_unit_id
        else:
            org_unit = OrgUnit.objects.get(uuid=tentative_org_unit_id)
            instance.org_unit = org_unit

        instance.form_id = instance_data.get("formId")

        created_at_ts = instance_data.get("created_at", None)
        instance.created_at = timestamp_to_utc_datetime(int(created_at_ts)) if created_at_ts is not None else None

        updated_at_ts = instance_data.get("updated_at", None)
        instance.updated_at = (
            timestamp_to_utc_datetime(int(updated_at_ts)) if updated_at_ts is not None else instance.created_at
        )

        latitude = instance_data.get("latitude", None)
        longitude = instance_data.get("longitude", None)
        if latitude and longitude:
            altitude = instance_data.get("altitude", 0)
            instance.location = Point(x=longitude, y=latitude, z=altitude, srid=4326)

        instance.save()
