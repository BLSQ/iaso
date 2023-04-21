from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters
from rest_framework import serializers
from rest_framework.decorators import action

from iaso.api.common import (
    ModelViewSet,
    TimestampField,
)
from iaso.api.mobile.entity import MobileEntitySerializer, LargeResultsSetPagination, filter_queryset_for_mobile_entity
from iaso.models import Entity, EntityType, Project


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
        queryset = EntityType.objects.filter(account=self.request.user.iaso_profile.account)

        return queryset

    @action(detail=False, methods=["get"], url_path=r"(?P<type_pk>\d+)/entities")
    def get_entities_by_types(self, *args, **kwargs):
        user = self.request.user
        app_id = self.request.query_params.get("app_id")

        base_entities = Entity.objects.all()

        if user and user.is_authenticated:
            base_entities = base_entities.filter(account=self.request.user.iaso_profile.account)

        if app_id is not None:
            try:
                project = Project.objects.get_for_user_and_app_id(user, app_id)

                if project.account is None and (not user or not user.is_authenticated):
                    base_entities = self.none()

                base_entities = base_entities.filter(account=project.account)

            except Project.DoesNotExist:
                if not user or not user.is_authenticated:
                    base_entities = self.none()

        type_pk = self.request.parser_context.get("kwargs").get("type_pk", None)

        base_entities = base_entities.filter(entity_type__pk=type_pk)

        queryset = filter_queryset_for_mobile_entity(base_entities, self.request)

        page = self.paginate_queryset(queryset)
        serializer = MobileEntitySerializer(page, many=True)
        return self.get_paginated_response(serializer.data)
