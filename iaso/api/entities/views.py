from logging import getLogger

from django.db.models import Max
from django.db.models.functions import Coalesce
from django.http import JsonResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.utils.functional import cached_property
from django.utils.timezone import now
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import permissions, renderers, serializers
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from hat.audit.models import ENTITY_API
from iaso.api.common import (
    DeletionFilterBackend,
    HasPermission,
    ModelViewSet,
)
from iaso.api.entities.filters import EntityDateFilterBackend, EntityFilterSet, EntityOrderingFilter
from iaso.api.entities.pagination import EntityListPaginator, EntityLocationPaginator
from iaso.api.entities.renderers import CSVStreamingRenderer, LegacyExportContentNegotation, XlsxStreamingRenderer
from iaso.api.entities.serializers import (
    EntityExportSerializer,
    EntityListSerializer,
    EntitySerializer,
    EntityTypeColumnSerializer,
)
from iaso.models import Entity, EntityType, Instance
from iaso.permissions.core_permissions import CORE_ENTITIES_PERMISSION


logger = getLogger(__name__)


class EntityViewSet(ModelViewSet):
    """Entity API

    list: /api/entities

    list entity by entity type: /api/entities/?entity_type_id=ids

    details =/api/entities/<id>

    export entity list: /api/entities/?xlsx=true

    export entity by entity type: /api/entities/entity_type_ids=ids&?xlsx=true

    export entity submissions list: /api/entities/export_entity_submissions_list/?id=id

    **replace xlsx by csv to export as csv
    """

    filter_backends = [
        EntityOrderingFilter,
        DjangoFilterBackend,
        DeletionFilterBackend,
        EntityDateFilterBackend,
    ]
    filterset_class = EntityFilterSet
    permission_classes = [permissions.IsAuthenticated, HasPermission(CORE_ENTITIES_PERMISSION)]  # type: ignore
    content_negotiation_class = LegacyExportContentNegotation
    renderer_classes = (
        renderers.JSONRenderer,
        renderers.BrowsableAPIRenderer,
        CSVStreamingRenderer,
        XlsxStreamingRenderer,
    )
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            if self.request.accepted_renderer.format in ("csv", "xlsx"):
                return EntityExportSerializer
            return EntityListSerializer
        return EntitySerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["entity_type_columns"] = self.entity_type_columns
        return context

    def get_renderer_context(self):
        context = super().get_renderer_context()

        if self.request.accepted_renderer.format in ("csv", "xlsx"):
            filename = f"entities-{now().strftime('%Y-%m-%d-%H-%M')}"
            context["export_filename"] = filename
            context["export_sheet_name"] = "Entities"

        return context

    def get_queryset(self):
        queryset = (
            Entity.objects.filter_for_user(self.request.user)
            .select_related(
                "attributes__org_unit",
                "attributes__created_by",
                "entity_type",
            )
            .annotate(last_saved_instance=Max(Coalesce("instances__source_created_at", "instances__created_at")))
            .with_duplicates()
            .prefetch_related(
                "attributes__created_by__teams",
                "attributes__form",
                "attributes__org_unit__groups",
                "attributes__org_unit__org_unit_type",
                "attributes__org_unit__parent",
                "attributes__org_unit__version__data_source",
                "instances",
            )
        )
        return queryset

    @property
    def pagination_class(self):
        if self.request.query_params.get("asLocation"):
            return EntityLocationPaginator
        return EntityListPaginator

    @cached_property
    def entity_type_columns(self):
        """
        Retrieve the additional columns defined on the EntityType's `fields_list_view`
        when a single entity type is passed in the query parameter.
        """

        try:
            # Accept only exactly one EntityType
            entity_type_id = int(self.request.query_params.get("entity_type_ids", ""))
            entity_type = EntityType.objects.select_related("reference_form").get(pk=entity_type_id)
        except (ValueError, EntityType.DoesNotExist):
            return []

        fields = entity_type.get_list_view_fields()
        serializer = EntityTypeColumnSerializer(data=fields, many=True)

        if serializer.is_valid():
            return serializer.validated_data

        logger.warning(f"Invalid possible_fields in reference_form for EntityType {entity_type_id}")
        return []

    def create(self, request, *args, **kwargs):
        data = request.data
        entity_type = get_object_or_404(EntityType, pk=int(data["entity_type"]))
        instance = get_object_or_404(Instance, uuid=data["attributes"])
        account = request.user.iaso_profile.account
        # Avoid duplicates
        if Entity.objects.filter(attributes=instance):
            raise serializers.ValidationError({"attributes": "Entity with this attribute already exists."})

        entity = Entity.objects.create(
            name=data["name"],
            entity_type=entity_type,
            attributes=instance,
            account=account,
        )
        serializer = EntitySerializer(entity, many=False)
        return Response(serializer.data)

    @action(detail=False, methods=["POST", "GET"])
    def bulk_create(self, request, *args, **kwargs):
        created_entities = []
        data = request.data if isinstance(request.data, list) else [request.data]
        # allows multiple create
        if request.method == "POST":
            for entity in data:
                instance = get_object_or_404(Instance, uuid=entity["attributes"])
                # Avoid duplicates
                if Entity.objects.filter(attributes=instance):
                    raise serializers.ValidationError(
                        {"attributes": "Entity with the attribute '{0}' already exists.".format(entity["attributes"])}
                    )
                entity_type = get_object_or_404(EntityType, pk=int(entity["entity_type"]))
                account = request.user.iaso_profile.account
                Entity.objects.create(
                    name=entity["name"],
                    entity_type=entity_type,
                    attributes=instance,
                    account=account,
                )
                created_entities.append(entity)
            return JsonResponse(created_entities, safe=False)
        entities = Entity.objects.filter(account=request.user.iaso_profile.account)
        serializer = EntitySerializer(entities, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        queryset = Entity.objects.filter_for_user(self.request.user).distinct()
        entity = get_object_or_404(queryset, pk=pk)
        return Response(EntitySerializer(entity, many=False).data)

    def list(self, request: Request, *args, **kwargs):
        renderer = request.accepted_renderer
        if not getattr(renderer, "streaming", False):
            return super().list(request, *args, **kwargs)

        # Handle streaming responses

        queryset = self.filter_queryset(self.get_queryset())

        def data_iterator(queryset):
            context = self.get_serializer_context()
            serializer_class = self.get_serializer_class()
            # chunk_size is required for prefetch_related()
            for instance in queryset.iterator(chunk_size=2000):
                yield serializer_class(instance, context=context).data

        renderer_context = self.get_renderer_context()

        response = StreamingHttpResponse(
            renderer.stream(data_iterator(queryset), renderer_context=renderer_context),
            content_type=renderer.media_type,
        )

        filename = renderer_context.get("export_filename", "export")
        response["Content-Disposition"] = f'attachment; filename="{filename}.{renderer.format}"'
        return response

    def destroy(self, request, pk=None):
        entity = Entity.objects_include_deleted.get(pk=pk)

        entity = entity.soft_delete_with_instances_and_pending_duplicates(
            audit_source=ENTITY_API,
            user=request.user,
        )

        return Response(EntitySerializer(entity, many=False).data)
