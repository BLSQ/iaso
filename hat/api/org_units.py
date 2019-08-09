from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import OrgUnit
from hat.vector_control.models import APIImport
from django.contrib.gis.geos import Point
from .catches import timestamp_to_utc_datetime


class OrgUnitViewSet(viewsets.ViewSet):
    """
    list:
    """

    authentication_classes = []
    permission_classes = []

    def list(self, request):

        queryset = (
            OrgUnit.objects.filter(validated=True)
            .exclude(org_unit_type=None)
            .order_by("id")
        )

        return Response({"orgUnits": [unit.as_dict() for unit in queryset]})

    def create(self, request):
        org_units = request.data

        new_org_units = []
        api_import = APIImport()
        if not request.user.is_anonymous:
            api_import.user = request.user
        api_import.import_type = "orgUnit"
        api_import.json_body = org_units
        api_import.save()
        try:
            for org_unit in org_units:
                uuid = org_unit.get("id", None)
                latitude = org_unit.get("latitude", None)
                longitude = org_unit.get("longitude", None)
                altitude = org_unit.get("altitude", 0)
                org_unit_location = None

                if latitude and longitude:
                    org_unit_location = Point(
                        x=longitude, y=latitude, z=altitude, srid=4326
                    )
                org_unit_db, created = OrgUnit.objects.get_or_create(uuid=uuid)

                if created:
                    org_unit_db.custom = True
                    org_unit_db.validated = False
                    org_unit_db.name = org_unit.get("name", None)
                    org_unit_db.accuracy = org_unit.get("accuracy", None)
                    org_unit_db.parent_id = org_unit.get("parentId", None)
                    org_unit_db.org_unit_type_id = org_unit.get("orgUnitTypeId", None)

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

                    org_unit_db.creator = request.user
                    org_unit_db.source = "API"
                    org_unit_db.api_import = api_import
                    if org_unit_location:
                        org_unit_db.location = org_unit_location

                    new_org_units.append(org_unit_db)
                    org_unit_db.save()
                else:
                    print("not created")

            return Response([org_unit.as_dict() for org_unit in new_org_units])
        except:
            return Response({"res": "a problem happened, but your data was saved"})
