from django.contrib.gis.geos import Point
from rest_framework import viewsets
from rest_framework.response import Response

from hat.vector_control.models import APIImport
from .catches import timestamp_to_utc_datetime
from iaso.models import Instance
import ntpath


class InstancesViewSet(viewsets.ViewSet):
    authentication_classes = []
    permission_classes = []

    def create(self, request):
        instances = request.data
        print("request.data", request.data)
        new_instances = []
        api_import = APIImport()
        if not request.user.is_anonymous:
            api_import.user = request.user
        api_import.import_type = "instance"
        api_import.json_body = instances
        api_import.save()

        for instance in instances:
            file_name = ntpath.basename(instance.get("file", None))
            print("file_name", file_name)
            latitude = instance.get("latitude", None)
            longitude = instance.get("longitude", None)
            altitude = instance.get("altitude", 0)
            org_unit_location = None

            if latitude and longitude:
                org_unit_location = Point(
                    x=longitude, y=latitude, z=altitude, srid=4326
                )
            instanceDB, created = Instance.objects.get_or_create(file_name=file_name)
            print("created", file_name)
            instanceDB.name = instance.get("name", None)
            instanceDB.accuracy = instance.get("accuracy", None)
            instanceDB.parent_id = instance.get("parentId", None)
            instanceDB.org_unit_id = instance.get("orgUnitId", None)
            instanceDB.form_id = instance.get("formId")
            t = instance.get("created_at", None)
            if t:
                instanceDB.created_at = timestamp_to_utc_datetime(int(t))
            else:
                instanceDB.created_at = instance.get("created_at", None)

            t = instance.get("updated_at", None)
            if t:
                instanceDB.updated_at = timestamp_to_utc_datetime(int(t))
            else:
                instanceDB.updated_at = instance.get("created_at", None)

            instanceDB.source = "API"
            instanceDB.api_import = api_import
            if org_unit_location:
                instanceDB.location = org_unit_location

            new_instances.append(instanceDB)
            instanceDB.save()

        return Response([org_unit.as_dict() for org_unit in new_instances])
