from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters, permissions, serializers
from rest_framework.exceptions import AuthenticationFailed, NotFound, ParseError
from rest_framework.pagination import PageNumberPagination

from iaso.api.common import DeletionFilterBackend, HasPermission, ModelViewSet, Paginator, TimestampField
from iaso.api.query_params import LIMIT, PAGE
from iaso.api.serializers import AppIdSerializer
from iaso.models import Entity, EntityType, FormVersion, Instance, Project
from iaso.models.entity import InvalidJsonContentError, InvalidLimitDateError, ProjectNotFoundError, UserNotAuthError
from iaso.permissions.core_permissions import CORE_ENTITIES_PERMISSION


def filter_for_mobile_entity(queryset, request):
    if queryset:
        try:
            queryset = queryset.filter_for_mobile_entity(
                request.query_params.get("limit_date"), request.query_params.get("json_content")
            )
        except InvalidLimitDateError as e:
            raise ParseError(e.message)
        except InvalidJsonContentError as e:
            raise ParseError(e.message)

    return queryset


def filter_on_app_id(queryset, user, app_id):
    try:
        return queryset.filter_for_app_id(user, app_id)
    except ProjectNotFoundError as e:
        raise NotFound(e.message)
    except UserNotAuthError as e:
        raise AuthenticationFailed(e.message)


def filter_on_user_and_app_id(queryset, user, app_id):
    try:
        return queryset.filter_for_user_and_app_id(user, app_id)
    except ProjectNotFoundError as e:
        raise NotFound(e.message)
    except UserNotAuthError as e:
        raise AuthenticationFailed(e.message)


class LargeResultsSetPagination(PageNumberPagination):
    page_size = 1000
    page_size_query_param = LIMIT
    page_query_param = PAGE
    max_page_size = 1000


class MobileEntityAttributesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Instance
        fields = [
            "id",
            "form_id",
            "form_version_id",
            "created_at",
            "updated_at",
            "org_unit_id",
            "json",
        ]

    form_id = serializers.IntegerField(read_only=True)
    id = serializers.CharField(read_only=True, source="uuid")
    org_unit_id = serializers.CharField(read_only=True)
    form_version_id = serializers.SerializerMethodField()
    created_at = TimestampField(read_only=True, source="source_created_at_with_fallback")
    updated_at = TimestampField(read_only=True, source="source_updated_at_with_fallback")

    def get_form_version_id(self, obj):
        if obj.json is None:
            return None
        possible_form_versions = self.context.get("possible_form_versions")
        key = "%s|%s" % (obj.json.get("_version"), str(obj.form.id))
        return possible_form_versions.get(key)


class MobileEntitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entity
        fields = [
            "id",
            "created_at",
            "updated_at",
            "defining_instance_id",
            "entity_type_id",
            "instances",
        ]

    created_at = TimestampField()
    updated_at = TimestampField()

    instances = serializers.SerializerMethodField()
    id = serializers.CharField(read_only=True, source="uuid")
    defining_instance_id = serializers.CharField(read_only=True, source="attributes.uuid")
    entity_type_id = serializers.CharField(read_only=True, source="entity_type.id")

    def get_instances(self, entity):
        possible_form_versions = self.context.get("possible_form_versions")
        ok_instances = []

        for inst in entity.instances.all():
            if inst.deleted == False:
                if not inst.json:
                    continue

                key = "%s|%s" % (inst.json.get("_version"), str(inst.form_id))
                form_version = possible_form_versions.get(key, None)

                if form_version is not None:
                    ok_instances.append(inst)

        return MobileEntityAttributesSerializer(ok_instances, many=True, context=self.context).data  # type: ignore

    @staticmethod
    def get_entity_type_name(obj: Entity):
        return obj.entity_type.name if obj.entity_type else None


class MobileEntitiesSetPagination(Paginator):
    page_size_query_param = LIMIT
    page_query_param = PAGE
    page_size = 1000
    max_page_size = 1000

    def get_iaso_page_number(self, request):
        return int(request.query_params.get(self.page_query_param, 1))


class MobileEntityViewSet(ModelViewSet):
    f"""Entity API for mobile

    list: /api/mobile/entities

    pagination by default: 1000 entities

    It's possible to filter out entities with no activity before a certain date with the parameter limit_date

    details = /api/mobile/entities/uuid

    sample usage: /api/mobile/entities/?limit_date=2022-12-29&{LIMIT}=1&{PAGE}=1

    """

    results_key = "results"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend, DeletionFilterBackend]
    permission_classes = [permissions.IsAuthenticated, HasPermission(CORE_ENTITIES_PERMISSION)]

    def pagination_class(self):
        return MobileEntitiesSetPagination(self.results_key)

    lookup_field = "uuid"

    def get_serializer_class(self):
        return MobileEntitySerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        user = self.request.user

        qs = FormVersion.objects.filter(form__projects__account=user.iaso_profile.account).values_list(
            "version_id", "form_id", "id"
        )

        context["possible_form_versions"] = {
            f"{version_id}|{form_id}": version_pk for version_id, form_id, version_pk in qs
        }

        return context

    def get_queryset(self):
        user = self.request.user
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=True)

        project = Project.objects.get_for_user_and_app_id(user, app_id)

        entity_types = EntityType.objects.filter(reference_form__projects=project).only("id")

        queryset = Entity.objects.filter(entity_type__in=entity_types)

        queryset = filter_on_user_and_app_id(queryset, user, app_id)
        queryset = filter_for_mobile_entity(queryset, self.request)

        queryset = queryset.select_related("entity_type", "attributes").prefetch_related("instances")
        queryset = queryset.distinct("id")
        return queryset.order_by("id")


class DeletedMobileEntitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entity
        fields = ["id", "uuid", "deleted_at", "merged_to_uuid", "entity_type_id"]

    deleted_at = TimestampField()
    merged_to_uuid = serializers.SerializerMethodField()

    def get_merged_to_uuid(self, entity):
        if entity.merged_to:
            return entity.merged_to.uuid


class MobileEntityDeletedViewSet(ModelViewSet):
    """Entity API for mobile

    list: /api/mobile/entities/deleted

    Returns the full list of (soft-) deleted entities.
    No pagination at the moment to keep thing simple.
    """

    results_key = "results"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(CORE_ENTITIES_PERMISSION),
    ]

    def pagination_class(self):
        return MobileEntitiesSetPagination(self.results_key)

    def get_serializer_class(self):
        return DeletedMobileEntitySerializer

    def get_queryset(self):
        user = self.request.user
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=True)

        queryset = Entity.objects_only_deleted
        queryset = filter_on_user_and_app_id(queryset, user, app_id)

        return (
            queryset.prefetch_related("merged_to")
            .only(
                "id",
                "uuid",
                "deleted_at",
                "merged_to_id",
                "entity_type_id",
            )
            .order_by("id")
        )
