import typing
from django.core.files.base import ContentFile
from django.db.models import QuerySet, Q
from django.contrib.gis.geos import GEOSGeometry
import pandas as pd
import geopandas as gpd
from shapely import wkt
from shapely.geometry.base import BaseGeometry
import uuid
import tempfile
import os

ORG_UNIT_COLUMNS = [
    "name",
    "parent__name",
    "parent__org_unit_type__name",
    "org_unit_type__name",
    "org_unit_type__depth",
    "uuid",
    "location",
    "geom",
    "simplified_geom",
]


def geos_to_shapely(geom: GEOSGeometry) -> typing.Optional[BaseGeometry]:
    shape = wkt.loads(geom.wkt)

    return shape if not shape.is_empty else None


def org_units_to_gpkg(queryset: QuerySet) -> bytes:
    """Export the provided org unit queryset in Geopackage (gpkg) format."""

    # create df with queryset, excluding entries without geo info
    queryset = queryset.exclude(Q(location=None) & Q(geom=None) & Q(simplified_geom=None))
    ou_df = pd.DataFrame(queryset.values(*ORG_UNIT_COLUMNS))

    # cleanup / transforms
    ou_df["parent"] = ou_df["parent__name"] + " (" + ou_df["parent__org_unit_type__name"] + ")"
    ou_df["geography"] = ou_df["geom"].fillna(ou_df["simplified_geom"].fillna(ou_df["location"]))
    ou_df = ou_df.drop(columns=["geom", "simplified_geom", "location", "parent__name", "parent__org_unit_type__name"])
    ou_df = ou_df.rename(columns={"org_unit_type__name": "type", "org_unit_type__depth": "depth"})
    ou_df["depth"] = ou_df["depth"].fillna(999)
    ou_df = ou_df.set_index("uuid")

    # Convert django geometry values (GEOS) to shapely models
    ou_df["geography"] = ou_df["geography"].map(geos_to_shapely)

    # filter empty geometries
    ou_df["geography"] = ou_df["geography"].loc[ou_df["geography"].notnull()]

    # Convert to geo dataframe, and group by org unit type to handle multiple layers
    ou_gdf = gpd.GeoDataFrame(ou_df, geometry="geography")
    ou_gdf["group_key"] = ou_gdf["depth"].astype(str) + "-" + ou_gdf["type"]
    ou_gdf_by_type = ou_gdf.groupby("group_key")

    # Write to content file
    # Tried to use a mkstemp but it prevents the group.to_file from writing to it and is hard to remove later on
    # NamedTemporaryFile works but the handle cannot be used to read again. So left the plain uuid thing.
    path = os.path.join(tempfile.gettempdir(), str(uuid.uuid4()))

    i = 1
    for group_key, group in ou_gdf_by_type:
        group = group.drop(columns=["depth", "group_key"])
        layer = group_key.split("-", 1)[1]
        group.to_file(path, driver="GPKG", layer=layer)
        i = i + 1

    f = open(path, "rb")
    content = f.read()
    f.close()
    os.remove(path)
    return content
