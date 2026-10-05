from itertools import islice
from typing import Optional

from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework.response import Response

from iaso.api.common.views import ReadOnlyModelViewSet

from .dynamic_fields import describe_fields, optimize_queryset, run_batch_loaders
from .errors import bad_request
from .fields_parser import parse_fields
from .param_validator import suggest_close_matches
from .schema import V3AutoSchema


class BaseV3ReadOnlyViewSet(ReadOnlyModelViewSet):
    """Shared plumbing for v3 read endpoints whose `serializer_class` uses `DynamicFieldsMixin`: `?format=`
    validation, `fields=` parsing/validation, a queryset that only loads what `fields=` asked for, and the
    `schema/` action describing `fields=`."""

    results_key = "results"
    schema = V3AutoSchema()
    #: `OpenApiParameter`s for the endpoint's own view-level query params (its FilterSet's
    #: `extra_allowed_params`) - filters and the shared core params are documented automatically.
    extra_parameters = []
    #: appended to the generated `order` param description.
    ordering_help = ""
    #: advertised in the unsupported-format error - excludes "api" (the browsable API renderer's format,
    #: accepted but not part of the documented contract).
    documented_formats = frozenset({"json"})
    export_chunk_size = 2000

    def initial(self, request, *args, **kwargs):
        """DRF's content negotiation answers an unknown `?format=` with a bare 404 before `list()` even runs -
        give a 400 with a suggestion instead."""
        requested_format = request.query_params.get("format")
        valid_formats = {renderer.format for renderer in self.renderer_classes}
        if requested_format and requested_format not in valid_formats:
            suggestions = suggest_close_matches(requested_format, self.documented_formats)
            raise bad_request(
                f"Unsupported format: {requested_format!r}",
                f"Allowed values: {', '.join(sorted(self.documented_formats))}."
                + (f" Did you mean {suggestions[0]!r}?" if suggestions else ""),
            )
        super().initial(request, *args, **kwargs)

    def finalize_response(self, request, response, *args, **kwargs):
        """Errors are always JSON: with `?format=csv/xlsx/parquet` DRF would otherwise render the `{error,
        detail}` body with that export renderer - a csv row, or raw bytes served as `application/octet-stream`."""
        response = super().finalize_response(request, response, *args, **kwargs)
        is_error = getattr(response, "exception", False)
        if is_error and not isinstance(response.accepted_renderer, (JSONRenderer, BrowsableAPIRenderer)):
            response.accepted_renderer = JSONRenderer()
            response.accepted_media_type = JSONRenderer.media_type
        return response

    def get_field_tree(self, request) -> Optional[dict]:
        fields_param = request.query_params.get("fields")
        if not fields_param:
            return None
        field_tree = parse_fields(fields_param)
        self.get_serializer_class().validate_tree(field_tree)
        return field_tree

    def optimize_for(self, queryset, field_tree):
        return optimize_queryset(queryset, self.get_serializer(field_tree=field_tree))

    def serialize(self, rows, field_tree, many=True):
        rows = list(rows) if many else [rows]
        serializer = self.get_serializer(rows if many else rows[0], many=many, field_tree=field_tree)
        run_batch_loaders(rows, serializer.child if many else serializer)
        return serializer.data

    def serialize_in_chunks(self, queryset, field_tree):
        """Serialized rows for an unpaginated export: `export_chunk_size` rows (and their prefetches/batch
        loaders) at a time, so memory stays bounded however many rows `queryset` matches."""
        rows = queryset.iterator(chunk_size=self.export_chunk_size)
        while True:
            chunk = list(islice(rows, self.export_chunk_size))
            if not chunk:
                return
            yield from self.serialize(chunk, field_tree)

    def paginated_list(self, queryset, field_tree):
        queryset = self.optimize_for(queryset, field_tree)
        page = self.paginate_queryset(queryset)
        if page is not None:
            return self.get_paginated_response(self.serialize(page, field_tree))
        return Response({self.results_key: self.serialize(queryset, field_tree)})

    def retrieve(self, request, *args, **kwargs):
        field_tree = self.get_field_tree(request)
        queryset = self.optimize_for(self.filter_queryset(self.get_queryset()), field_tree)
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        instance = get_object_or_404(queryset, **{self.lookup_field: self.kwargs[lookup_url_kwarg]})
        self.check_object_permissions(request, instance)
        return Response(self.serialize(instance, field_tree, many=False))

    @extend_schema(
        parameters=[],
        summary="Field/sub-field schema for `fields=`",
        description=(
            "Machine-readable description of every field (and relation sub-field) the `fields=` selector "
            "accepts, plus which ones are included by default. Built from the endpoint's serializer, so it "
            "can't drift out of sync with what `fields=` accepts."
        ),
    )
    # NB: must NOT be named `schema` - that shadows the ViewSet's reserved `.schema` attribute (drf-spectacular's
    # AutoSchema instance). `url_path` keeps the URL at `.../schema/`.
    @action(detail=False, methods=["get"], url_path="schema")
    def fields_schema(self, request, *args, **kwargs):
        return Response(describe_fields(self.get_serializer_class()))
