from django.contrib.gis.geos import Point

from hat.api.export_utils import timestamp_to_utc_datetime
from iaso.api.common import get_timestamp
from iaso.models import OrgUnit, Project


class OrgUnitMobileImportService:
    def __init__(self, org_units, user, app_id):
        self.org_units = org_units
        self.user = user
        self.project = Project.objects.get_for_user_and_app_id(user, app_id)

    def create_org_units(self):
        new_org_units = []
        org_units = sorted(self.org_units, key=get_timestamp)

        for org_unit in org_units:
            uuid = org_unit.get("id", None)
            latitude = org_unit.get("latitude", None)
            longitude = org_unit.get("longitude", None)
            org_unit_location = None

            if latitude and longitude:
                altitude = org_unit.get("altitude", 0)
                org_unit_location = Point(x=longitude, y=latitude, z=altitude, srid=4326)
            org_unit_db, created = OrgUnit.objects.get_or_create(uuid=uuid)

            if created:
                org_unit_db.custom = True
                org_unit_db.validated = False
                org_unit_db.name = org_unit.get("name", None)
                org_unit_db.accuracy = org_unit.get("accuracy", None)
                parent_id = org_unit.get("parentId", None)
                if not parent_id:
                    parent_id = org_unit.get(
                        "parent_id", None
                    )  # there exist versions of the mobile app in the wild with both parentId and parent_id

                if parent_id is not None:
                    if str.isdigit(parent_id):
                        org_unit_db.parent_id = parent_id
                    else:
                        parent_org_unit = OrgUnit.objects.get(uuid=parent_id)
                        org_unit_db.parent_id = parent_org_unit.id

                org_unit_type_id = org_unit.get(
                    "orgUnitTypeId", None
                )  # there exist versions of the mobile app in the wild with both orgUnitTypeId and org_unit_type_id
                if not org_unit_type_id:
                    org_unit_type_id = org_unit.get("org_unit_type_id", None)
                org_unit_db.org_unit_type_id = org_unit_type_id

                t = org_unit.get("created_at", None)
                if t:
                    org_unit_db.created_at = timestamp_to_utc_datetime(int(t))
                else:
                    org_unit_db.created_at = org_unit.get("created_at", None)

                t = org_unit.get("updated_at", None)
                if t:
                    org_unit_db.updated_at = timestamp_to_utc_datetime(int(t))
                else:
                    org_unit_db.updated_at = org_unit.get("created_at", None)
                if self.user and not self.user.is_anonymous:
                    org_unit_db.creator = self.user
                org_unit_db.source = "API"
                if org_unit_location:
                    org_unit_db.location = org_unit_location

                new_org_units.append(org_unit_db)
                org_unit_db.version = self.project.account.default_version
                org_unit_db.save()
        return new_org_units
