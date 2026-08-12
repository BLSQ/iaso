from logging import getLogger

from django.db.models import F, OuterRef, Prefetch, Subquery
from django.db.models.functions import Coalesce
from django.http import JsonResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.utils.functional import cached_property
from django.utils.timezone import now
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, renderers, serializers
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.settings import api_settings

from hat.audit.models import ENTITY_API
from iaso.api.common import DeletionFilterBackend, HasPermission, ModelViewSet
from iaso.api.entities.filters import EntityDateFilterBackend, EntityFilterSet, EntityOrderingFilter
from iaso.api.entities.pagination import EntityCursorPagination, EntityListPaginator, EntityLocationPaginator
from iaso.api.entities.renderers import CSVStreamingRenderer, LegacyExportContentNegotation, XlsxStreamingRenderer
from iaso.api.entities.serializers import (
    EntityExportSerializer,
    EntityListSerializer,
    EntitySerializer,
    EntityTypeColumnSerializer,
)
from iaso.models import Entity, EntityDuplicate, EntityType, Instance
from iaso.models.deduplication import ValidationStatus
from iaso.permissions.core_permissions import CORE_ENTITIES_PERMISSION, CORE_STORAGE_PERMISSION


logger = getLogger(__name__)


@extend_schema(tags=["Entities"])
class EntityViewSet(ModelViewSet):
    """Entity API

    list: /api/entities

    list entity by entity type: /api/entities/?entity_type_id=ids

    list entities with cursor pagination: /api/entities/?cursor=null

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
    ordering = ["-id"]

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

    def get_serializer(self, *args, **kwargs):
        serializer = super().get_serializer(*args, **kwargs)
        account = self.request.user.iaso_profile.account
        has_module = "EXTERNAL_STORAGE" in account.modules
        has_perm = self.request.user.has_perm(CORE_STORAGE_PERMISSION.full_name())

        if not has_perm or not has_module:
            actual_serializer = serializer.child if hasattr(serializer, "child") else serializer
            actual_serializer.fields.pop("nfc_cards", None)

        return serializer

    def get_renderer_context(self):
        context = super().get_renderer_context()

        if self.request.accepted_renderer.format in ("csv", "xlsx"):
            filename = f"entities-{now().strftime('%Y-%m-%d-%H-%M')}"
            context["export_filename"] = filename
            context["export_sheet_name"] = "Entities"

        return context

    @property
    def pagination_class(self):
        if self.request.query_params.get("asLocation"):
            return EntityLocationPaginator
        if self.request.query_params.get("cursor"):
            return EntityCursorPagination
        return EntityListPaginator

    @property
    def _requested_ordering_fields(self):
        """Access the raw ordering fields from the request."""

        order_param = (
            self.request.query_params.get("order_columns")
            or self.request.query_params.get(api_settings.ORDERING_PARAM)
            or ""
        )
        return {field.strip().lstrip("-") for field in order_param.split(",") if field.strip()}

    def get_queryset(self):
        queryset = Entity.objects.filter_for_user(self.request.user)
        if self.action == "count":
            return queryset

        is_export = self.action == "list" and self.request.accepted_renderer.format in ("csv", "xlsx")

        if self.action == "list":
            # Compute last_saved_instance via a correlated subquery (one indexed lookup per
            # entity, no GROUP BY) instead of a Max()+GROUP BY aggregate, which would join every
            # submitted instance to its entity before collapsing the rows back down, or a Python
            # max() over a full instances prefetch (see Entity.get_latest_instance_created_at).
            last_saved_instance_subquery = (
                Instance.objects.filter(entity=OuterRef("pk"))
                .annotate(saved_at=Coalesce("source_created_at", "created_at"))
                .order_by("-saved_at")
                .values("saved_at")[:1]
            )
            queryset = queryset.annotate(
                last_saved_instance=Coalesce(Subquery(last_saved_instance_subquery), F("created_at"))
            )

        queryset = queryset.select_related(
            "attributes__org_unit",
            "entity_type",
        )

        if is_export:
            # EntityExportSerializer doesn't use instances, duplicates, or the extra
            # org_unit/attributes relations below, so skip them on the export path.
            # It also only reads org_unit.name/id and entity_type.name, so restrict the
            # select_related columns to avoid loading the org_unit's geometry fields
            # (geom, simplified_geom, catchment, location), which can be large.
            queryset = queryset.only(
                "uuid",
                "created_at",
                "entity_type__name",
                "attributes__json",
                "attributes__org_unit__name",
            )
            return queryset

        queryset = queryset.select_related(
            "attributes__created_by",
        ).prefetch_related(
            "attributes__created_by__teams",
            "attributes__form",
            "attributes__org_unit__groups",
            "attributes__org_unit__org_unit_type",
            "attributes__org_unit__parent",
            "attributes__org_unit__version__data_source",
            Prefetch(
                "duplicates1",
                queryset=EntityDuplicate.objects.filter(
                    validation_status=ValidationStatus.PENDING, entity2__deleted_at__isnull=True
                ),
                to_attr="pending_duplicates1",
            ),
            Prefetch(
                "duplicates2",
                queryset=EntityDuplicate.objects.filter(
                    validation_status=ValidationStatus.PENDING, entity1__deleted_at__isnull=True
                ),
                to_attr="pending_duplicates2",
            ),
        )

        if self.action != "list":
            # EntitySerializer (used outside the "list" action) serializes the full `instances`
            # field; EntityListSerializer only needs last_saved_instance, already annotated above.
            queryset = queryset.prefetch_related(
                Prefetch(
                    "instances",
                    queryset=Instance.non_deleted_objects.only("id", "entity_id", "source_created_at", "created_at"),
                ),
            )

        return queryset

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

        # Keep valid columns instead of dropping the whole list when one field
        # has an unexpected shape (e.g. blank/missing label on start/end/calculate).
        valid_columns = []
        for field in fields:
            field_serializer = EntityTypeColumnSerializer(data=field)
            if field_serializer.is_valid():
                valid_columns.append(field_serializer.validated_data)
            else:
                logger.warning(
                    "Invalid possible_field for EntityType %s: %s errors=%s",
                    entity_type_id,
                    field,
                    field_serializer.errors,
                )
        if not valid_columns:
            logger.warning(f"Invalid possible_fields in reference_form for EntityType {entity_type_id}")
        return valid_columns

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
        serializer = self.get_serializer(entity, many=False)
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
        serializer = self.get_serializer(entities, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        queryset = self.get_queryset().distinct()
        entity = get_object_or_404(queryset, pk=pk)
        serializer = self.get_serializer(entity, many=False)
        return Response(serializer.data)

    def list(self, request: Request, *args, **kwargs):
        renderer = request.accepted_renderer
        if not getattr(renderer, "streaming", False):
            return super().list(request, *args, **kwargs)

        # Handle streaming responses

        queryset = self.filter_queryset(self.get_queryset())
        # reset ordering for exports to an indexed column to ensure stable performance
        queryset = queryset.order_by("-id")

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

    @action(detail=False)
    def count(self, request):
        """Result count based on a stripped-down query for cursor pagination."""
        queryset = self.filter_queryset(self.get_queryset()).order_by().values("id")
        return Response({"count": queryset.count()})

    def destroy(self, request, pk=None):
        entity = Entity.objects_include_deleted.get(pk=pk)

        entity = entity.soft_delete_with_instances_and_pending_duplicates(
            audit_source=ENTITY_API,
            user=request.user,
        )
        serializer = self.get_serializer(entity, many=False)
        return Response(serializer.data)
