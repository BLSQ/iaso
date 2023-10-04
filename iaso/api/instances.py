import json
import ntpath
from time import gmtime, strftime
from typing import Dict, Any, Union

import pandas as pd
from django.contrib.auth.models import User
from django.contrib.gis.geos import Point
from django.core.paginator import Paginator
from django.db import connection
from django.db import transaction
from django.db.models import Q, Count, QuerySet
from django.http import StreamingHttpResponse, HttpResponse
from django.utils.timezone import now
from rest_framework import serializers, status
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response
from typing_extensions import Annotated, TypedDict

import iaso.periods as periods
from hat.api.export_utils import Echo, generate_xlsx, iter_items, timestamp_to_utc_datetime
from hat.audit.models import log_modification, INSTANCE_API
from hat.common.utils import queryset_iterator
from iaso.api.serializers import OrgUnitSerializer
from iaso.models import (
    Instance,
    OrgUnit,
    Project,
    InstanceFile,
    InstanceQuerySet,
    InstanceLock,
    Entity,
)
from iaso.utils import timestamp_to_datetime
from . import common
from .comment import UserSerializerForComment
from .common import safe_api_import, TimestampField, FileFormatEnum, CONTENT_TYPE_XLSX, CONTENT_TYPE_CSV
from .instance_filters import parse_instance_filters, get_form_from_instance_filters
from hat.menupermissions import models as permission


class InstanceSerializer(serializers.ModelSerializer):
    org_unit = serializers.PrimaryKeyRelatedField(queryset=OrgUnit.objects.all())
    period = serializers.CharField(max_length=8, allow_blank=True)

    class Meta:
        model = Instance
        fields = ["org_unit", "period", "deleted", "last_modified_by"]

    def validate_org_unit(self, value):
        """Check if user has access to this org_unit."""
        # Prevent IA-928: Don't revalidate org unit if it's not modified. As the allowed Type on form or the type
        #  on the org unit can change
        if self.instance and self.instance.org_unit == value:
            return value
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

        if periods.detect(value) == self.instance.form.period_type:
            return value
        raise serializers.ValidationError(
            f"Wrong period type, expecting: {self.instance.form.period_type}. Received type: {periods.detect(value)}"
        )


class HasInstancePermission(permissions.BasePermission):
    def has_permission(self, request: Request, view):
        if request.method == "POST":
            return True

        return request.user.is_authenticated and (
            request.user.has_perm(permission.FORMS)
            or request.user.has_perm(permission.SUBMISSIONS)
            or request.user.has_perm(permission.REGISTRY)
        )

    def has_object_permission(self, request: Request, view, obj: Instance):
        # Depends on the Queryset having been filtered previously
        self.has_permission(request, view)
        if request.method in permissions.SAFE_METHODS:
            return True
        # if request.user.has_perm("menupermission.iaso_update_submission") and obj.can_user_modify(request.user):
        if obj.can_user_modify(request.user):
            return True
        return False


class InstanceFileSerializer(serializers.Serializer):
    instance_id = serializers.IntegerField()
    file = serializers.FileField(use_url=True)
    created_at = TimestampField(read_only=True)


class OrgUnitNestedSerializer(OrgUnitSerializer):
    class Meta:
        model = OrgUnit

        fields = [
            "id",
            "name",
        ]


# For readonly use
class InstanceLockSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstanceLock
        fields = ["id", "top_org_unit", "locked_by", "locked_at", "unlocked_by", "locked_by"]
        read_only_fields = ["locked_at", "locked_by"]

    # TODO: can we use the generic UserSerializer to keeps things less interleaved?
    locked_by = UserSerializerForComment(read_only=True)
    unlocked_by = UserSerializerForComment(read_only=True)
    top_org_unit = OrgUnitNestedSerializer(read_only=True)


class UnlockSerializer(serializers.Serializer):
    lock = serializers.PrimaryKeyRelatedField(queryset=InstanceLock.objects.all())
    # we will  check that the user can access from the directly in remove_lock()


class LockAnnotation(TypedDict):
    count_lock_applying_to_user: int
    count_active_lock: int


class InstancesViewSet(viewsets.ViewSet):
    f"""Instances API

    Posting instances can be done anonymously (if the project allows it), all other methods are restricted
    to authenticated users having the "{permission.FORMS}" permission.

    GET /api/instances/
    GET /api/instances/<id>
    DELETE /api/instances/<id>
    POST /api/instances/
    PATCH /api/instances/<id>
    """

    permission_classes = [HasInstancePermission]

    def get_queryset(self):
        request = self.request
        queryset: InstanceQuerySet = Instance.objects.order_by("-id")
        queryset = queryset.filter_for_user(request.user)
        return queryset

    @action(["GET"], detail=False)
    def attachments(self, request):
        instances = self.get_queryset()
        filters = parse_instance_filters(request.GET)
        instances = instances.for_filters(**filters)
        queryset = InstanceFile.objects.filter(instance__in=instances)

        paginator = common.Paginator()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = InstanceFileSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = InstanceFileSerializer(queryset, many=True)
        return Response(serializer.data)

    @staticmethod
    def list_file_export(filters: Dict[str, Any], queryset: "QuerySet[Instance]", file_format: FileFormatEnum):
        """WIP: Helper function to divide the huge list method"""
        columns = [
            {"title": "ID du formulaire", "width": 20},
            {"title": "Version du formulaire", "width": 20},
            {"title": "Export id", "width": 20},
            {"title": "Latitude", "width": 40},
            {"title": "Longitude", "width": 20},
            {"title": "Altitude", "width": 20},
            {"title": "Précision", "width": 20},
            {"title": "Période", "width": 20},
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

        form = get_form_from_instance_filters(filters)

        if form:
            filename = "%s-%s" % (filename, form.id)
            if form.correlatable:
                columns.append({"title": "correlation id", "width": 20})

        sub_columns = ["" for __ in columns]
        # TODO: Check the logic here, it's going to fail in any case if there is no form
        # Don't know what we are trying to achieve exactly
        # The type ignore is obviously wrong since the type can be null, but the frontend always send forms.
        latest_form_version = form.latest_version  # type: ignore
        questions_by_name = latest_form_version.questions_by_name() if latest_form_version else {}
        if form and latest_form_version:
            file_content_template = questions_by_name
            for title in file_content_template:
                # some form have dict as label to support MuliLang. So convert to String
                # e.g. Vaccine Stock Monitoring {'French': 'fin', 'English': 'end'}
                label = file_content_template.get(title, {}).get("label", "")
                if isinstance(label, dict):
                    label = str(label)
                sub_columns.append(label)
                columns.append({"title": title, "width": 50})
        else:
            file_content_template = queryset.first().as_dict()["file_content"]  # type: ignore
            for title in file_content_template:
                columns.append({"title": title, "width": 50})
                sub_columns.append(questions_by_name.get(title, {}).get("label", ""))

        filename = "%s-%s" % (filename, strftime("%Y-%m-%d-%H-%M", gmtime()))

        def get_row(instance, **kwargs):
            idict = instance.as_dict_with_parents()
            created_at = timestamp_to_datetime(idict.get("created_at"))
            updated_at = timestamp_to_datetime(idict.get("updated_at"))
            org_unit = idict.get("org_unit")
            file_content = idict.get("file_content")

            instance_values = [
                idict.get("id"),
                file_content.get("_version") if file_content else None,
                idict.get("export_id"),
                idict.get("latitude"),
                idict.get("longitude"),
                idict.get("altitude"),
                idict.get("accuracy"),
                idict.get("period"),
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
        ).prefetch_related("org_unit__parent__parent").prefetch_related("org_unit__parent").prefetch_related("org_unit")

        response: Union[HttpResponse, StreamingHttpResponse]
        if file_format == FileFormatEnum.XLSX:
            filename = filename + ".xlsx"
            response = HttpResponse(
                generate_xlsx("Forms", columns, queryset_iterator(queryset, 100), get_row, sub_columns),
                content_type=CONTENT_TYPE_XLSX,
            )
        elif file_format == FileFormatEnum.CSV:
            filename = filename + ".csv"
            response = StreamingHttpResponse(
                streaming_content=(iter_items(queryset, Echo(), columns, get_row)), content_type=CONTENT_TYPE_CSV
            )
        else:
            raise ValueError(f"Unknown file format requested: {file_format}")

        response["Content-Disposition"] = "attachment; filename=%s" % filename
        return response

    def list(self, request):
        """List instances: this endpoint is used for both searches and file exports"""

        # 1. Get data out of the request
        limit = request.GET.get("limit", None)
        as_small_dict = request.GET.get("asSmallDict", None)
        page_offset = request.GET.get("page", 1)
        orders = request.GET.get("order", "updated_at").split(",")
        csv_format = request.GET.get("csv", None)
        xlsx_format = request.GET.get("xlsx", None)
        filters = parse_instance_filters(request.GET)
        org_unit_status = request.GET.get("org_unit_status", None)  # "NEW", "VALID", "REJECTED"
        with_descriptor = request.GET.get("with_descriptor", "false")

        file_export = False
        if csv_format is not None or xlsx_format is not None:
            file_export = True
            file_format_export = FileFormatEnum.CSV if csv_format is not None else FileFormatEnum.XLSX

        # 2. Prepare queryset (common part between searches and exports)
        queryset = self.get_queryset()
        queryset = queryset.exclude(file="").exclude(device__test_device=True)
        queryset = queryset.prefetch_related("org_unit__reference_instances")
        queryset = queryset.prefetch_related("org_unit__version__data_source")
        queryset = queryset.prefetch_related("org_unit__org_unit_type__reference_forms")
        queryset = queryset.prefetch_related("form")
        queryset = queryset.prefetch_related("created_by")
        queryset = queryset.for_filters(**filters)
        queryset = queryset.order_by(*orders)
        # IA-1023 = allow to sort instances by form version

        # TODO: this function would deserve some more thorough refactor, see the discussion at
        #  https://bluesquare.atlassian.net/browse/IA-1547. Some things were cleaned already, but it would make sense
        #  to change it so:
        #  - 1) the same queryset is prepared at the beginning of the function, then used in all cases (searches,
        #       exports, paginated or not, as small dict or not)
        #  - 2) the limit and asSmallDict parameters are independent from each other (the consumer can choose to use
        #       one, both or None and get predictable results)
        if org_unit_status:
            queryset = queryset.filter(org_unit__validation_status=org_unit_status)

        if not file_export:
            if limit:
                limit = int(limit)
                page_offset = int(page_offset)

                queryset = queryset.with_lock_info(user=request.user)

                paginator = Paginator(queryset, limit)
                res = {"count": paginator.count}
                if page_offset > paginator.num_pages:
                    page_offset = paginator.num_pages
                page = paginator.page(page_offset)

                def as_dict_formatter(instance: Annotated[Instance, LockAnnotation]) -> Dict:
                    d = instance.as_dict_with_descriptor() if with_descriptor == "true" else instance.as_dict()
                    d["can_user_modify"] = instance.count_lock_applying_to_user == 0
                    d["is_locked"] = instance.count_active_lock > 0
                    d["is_instance_of_reference_form"] = instance.is_instance_of_reference_form
                    d["is_reference_instance"] = instance.is_reference_instance
                    return d

                res["instances"] = map(as_dict_formatter, page.object_list)
                res["has_next"] = page.has_next()
                res["has_previous"] = page.has_previous()
                res["page"] = page_offset
                res["pages"] = paginator.num_pages
                res["limit"] = limit

                return Response(res)
            elif as_small_dict:
                # TODO: apparently, this branch is not used by the frontend nor the mobile app
                queryset = (
                    queryset.annotate(instancefile_count=Count("instancefile"))
                    .filter(Q(location__isnull=False) | Q(instancefile_count__gt=0))
                    .prefetch_related("instancefile_set")
                    .prefetch_related("device")
                    .defer("json")
                )
                return Response([instance.as_small_dict() for instance in queryset])
            else:
                return Response(
                    {
                        "instances": [
                            instance.as_dict_with_descriptor() if with_descriptor == "true" else instance.as_dict()
                            for instance in queryset
                        ]
                    }
                )
        else:  # This is a CSV/XLSX file export
            return self.list_file_export(filters=filters, queryset=queryset, file_format=file_format_export)

    @action(detail=True, methods=["POST"])
    def add_lock(self, request, pk):
        # would use get_object usually, but we are not in a ModelViewSet
        instance = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, instance)
        new_lock = self.add_lock_instance(instance, request.user)
        return Response({"status": "lock added", "lock_id": new_lock.id})

    # @action(detail=False, methods=["POST"], serializer_class = UnlockSerializer)
    @action(detail=False, methods=["POST"])
    def unlock_lock(self, request):
        serializer = UnlockSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lock = serializer.validated_data["lock"]
        self.check_object_permissions(request, lock.instance)
        self._unlock_lock(request.user, lock)
        return Response({"status": "lock removed", "lock_id": lock.id})

    def add_lock_instance(self, instance: Instance, user):
        #  OrgUnit in the user org unit that's the highest
        user_orgunits = user.iaso_profile.org_units
        # user orgunit that contain the instance's orgunit and is the highest level.
        if not user_orgunits.exists():
            # user is not restricted to any orgunit, use the root that contain the instance
            # FIXME: what if instance.org_unit is None?
            top_level = OrgUnit.objects.filter(path__ancestors=instance.org_unit.path).order_by("path__depth").first()  # type: ignore
        else:
            # FIXME: what if instance.org_unit is None?
            top_level = user_orgunits.filter(path__ancestors=instance.org_unit.path).order_by("path__depth").first()  # type: ignore
        assert top_level, "No intersection found"  # should not happen

        lock = InstanceLock.objects.create(locked_by=user, top_org_unit=top_level, instance=instance)
        return lock

    def _unlock_lock(self, user: User, lock):
        # Can user modify this instance

        # is lock actually locked, should not happen in the ui normally
        if lock.unlocked_by is not None:
            raise serializers.ValidationError({"lock": "Lock already unlocked"})

        lock.unlocked_by = user
        lock.unlocked_at = now()
        lock.save()

    @safe_api_import("instance")
    def create(self, _, request):
        import_data(request.data, request.user, request.query_params.get("app_id"))

        return Response({"res": "ok"})

    def retrieve(self, request, pk=None):
        self.get_queryset().prefetch_related(
            "instance_locks",
            "instance_locks__top_org_unit",
            "instance_locks__user",
            "org_unit__reference_instances",
            "org_unit__org_unit_type__reference_forms",
        )
        instance: Instance = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, instance)
        all_instance_locks = instance.instancelock_set.all()

        response = instance.as_full_model()

        # Logs(history) of all instance locks
        response["instance_locks"] = InstanceLockSerializer(all_instance_locks, many=True).data
        # To display the Lock or unlock icon when the use has access to the two actions
        response["can_user_modify"] = instance.can_user_modify(request.user)
        # To display either the "unlock" or the "lock" icon depending on if the instance is already lock or not
        response["is_locked"] = any(lock.unlocked_by is None for lock in all_instance_locks)

        response["is_instance_of_reference_form"] = instance.is_instance_of_reference_form
        response["is_reference_instance"] = instance.is_reference_instance

        return Response(response)

    def delete(self, request, pk=None):
        instance = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, instance)
        instance.soft_delete(request.user)
        return Response(instance.as_full_model())

    def patch(self, request, pk=None):
        original = get_object_or_404(self.get_queryset(), pk=pk)
        instance = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, instance)
        data = {
            **request.data,
            "last_modified_by": request.user.id,
        }
        instance_serializer = InstanceSerializer(instance, data=data, partial=True, context={"request": self.request})
        instance_serializer.is_valid(raise_exception=True)
        access_ou = OrgUnit.objects.filter_for_user_and_app_id(request.user, None)
        data_org_unit = request.data.get("org_unit", None)

        if instance.org_unit not in access_ou:
            raise serializers.ValidationError({"error": "You don't have the permission to modify this instance."})

        # If the org unit change but the instance was marked as the reference_instance for this org unit,
        # remove the reference as reference instance
        # FIXME we should log the modification on org unit
        if (original.org_unit_id != data_org_unit) and original.is_reference_instance:
            previous_orgunit = original.org_unit
            original.unflag_reference_instance(previous_orgunit)
            previous_orgunit.save()
        instance_serializer.save()

        instance.last_modified_by = request.user
        instance.save()
        log_modification(original, instance, INSTANCE_API, user=request.user)
        return Response(instance.as_full_model())

    @action(detail=False, methods=["POST"], permission_classes=[permissions.IsAuthenticated, HasInstancePermission])
    def bulkdelete(self, request):
        select_all = request.data.get("select_all", None)
        selected_ids = request.data.get("selected_ids", None)
        unselected_ids = request.data.get("unselected_ids", None)
        is_deletion = request.data.get("is_deletion", True)

        filters = parse_instance_filters(request.data)
        instances_query = self.get_queryset()
        instances_query = instances_query.prefetch_related("form")
        instances_query = instances_query.exclude(file="").exclude(device__test_device=True)
        instances_query = instances_query.for_filters(**filters)
        if not select_all:
            instances_query = instances_query.filter(pk__in=selected_ids)
        else:
            instances_query = instances_query.exclude(pk__in=unselected_ids)
        for instance in instances_query:
            self.check_object_permissions(request, instance)

        try:
            with transaction.atomic():
                for instance in instances_query.iterator():
                    if is_deletion == True:
                        instance.soft_delete(request.user)
                    else:
                        instance.restore(request.user)

        except Exception as e:
            print(f"Error : {e}")
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
    select DATE_TRUNC('month', iaso_instance.created_at) as month,
           (select name from iaso_form where id = iaso_instance.form_id) as form_name,
           iaso_instance.form_id,
           count(*)                        as value
    from iaso_instance
    left join iaso_form on (iaso_form.id = iaso_instance.form_id)
    where iaso_instance.created_at > '2019-01-01'
      and project_id = ANY (%s)
      and iaso_instance.form_id is not null
      and iaso_instance.deleted =  false
      and iaso_form.deleted_at is null
    group by DATE_TRUNC('month', iaso_instance.created_at), iaso_instance.form_id
    order by DATE_TRUNC('month', iaso_instance.created_at)"""

    @action(detail=False)
    def stats(self, request):
        projects = request.user.iaso_profile.account.project_set.all()
        projects_ids = list(projects.values_list("id", flat=True))

        df = pd.read_sql_query(self.QUERY, connection, params=[projects_ids])
        # Keep the form name
        names = df[["form_id", "form_name"]].drop_duplicates().set_index("form_id")
        names_dict = names["form_name"].to_dict()

        # Pivot on the form_id because there might be form with duplicate name
        df = df.pivot(index="month", columns="form_id", values="value")
        if not df.empty:
            df.index = df.index.to_period("M")
            df = df.sort_index()
            df = df.reindex(pd.period_range(df.index[0], df.index[-1], freq="M"))
            df["name"] = df.index.astype(str)  # Name column is the month
            df = df.rename(columns=names_dict)
        r = df.to_json(orient="table")
        return HttpResponse(r, content_type="application/json")

    @action(detail=False)
    def stats_sum(self, request):
        projects = request.user.iaso_profile.account.project_set.all()
        projects_ids = list(projects.values_list("id", flat=True))
        QUERY = """
        select DATE_TRUNC('day', iaso_instance.created_at) as period,
        count(*)                        as value
        from iaso_instance
        left join iaso_form on (iaso_form.id = iaso_instance.form_id)
        where iaso_instance.created_at > now() - interval '2700 days'
        and project_id = ANY (%s)
        and iaso_instance.deleted = false
        and iaso_form.deleted_at is null
        group by DATE_TRUNC('day', iaso_instance.created_at)
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

        # TODO: check that planning_id is valid
        instance.planning_id = instance_data.get("planningId", None)
        entityUuid = instance_data.get("entityUuid", None)
        entityTypeId = instance_data.get("entityTypeId", None)
        if entityUuid and entityTypeId:
            entity, created = Entity.objects.get_or_create(
                uuid=entityUuid, entity_type_id=entityTypeId, account=project.account
            )
            instance.entity = entity
            # If instance's form is a reference form, set the instance as reference_instance
            if entity.entity_type.reference_form == instance.form:
                entity.attributes = instance
                entity.save()

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
