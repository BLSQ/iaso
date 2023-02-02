import json

from django.contrib.gis.geos import Point
from django.core.cache import cache
from rest_framework import viewsets, permissions
from rest_framework.response import Response

from hat.api.export_utils import timestamp_to_utc_datetime
from iaso.api.common import safe_api_import
from iaso.models import OrgUnit, Project


class HasOrgUnitPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not (
            request.user.is_authenticated
            and (
                request.user.has_perm("menupermissions.iaso_forms")
                or request.user.has_perm("menupermissions.iaso_org_units")
                or request.user.has_perm("menupermissions.iaso_submissions")
            )
        ):
            return False

        # TODO: can be handled with get_queryset()
        user_account = request.user.iaso_profile.account
        projects = obj.version.data_source.projects.all()
        account_ids = [p.account_id for p in projects]

        return user_account.id in account_ids


class MobileOrgUnitViewSet(viewsets.ViewSet):
    """Org units API used by the mobile application

    This API is open to anonymous users for actions that are not org unit-specific (see create method for nuance in
    projects that require authentication).

    GET /api/mobile/orgunits/
    POST /api/mobile/orgunits/
    """

    permission_classes = [HasOrgUnitPermission]

    def get_queryset(self):
        return OrgUnit.objects.filter_for_user_and_app_id(None, self.request.query_params.get("app_id")).filter(
            validation_status=OrgUnit.VALIDATION_VALID
        )

    def list(self, request):
        queryset = self.get_queryset().prefetch_related("org_unit_type")
        queryset = queryset.select_related("org_unit_type")
        response = {}
        roots = []
        if request.user.is_authenticated:
            roots = request.user.iaso_profile.org_units.values_list("id", flat=True)
        response["roots"] = roots

        app_id = self.request.query_params.get("app_id")
        if app_id:
            cached_response = cache.get(app_id)
        else:
            return Response()

        if cached_response is None:
            cached_response = json.dumps([unit.as_dict_for_mobile() for unit in queryset])
            cache.set(
                app_id,
                cached_response,
                300,
            )
        response["orgUnits"] = json.loads(cached_response)

        return Response(response)

    @safe_api_import("orgUnit")
    def create(self, _, request):
        new_org_units = import_data(request.data, request.user, request.query_params.get("app_id"))

        return Response([org_unit.as_dict() for org_unit in new_org_units])


def import_data(org_units, user, app_id):
    new_org_units = []
    project = Project.objects.get_for_user_and_app_id(user, app_id)

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
            if not user.is_anonymous:
                org_unit_db.creator = user
            org_unit_db.source = "API"
            if org_unit_location:
                org_unit_db.location = org_unit_location

            new_org_units.append(org_unit_db)
            org_unit_db.version = project.account.default_version
            org_unit_db.save()
    return new_org_units
