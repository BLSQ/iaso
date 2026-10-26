from django.contrib.gis.db.models.functions import GeomOutputGeoFunc
from django.core.exceptions import ValidationError

from iaso.api.org_units.serializers.misc import OrgUnitImportSerializer
from iaso.models import OrgUnit, Project


def import_org_units(org_units: list[dict], user, app_id) -> list[OrgUnit]:
    """Import a list of org units."""
    new_org_units = []
    project = Project.objects.get_for_user_and_app_id(user, app_id)
    version = project.account.default_version
    if version.data_source.read_only:
        raise ValidationError("Creation of org unit not authorized on default data source")

    # common values to all new org units
    extra_save_kwargs = {
        "custom": True,
        "validation_status": OrgUnit.VALIDATION_NEW,
        "version": version,
        "creator": user if (user and not user.is_anonymous) else None,
    }

    for org_unit_data in org_units:
        uuid = org_unit_data.get("id")
        if OrgUnit.objects.filter(uuid=uuid, version=version).exists():
            continue  # skip existing org units

        serializer = OrgUnitImportSerializer(data=org_unit_data, context={"user": user})
        serializer.is_valid(raise_exception=True)
        new_org_unit = serializer.save(**extra_save_kwargs)
        new_org_units.append(new_org_unit)

    return new_org_units


def bbox_merge(a: tuple | None, b: tuple | None) -> tuple | None:
    if not a and not b:
        return None
    if not a:
        return b
    if not b:
        return a
    return (
        max(a[0], b[0]),
        min(a[1], b[1]),
        min(a[2], b[2]),
        max(a[3], b[3]),
    )


# Define a GIS function, GeoDjango will map it to ST_BUFFER in postgis (using the class name)
class Buffer(GeomOutputGeoFunc):
    """Computes a POLYGON or MULTIPOLYGON that represents all points whose distance from a geometry/geography is less
    than or equal to a given distance.

    https://postgis.net/docs/ST_Buffer.html

    arguments are:
        - geography g1 or geometry g1
        - float radius_of_buffer
    """

    arity = 2
