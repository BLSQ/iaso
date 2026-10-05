"""OpenAPI documentation for v3 endpoints.

Filters are documented by drf-spectacular's django-filter support, straight from each filter's `help_text`.
This documents the rest - the query params a v3 view handles itself - from the view's own configuration
(`documented_formats`, `ordering_fields`, pagination limits, `serializer_class.default_fields`), so the
docs can't drift from the actual behaviour.
"""

from typing import List

from drf_spectacular.openapi import AutoSchema
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter


class V3AutoSchema(AutoSchema):
    def get_override_parameters(self):
        view = self.view
        if view.action == "list":
            generated = [*core_list_parameters(view), *view.extra_parameters]
        elif view.action == "retrieve":
            generated = [
                fields_parameter(view),
                OpenApiParameter(
                    name="format",
                    type=OpenApiTypes.STR,
                    enum=["json"],
                    description="Response format - exports (csv/xlsx/parquet) are only on the list endpoint.",
                ),
            ]
        else:
            generated = []
        # anything declared with `@extend_schema(parameters=...)` wins over the generated docs
        return [*generated, *super().get_override_parameters()]


def fields_parameter(view) -> OpenApiParameter:
    defaults = view.get_serializer_class().default_fields
    return OpenApiParameter(
        name="fields",
        type=OpenApiTypes.STR,
        description=(
            "Field selector, e.g. `fields=id,name,ancestors(id,name)`: the listed fields, in that order. A "
            "relation without a sub-selector returns its default sub-fields. "
            f"Defaults to: {', '.join(defaults)}. `GET schema/` on this endpoint lists every accepted field "
            "and sub-field."
        ),
    )


def core_list_parameters(view) -> List[OpenApiParameter]:
    pagination = view.pagination_class
    ordering_help = f" {view.ordering_help}" if view.ordering_help else ""
    return [
        fields_parameter(view),
        OpenApiParameter(
            name="order",
            type=OpenApiTypes.STR,
            description=(
                f"Comma-separated ordering, `-` prefix for descending. Allowed: {', '.join(view.ordering_fields)}. "
                f"Default: {','.join(view.ordering)}.{ordering_help}"
            ),
        ),
        OpenApiParameter(
            name="format",
            type=OpenApiTypes.STR,
            enum=sorted(view.documented_formats),
            description=(
                "Response format. Exports (anything but json) bypass pagination and stream the whole filtered "
                "result set; in csv/xlsx a nested object becomes `<field>.<subfield>` columns and a list of "
                "values one `;`-joined cell."
            ),
        ),
        OpenApiParameter(name="page", type=OpenApiTypes.INT, description="Page number, from 1. Default: 1"),
        OpenApiParameter(
            name="page_size",
            type=OpenApiTypes.INT,
            description=f"Page size. Default: {pagination.page_size}, max: {pagination.max_page_size}",
        ),
        OpenApiParameter(
            name="with_count",
            type=OpenApiTypes.BOOL,
            description="If true, compute an exact `count`/`pages` (an extra COUNT(*) query). Default: false (null).",
        ),
    ]
