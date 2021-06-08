"""old export used in the API"""
import os
import tempfile
import uuid

from django.db.models import QuerySet, Q

from iaso.gpkg.export_gpkg import export_org_units_to_gpkg, add_group_in_gpkg
from iaso.models import Group


def org_units_to_gpkg(queryset: QuerySet) -> bytes:
    """Export OrgUnit queryset in Geopackage (gpkg) format as bytes that can be streamed in response"""

    # Exclude entries without geo info
    queryset = queryset.exclude(Q(location=None) & Q(geom=None) & Q(simplified_geom=None))

    # Tried to use a mkstemp but it prevents the group.to_file from writing to it and is hard to remove later on
    # NamedTemporaryFile works but the handle cannot be used to read again. So left the plain uuid thing.
    filepath = os.path.join(tempfile.gettempdir(), str(uuid.uuid4()))
    export_org_units_to_gpkg(queryset, filepath, filter_empty_geom=True)
    groups = Group.objects.filter(org_units__in=queryset).distinct()
    add_group_in_gpkg(filepath, groups)

    f = open(filepath, "rb")
    content = f.read()
    f.close()
    os.remove(filepath)
    return content
