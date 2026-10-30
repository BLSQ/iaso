from typing import Optional

import strawberry
import strawberry_django

from graphql import GraphQLError
from strawberry import UNSET
from strawberry.types import Info
from strawberry_django.fields.field import StrawberryDjangoField
from strawberry_django.pagination import OffsetPaginated, OffsetPaginationInput
from strawberry_django.permissions import IsAuthenticated

from iaso.models import OrgUnit

from .filters import OrgUnitFilter, OrgUnitOrder
from .types import OrgUnitNode


#: lower than v3's 200 000 (sized for exports, which stay REST): a GraphQL page is one JSON document.
#: Without `pagination`, strawberry-django's `PAGINATION_DEFAULT_LIMIT` (100, same as v3's page size) applies.
MAX_LIMIT = 10_000


class BoundedPaginationField(StrawberryDjangoField):
    """strawberry-django reads `limit: null` (or a negative limit) as "no limit": reject those, and cap it."""

    def get_queryset(self, queryset, info, *, pagination: Optional[OffsetPaginationInput] = None, **kwargs):
        if pagination not in (None, UNSET):
            if pagination.limit is not UNSET and (pagination.limit is None or not 0 < pagination.limit <= MAX_LIMIT):
                raise GraphQLError(f"limit must be between 1 and {MAX_LIMIT}")
            if pagination.offset < 0:
                raise GraphQLError("offset must be >= 0")
        return super().get_queryset(queryset, info, pagination=pagination, **kwargs)


@strawberry.type
class OrgUnitQuery:
    # scoped to the requesting user by `OrgUnitNode.get_queryset`. `totalCount` runs a `COUNT(*)` only when
    # selected, like v3's opt-in `with_count=true`.
    org_units: OffsetPaginated[OrgUnitNode] = strawberry_django.offset_paginated(
        filters=OrgUnitFilter,
        ordering=OrgUnitOrder,
        field_cls=BoundedPaginationField,
        extensions=[IsAuthenticated(fail_silently=False)],
        description="Org units visible to the requesting user (read-only, writes stay on /api/orgunits/)",
    )

    @strawberry_django.field(extensions=[IsAuthenticated(fail_silently=False)])
    def org_unit(self, info: Info, id: strawberry.ID) -> Optional[OrgUnitNode]:
        return OrgUnit.objects.filter(pk=id)
