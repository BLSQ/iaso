from typing import Dict, Any

from django.contrib.gis.geos import Point
from django.core.cache import cache
from django.db.models.expressions import RawSQL
from rest_framework import permissions
from rest_framework.fields import SerializerMethodField
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer, JSONField

from hat.api.export_utils import timestamp_to_utc_datetime
from iaso.api.common import get_timestamp, TimestampField, ModelViewSet, Paginator, safe_api_import
from iaso.api.query_params import APP_ID, LIMIT, PAGE
from iaso.models import OrgUnit, Project, FeatureFlag


class MobileOrgUnitsSetPagination(Paginator):
    page_size_query_param = LIMIT
    page_query_param = PAGE
    page_size = None  # None to disable pagination by default.

    def get_page_number(self, request):
        return int(request.query_params.get(self.page_query_param, 1))


class MobileOrgUnitSerializer(ModelSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Do not include the geo_json if not requested
        if not kwargs["context"].get("include_geo_json"):
            self.fields.pop("geo_json")

    class Meta:
        model = OrgUnit
        fields = [
            "name",
            "id",
            "parent_id",
            "org_unit_type_id",
            "org_unit_type_name",
            "validation_status",
            "created_at",
            "updated_at",
            "latitude",
            "longitude",
            "altitude",
            "reference_instance_id",
            "uuid",
            "aliases",
            "geo_json",
        ]

    parent_id = SerializerMethodField()
    org_unit_type_name = SerializerMethodField()
    created_at = TimestampField()
    updated_at = TimestampField()
    latitude = SerializerMethodField()
    longitude = SerializerMethodField()
    altitude = SerializerMethodField()
    geo_json = JSONField()

    @staticmethod
    def get_org_unit_type_name(org_unit: OrgUnit):
        return org_unit.org_unit_type.name if org_unit.org_unit_type else None

    @staticmethod
    def get_parent_id(org_unit: OrgUnit):
        return (
            org_unit.parent_id
            if org_unit.parent is None or org_unit.parent.validation_status == OrgUnit.VALIDATION_VALID
            else None
        )

    @staticmethod
    def get_latitude(org_unit: OrgUnit):
        return org_unit.location.y if org_unit.location else None

    @staticmethod
    def get_longitude(org_unit: OrgUnit):
        return org_unit.location.x if org_unit.location else None

    @staticmethod
    def get_altitude(org_unit: OrgUnit):
        return org_unit.location.z if org_unit.location else None


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


class MobileOrgUnitViewSet(ModelViewSet):
    f"""Org units API used by the mobile application

    This API is open to anonymous users for actions that are not org unit-specific (see create method for nuance in
    projects that require authentication).

    GET /api/mobile/orgunits/
    POST /api/mobile/orgunits/

    Optionally, {PAGE} and {LIMIT} parameters can be passed to paginate the results.

    GET /api/mobile/orgunits?{PAGE}=1&{LIMIT}=100

    You can also request the Geo Shape by adding the `shapes=1` to your query parameters.

    GET /api/mobile/orgunits?shapes=1
    """

    permission_classes = [HasOrgUnitPermission]
    serializer_class = MobileOrgUnitSerializer
    results_key = "orgUnits"

    def pagination_class(self):
        return MobileOrgUnitsSetPagination(self.results_key)

    def get_queryset(self):
        user = self.request.user
        app_id = self.request.query_params.get(APP_ID)

        limit_download_to_roots = False

        if user and not user.is_anonymous:
            limit_download_to_roots = Project.objects.get_for_user_and_app_id(user, app_id).has_feature(
                FeatureFlag.LIMIT_OU_DOWNLOAD_TO_ROOTS
            )

        if limit_download_to_roots:
            org_units = OrgUnit.objects.filter_for_user_and_app_id(self.request.user, app_id)
        else:
            org_units = OrgUnit.objects.filter_for_user_and_app_id(None, app_id)
        queryset = (
            org_units.filter(validation_status=OrgUnit.VALIDATION_VALID)
            .order_by("path")
            .prefetch_related("parent", "org_unit_type")
            .select_related("org_unit_type")
        )
        include_geo_json = self.check_include_geo_json()
        if include_geo_json:
            queryset = queryset.annotate(geo_json=RawSQL("ST_AsGeoJson(COALESCE(simplified_geom, geom))::json", []))
        return queryset

    def get_serializer_context(self) -> Dict[str, Any]:
        context = super().get_serializer_context()
        context["include_geo_json"] = self.check_include_geo_json()
        return context

    def check_include_geo_json(self):
        return self.request.query_params.get("shapes", "") == "true"

    def list(self, request, *args, **kwargs):
        app_id = self.request.query_params.get(APP_ID)
        if not app_id:
            return Response()
        roots_key = ""
        roots = []
        if request.user.is_authenticated:
            roots = self.request.user.iaso_profile.org_units.values_list("id", flat=True).order_by("id")
            roots_key = "|".join([str(root) for root in roots])

        page_size = self.paginator.get_page_size(request)
        page_number = self.paginator.get_page_number(request)

        include_geo_json = self.check_include_geo_json()

        cache_key = f"{app_id}-{page_size}-{page_number}-{'geo_json' if include_geo_json else '' }--{roots_key}"
        cached_response = cache.get(cache_key)
        if cached_response is None:
            super_response = super().list(request, *args, **kwargs)
            cached_response = super_response.data
            cache.set(cache_key, cached_response, 300)

        if page_number == 1:
            cached_response["roots"] = roots

        return Response(cached_response)

    @safe_api_import("orgUnit")
    def create(self, _, request):
        new_org_units = import_data(request.data, request.user, request.query_params.get(APP_ID))
        return Response([org_unit.as_dict() for org_unit in new_org_units])


def import_data(org_units, user, app_id):
    new_org_units = []
    project = Project.objects.get_for_user_and_app_id(user, app_id)
    org_units = sorted(org_units, key=get_timestamp)

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
