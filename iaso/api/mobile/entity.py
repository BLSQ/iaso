from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters, serializers
from rest_framework.pagination import PageNumberPagination
from rest_framework import permissions
from rest_framework.exceptions import ParseError, AuthenticationFailed, NotFound


from iaso.api.common import DeletionFilterBackend, ModelViewSet, TimestampField, HasPermission
from iaso.api.query_params import LIMIT, PAGE
from iaso.models import Entity, FormVersion, Instance, OrgUnit
from iaso.models.entity import (
    InvalidJsonContentError,
    InvalidLimitDateError,
    ProjectNotFoundAndUserNotAuthError,
    ProjectWithoutAccountAndUserNotAuthError,
)


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


def get_queryset_for_user_and_app_id(user, app_id):
    try:
        queryset = Entity.objects.filter_for_user_and_app_id(user, app_id)
    except ProjectNotFoundAndUserNotAuthError as e:
        raise NotFound(e.message)
    except ProjectWithoutAccountAndUserNotAuthError as e:
        raise AuthenticationFailed(e.message)

    return queryset


class LargeResultsSetPagination(PageNumberPagination):
    page_size = 1000
    page_size_query_param = LIMIT
    page_query_param = PAGE
    max_page_size = 1000


class MobileEntityAttributesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Instance
        fields = ["id", "form_id", "form_version_id", "created_at", "updated_at", "org_unit_id", "json"]

    form_id = serializers.IntegerField(read_only=True, source="form.id")
    id = serializers.CharField(read_only=True, source="uuid")
    org_unit_id = serializers.CharField(read_only=True, source="org_unit.id")
    form_version_id = serializers.SerializerMethodField()

    created_at = TimestampField()
    updated_at = TimestampField()

    @staticmethod
    def get_form_version_id(obj: Instance):
        if obj.json is None:
            return None
        return FormVersion.objects.get(version_id=obj.json.get("_version"), form_id=obj.form.id).id  # type: ignore


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

    @staticmethod
    def get_instances(entity: Entity):
        return MobileEntityAttributesSerializer(entity.instances.filter(deleted=False), many=True).data  # type: ignore

    @staticmethod
    def get_entity_type_name(obj: Entity):
        return obj.entity_type.name if obj.entity_type else None


class MobileEntityViewSet(ModelViewSet):
    f"""Entity API for mobile

    list: /api/mobile/entities

    pagination by default: 1000 entities

    It's possible to filter out entities with no activity before a certain date with the parameter limit_date

    details = /api/mobile/entities/uuid

    sample usage: /api/mobile/entities/?limit_date=2022-12-29&{LIMIT}=1&{PAGE}=1

    """

    results_key = "entities"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend, DeletionFilterBackend]
    pagination_class = LargeResultsSetPagination
    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_entities")]
    lookup_field = "uuid"

    def get_serializer_class(self):
        return MobileEntitySerializer

    def get_queryset(self):
        user = self.request.user
        app_id = self.request.query_params.get("app_id")

        if not app_id:
            raise ParseError("app_id is required")

        queryset = get_queryset_for_user_and_app_id(user, app_id)

        queryset = filter_for_mobile_entity(queryset, self.request)

        # we give all entities having an instance linked to the one of the org units allowed for the current user
        if queryset and user and user.is_authenticated:
            orgunits = OrgUnit.objects.hierarchy(user.iaso_profile.org_units.all())
            if orgunits and len(orgunits) > 0:
                queryset = queryset.filter(instances__org_unit__in=orgunits)

        return queryset
