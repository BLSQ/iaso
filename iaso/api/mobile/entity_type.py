from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters, serializers
from rest_framework.decorators import action
from rest_framework.exceptions import ParseError, AuthenticationFailed, NotFound

from iaso.api.common import ModelViewSet, TimestampField
from iaso.api.mobile.entity import (
    LargeResultsSetPagination,
    MobileEntitySerializer,
    filter_for_mobile_entity,
    get_queryset_for_user_and_app_id,
)
from iaso.models import Entity, EntityType, Project
from iaso.models.entity import (
    ProjectNotFoundAndUserNotAuthError,
    ProjectWithoutAccountAndUserNotAuthError,
)


class MobileEntityTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityType
        fields = [
            "id",
            "name",
            "created_at",
            "updated_at",
            "reference_form",
            "entities_count",
            "account",
            "fields_detail_info_view",
            "fields_list_view",
            "fields_duplicate_search",
        ]

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    entities_count = serializers.SerializerMethodField()
    fields_detail_info_view = serializers.SerializerMethodField()
    fields_list_view = serializers.SerializerMethodField()
    fields_duplicate_search = serializers.SerializerMethodField()

    @staticmethod
    def get_entities_count(obj: EntityType):
        return Entity.objects.filter(entity_type=obj.id).count()

    @staticmethod
    def get_fields_detail_info_view(obj: EntityType):
        return obj.fields_detail_info_view or []

    @staticmethod
    def get_fields_list_view(obj: EntityType):
        return obj.fields_list_view or []

    @staticmethod
    def get_fields_duplicate_search(obj: EntityType):
        return obj.fields_duplicate_search or []


class MobileEntityTypesViewSet(ModelViewSet):
    """
    Mobile API to Serve Entity Types.

    /api/mobile/entitytypes
    /api/mobile/entitytype [Deprecated]
    /api/mobile/entitytypes/id
    /api/mobile/entitytype/id [Deprecated]

    It's possible to get all entities of a given type :

    /api/mobile/entitytypes/id/entities
    /api/mobile/entitytype/id/entities [Deprecated]
    """

    results_key = "entitytypes"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    pagination_class = LargeResultsSetPagination

    def get_serializer_class(self):
        return MobileEntityTypeSerializer

    def get_queryset(self):
        app_id = self.request.query_params.get("app_id")
        user = self.request.user

        queryset = EntityType.objects.filter(account=user.iaso_profile.account)

        if not app_id:
            raise ParseError("app_id is required")

        try:
            project = Project.objects.get_for_user_and_app_id(user, app_id)

            if project.account is None and (not user or not user.is_authenticated):
                raise AuthenticationFailed(f"Project Account is None or User not Authentified for app_id {app_id}")

            queryset = queryset.filter(account=project.account, instances__project=project, attributes__project=project)

        except Project.DoesNotExist:
            if not user or not user.is_authenticated:
                raise NotFound(f"Project Not Found and User not Authentified for app_id {app_id}")

        return queryset

    @action(detail=False, methods=["get"], url_path=r"(?P<type_pk>\d+)/entities")
    def get_entities_by_types(self, *args, **kwargs):
        user = self.request.user
        app_id = self.request.query_params.get("app_id")
        type_pk = self.request.parser_context.get("kwargs").get("type_pk", None)

        if not app_id:
            raise ParseError("app_id is required")

        if not type_pk:
            raise ParseError("type_pk is required")

        queryset = get_queryset_for_user_and_app_id(user, app_id)

        if queryset:
            queryset = queryset.filter(entity_type__pk=type_pk)

        queryset = filter_for_mobile_entity(queryset, self.request)

        page = self.paginate_queryset(queryset)
        serializer = MobileEntitySerializer(page, many=True)
        return self.get_paginated_response(serializer.data)
