from typing import Any, Dict, Optional

import django_filters

from django.contrib.gis.db.models import GeometryField
from django.contrib.gis.db.models.aggregates import Extent
from django.contrib.gis.db.models.functions import GeomOutputGeoFunc
from django.core.cache import cache
from django.db.models.expressions import RawSQL
from django.db.models.functions import Cast
from django.http import HttpResponseNotFound
from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.fields import SerializerMethodField
from rest_framework.response import Response

from iaso.api.common import ModelViewSet, Paginator, TimestampField, safe_api_import
from iaso.api.instances.instances import InstanceFileSerializer
from iaso.api.org_units import import_org_units
from iaso.api.permission_checks import IsAuthenticatedOrReadOnlyWhenNoAuthenticationRequired
from iaso.api.query_params import APP_ID, IDS, LIMIT, PAGE
from iaso.api.serializers import AppIdSerializer
from iaso.models import FeatureFlag, Instance, OrgUnit, Project
from iaso.permissions.core_permissions import (
    CORE_FORMS_PERMISSION,
    CORE_ORG_UNITS_PERMISSION,
    CORE_ORG_UNITS_READ_PERMISSION,
    CORE_SUBMISSIONS_PERMISSION,
)


SHAPE_RESULTS_MAX = 1000


class MobileOrgUnitsSetPagination(Paginator):
    page_size_query_param = LIMIT
    page_query_param = PAGE
    page_size = None  # None to disable pagination by default.

    def get_iaso_page_number(self, request):
        return int(request.query_params.get(self.page_query_param, 1))

    def get_page_size(self, request):
        page_size = super().get_page_size(request)
        if request.query_params.get("shapes", "false").lower() == "true":
            if page_size and page_size > SHAPE_RESULTS_MAX:
                return SHAPE_RESULTS_MAX

        return super().get_page_size(request)


class ReferenceInstancesFilter(django_filters.rest_framework.FilterSet):
    last_sync = django_filters.IsoDateTimeFilter(field_name="updated_at", lookup_expr="gte")

    class Meta:
        model = Instance
        fields = []


class ReferenceInstancesSerializer(serializers.ModelSerializer):
    created_at = TimestampField(read_only=True, source="source_created_at_with_fallback")
    updated_at = TimestampField(read_only=True, source="source_updated_at_with_fallback")
    instance_files = InstanceFileSerializer(many=True, read_only=True, source="instancefile_set")

    class Meta:
        model = Instance
        fields = [
            "id",
            "uuid",
            "form_id",
            "form_version_id",
            "created_at",
            "updated_at",
            "json",
            "instance_files",
        ]


class MobileOrgUnitSerializer(serializers.ModelSerializer):
    app_id = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Do not include the geo_json if not requested
        self.app_id = kwargs["context"].get("app_id")
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
            "uuid",
            "aliases",
            "geo_json",
            "groups",
            "opening_date",
            "closed_date",
        ]

    parent_id = SerializerMethodField()
    org_unit_type_name = SerializerMethodField()
    created_at = TimestampField()
    updated_at = TimestampField()
    latitude = SerializerMethodField()
    longitude = SerializerMethodField()
    altitude = SerializerMethodField()
    geo_json = serializers.JSONField()

    @staticmethod
    def get_org_unit_type_name(org_unit: OrgUnit):
        return org_unit.org_unit_type.name if org_unit.org_unit_type else None

    def get_parent_id(self, org_unit: OrgUnit):
        parent = org_unit.parent
        return (
            org_unit.parent_id
            if parent is None
            or parent.validation_status == OrgUnit.VALIDATION_VALID
            and (self.app_id is None or any(p.app_id == self.app_id for p in parent.org_unit_type.projects.all()))
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


class HasOrgUnitPermission(IsAuthenticatedOrReadOnlyWhenNoAuthenticationRequired):
    def has_object_permission(self, request, view, obj):
        if not (
            request.user.is_authenticated
            and (
                request.user.has_perm(CORE_FORMS_PERMISSION.full_name())
                or request.user.has_perm(CORE_ORG_UNITS_PERMISSION.full_name())
                or request.user.has_perm(CORE_ORG_UNITS_READ_PERMISSION.full_name())
                or request.user.has_perm(CORE_SUBMISSIONS_PERMISSION.full_name())
            )
        ):
            return False

        # TODO: can be handled with get_queryset()
        user_account = request.user.iaso_profile.account
        projects = obj.version.data_source.projects.all()
        account_ids = [p.account_id for p in projects]

        return user_account.id in account_ids


BUFFER_FOR_POINT = 0.008 * 3  # 0.008 degrees is around 3km at the equator


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

    You can also list the reference instances of a given `OrgUnit` ID.

    GET /api/mobile/orgunits/ID or UUID/reference_instances/?app_id={APP_ID}

    It is also possible to pass a list of ids to retrieve them regardless of their status:

    GET /api/mobile/orgunits/?app_id={APP_ID}&ids=id_1,id_2,id_3
    """

    permission_classes = [HasOrgUnitPermission]
    serializer_class = MobileOrgUnitSerializer
    results_key = "orgUnits"

    def pagination_class(self):
        return MobileOrgUnitsSetPagination(self.results_key)

    def get_queryset(self):
        user = self.request.user
        app_id = self.get_app_id()

        limit_download_to_roots = False

        project = Project.objects.get_for_user_and_app_id(user, app_id)
        if user and not user.is_anonymous:
            limit_download_to_roots = project.has_feature(FeatureFlag.LIMIT_OU_DOWNLOAD_TO_ROOTS)

        if limit_download_to_roots:
            org_units = OrgUnit.objects.filter_for_user_and_project(self.request.user, project)
        else:
            org_units = OrgUnit.objects.filter_for_user_and_project(None, project)
        queryset = (
            org_units.filter(validation_status=OrgUnit.VALIDATION_VALID)
            .order_by("path")
            .prefetch_related("parent__org_unit_type__projects", "groups")
            .select_related("org_unit_type", "parent", "parent__org_unit_type")
        )
        include_geo_json = self.check_include_geo_json()
        if include_geo_json:
            queryset = queryset.annotate(
                geo_json=RawSQL("ST_AsGeoJson(COALESCE(iaso_orgunit.simplified_geom, iaso_orgunit.geom))::json", [])
            )

        return queryset

    def get_serializer_context(self) -> Dict[str, Any]:
        context = super().get_serializer_context()
        context["include_geo_json"] = self.check_include_geo_json()
        context["app_id"] = self.get_app_id()
        return context

    def check_include_geo_json(self):
        return self.request.query_params.get("shapes", "") == "true"

    def get_app_id(self):
        return AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=False)

    def list(self, request, *args, **kwargs):
        app_id = self.get_app_id()
        if not app_id:
            return Response()

        ids = request.query_params.get(IDS, None)
        if ids is not None:
            ids = ids.split(",")
            queryset = (
                OrgUnit.objects.filter_for_user_and_app_id(None, app_id)
                .order_by("path")
                .prefetch_related("parent__org_unit_type__projects", "groups")
                .select_related("org_unit_type", "parent", "parent__org_unit_type")
                .filter(id__in=ids)
            )
            if len(queryset) != len(ids):
                return HttpResponseNotFound("One or more IDs were not found.")
            serializer = self.get_serializer(queryset, many=True)
            return Response({self.results_key: serializer.data})

        roots_key = ""
        roots = []
        if request.user.is_authenticated:
            roots = self.request.user.iaso_profile.org_units.values_list("id", flat=True).order_by("id")
            roots_key = "|".join([str(root) for root in roots])

        page_size = self.paginator.get_page_size(request)
        page_number = self.paginator.get_iaso_page_number(request)

        include_geo_json = self.check_include_geo_json()

        cache_key = f"{app_id}-{page_size}-{page_number}-{'geo_json' if include_geo_json else ''}--{roots_key}"
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
        data = sorted(request.data, key=lambda ou: float(ou["created_at"]))
        new_org_units = import_org_units(data, request.user, self.get_app_id())
        return Response([org_unit.as_dict() for org_unit in new_org_units])

    @action(detail=False, methods=["GET"])
    def boundingbox(self, request):
        qs = self.get_queryset()

        aggregate = qs.aggregate(
            bbox_location=Extent(Buffer(Cast("location", GeometryField(dim=3)), BUFFER_FOR_POINT)),
            bbox_geom=Extent(Cast("simplified_geom", GeometryField())),
        )
        bbox_location = aggregate["bbox_location"]
        bbox_geom = aggregate["bbox_geom"]
        bbox = bbox_merge(bbox_location, bbox_geom)
        results = []
        if bbox:
            results.append(
                {
                    "northern": bbox[0],
                    "east": bbox[1],
                    "south": bbox[2],
                    "west": bbox[3],
                }
            )
        # merge the bbox
        return Response(data={"results": results})

    @action(detail=True, methods=["get"])
    def reference_instances(self, request, pk):
        """
        List the reference instances of the given `OrgUnit` pk or uuid.
        """
        authorized_org_units = self.get_queryset()
        try:
            org_unit = get_object_or_404(authorized_org_units, id=pk)
        except ValueError:
            org_unit = get_object_or_404(authorized_org_units, uuid=pk)

        reference_instances = (
            org_unit.reference_instances(manager="non_deleted_objects")
            .prefetch_related("instancefile_set")
            .order_by("id")
        )

        filtered_reference_instances = ReferenceInstancesFilter(request.query_params, reference_instances).qs

        self.paginator.results_key = "instances"
        self.paginator.page_size = self.paginator.get_page_size(request) or 10
        paginated_reference_instances = self.paginate_queryset(filtered_reference_instances)
        serializer = ReferenceInstancesSerializer(
            paginated_reference_instances, many=True, context=self.get_serializer_context()
        )
        return self.get_paginated_response(serializer.data)


def bbox_merge(a: Optional[tuple], b: Optional[tuple]) -> Optional[tuple]:
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
