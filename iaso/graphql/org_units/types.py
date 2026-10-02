"""GraphQL shape of an org unit - the GraphQL counterpart of `OrgUnitSerializerV3` (`/api/v3/orgunits/`).

Nothing here is loaded unless the query selects it: the `DjangoOptimizerExtension` turns the selection into
`.only()`/`select_related()`/`prefetch_related()`, and the computed fields declare their columns (`only=`) or
their SQL (`annotate=`) so they cost nothing when they aren't asked for.
"""

import enum
import json

from typing import List, Optional

import strawberry
import strawberry_django

from django.contrib.gis.db.models.functions import AsGeoJSON
from strawberry import auto
from strawberry.scalars import JSON

from iaso.models import DataSource, Group, OrgUnit, OrgUnitType, SourceVersion

from .expressions import ancestors_json, has_children, has_geo_json, instance_count


@strawberry.enum
class ValidationStatus(enum.Enum):
    NEW = OrgUnit.VALIDATION_NEW
    VALID = OrgUnit.VALIDATION_VALID
    REJECTED = OrgUnit.VALIDATION_REJECTED


@strawberry.enum
class OrgUnitTypeCategory(enum.Enum):
    COUNTRY = "COUNTRY"
    REGION = "REGION"
    DISTRICT = "DISTRICT"
    HF = "HF"


def _geo_json(value: Optional[str]) -> Optional[JSON]:
    return json.loads(value) if value is not None else None


@strawberry_django.type(OrgUnitType, name="OrgUnitType")
class OrgUnitTypeNode:
    id: auto
    name: auto
    short_name: auto
    category: Optional[OrgUnitTypeCategory]


@strawberry_django.type(Group, name="Group")
class GroupNode:
    id: auto
    name: auto


@strawberry_django.type(DataSource, name="DataSource")
class DataSourceNode:
    id: auto
    name: auto


@strawberry_django.type(SourceVersion, name="SourceVersion")
class SourceVersionNode:
    id: auto
    number: auto
    data_source: DataSourceNode

    @strawberry_django.field(only=["data_source"])
    def data_source_id(self) -> int:
        return self.data_source_id


@strawberry_django.type(OrgUnit, name="OrgUnitSummary", description="An `ancestors` entry, and `parent`")
class OrgUnitSummaryNode:
    id: auto
    name: auto
    source_ref: auto
    validation_status: ValidationStatus

    @strawberry_django.field(only=["org_unit_type"])
    def org_unit_type_id(self) -> Optional[int]:
        return self.org_unit_type_id

    @strawberry_django.field(only=["parent"])
    def parent_id(self) -> Optional[int]:
        return self.parent_id


@strawberry_django.type(OrgUnit, name="OrgUnit")
class OrgUnitNode:
    @classmethod
    def get_queryset(cls, queryset, info, **_kwargs):
        """Every `OrgUnit` resolved is one the requesting user can see. `id` by default: `name` has no index,
        and a stable order is what makes offset pagination reliable (an explicit `ordering` replaces it)."""
        return queryset.filter_for_user(info.context.request.user).order_by("id")

    id: auto
    name: auto
    uuid: Optional[str]
    validation_status: ValidationStatus
    source_ref: auto
    code: auto
    opening_date: auto
    closed_date: auto
    created_at: auto
    updated_at: auto
    source_created_at: auto = strawberry_django.field(description="Creation time on the client device")

    parent: Optional[OrgUnitSummaryNode]
    org_unit_type: Optional[OrgUnitTypeNode]
    version: Optional[SourceVersionNode]
    groups: List[GroupNode]

    @strawberry_django.field(only=["parent"])
    def parent_id(self) -> Optional[int]:
        return self.parent_id

    @strawberry_django.field(only=["org_unit_type"])
    def org_unit_type_id(self) -> Optional[int]:
        return self.org_unit_type_id

    @strawberry_django.field(only=["aliases"])
    def aliases(self) -> List[str]:
        return self.aliases or []

    @strawberry_django.field(only=["path"], description="ltree path depth, root = 1")
    def depth(self) -> Optional[int]:
        return len(self.path) if self.path is not None else None

    @strawberry_django.field(only=["location"])
    def latitude(self) -> Optional[float]:
        return self.location.y if self.location else None

    @strawberry_django.field(only=["location"])
    def longitude(self) -> Optional[float]:
        return self.location.x if self.location else None

    @strawberry_django.field(only=["location"])
    def altitude(self) -> Optional[float]:
        return self.location.z if self.location else None

    # -- computed in SQL, only when selected --

    @strawberry_django.field(
        annotate={"has_geo_json_value": has_geo_json()}, description="Has a geom or simplified_geom"
    )
    def has_geo_json(self) -> bool:
        return self.has_geo_json_value

    @strawberry_django.field(annotate={"has_children_value": has_children()}, description="Has at least one child")
    def has_children(self) -> bool:
        return self.has_children_value

    @strawberry_django.field(
        annotate={"instance_count_value": instance_count()},
        description="Submissions attached to this org unit (not deleted, with a file, not from a test device)",
    )
    def instance_count(self) -> int:
        return self.instance_count_value

    # -- geometries: serialized to GeoJSON by PostGIS, the column itself is never loaded --

    @strawberry_django.field(annotate={"geom_geojson": AsGeoJSON("geom")}, description="GeoJSON")
    def geom(self) -> Optional[JSON]:
        return _geo_json(self.geom_geojson)

    @strawberry_django.field(annotate={"simplified_geom_geojson": AsGeoJSON("simplified_geom")}, description="GeoJSON")
    def simplified_geom(self) -> Optional[JSON]:
        return _geo_json(self.simplified_geom_geojson)

    @strawberry_django.field(annotate={"catchment_geojson": AsGeoJSON("catchment")}, description="GeoJSON")
    def catchment(self) -> Optional[JSON]:
        return _geo_json(self.catchment_geojson)

    # -- hand-made: ltree `path` isn't a Django relation the optimizer could follow --

    @strawberry_django.field(
        annotate={"ancestors_json": ancestors_json()}, description="Root first, excluding the org unit itself"
    )
    def ancestors(self) -> List[OrgUnitSummaryNode]:
        return [OrgUnit(**ancestor) for ancestor in self.ancestors_json or []]
