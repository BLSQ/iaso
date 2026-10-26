from typing import Any, Dict

from django.contrib.gis.db.models import GeometryField
from django.contrib.gis.db.models.aggregates import Extent
from django.core.cache import cache
from django.db.models import F
from django.db.models.expressions import RawSQL
from django.db.models.functions import Cast
from django.http import Http404, HttpResponseNotFound
from django.shortcuts import get_object_or_404
from django.utils.functional import cached_property
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.api.common import ModelViewSet, safe_api_import
from iaso.api.org_units.filters import ReferenceInstancesFilter
from iaso.api.org_units.pagination import MobileOrgUnitsSetPagination
from iaso.api.org_units.permissions import HasMobileOrgUnitPermission
from iaso.api.org_units.serializers.mobile import MobileOrgUnitSerializer, ReferenceInstancesSerializer
from iaso.api.org_units.utils import Buffer, bbox_merge, import_org_units
from iaso.api.permission_checks import AuthenticationEnforcedPermission
from iaso.api.query_params import APP_ID, IDS, LIMIT, PAGE
from iaso.api.serializers import AppIdSerializer
from iaso.models import FeatureFlag, OrgUnit, Project


BUFFER_FOR_POINT = 0.008 * 3  # 0.008 degrees is around 3km at the equator


@extend_schema(tags=["Mobile", "Org units"])
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

    permission_classes = [AuthenticationEnforcedPermission, HasMobileOrgUnitPermission]
    serializer_class = MobileOrgUnitSerializer
    pagination_class = MobileOrgUnitsSetPagination

    @property
    def results_key(self):
        if self.action == "reference_instances":
            return "instances"
        return "orgUnits"

    @cached_property
    def project(self):
        if not hasattr(self, "request") or self.request is None:
            return None
        user = self.request.user
        app_id = self.get_app_id()
        try:
            return Project.objects.get_for_user_and_app_id(user, app_id)
        except Project.DoesNotExist:
            return None

    def get_queryset(self):
        user = self.request.user
        project = self.project
        if project is None:
            return OrgUnit.objects.none()

        limit_download_to_roots = False

        if user and not user.is_anonymous:
            limit_download_to_roots = project.has_feature(FeatureFlag.LIMIT_OU_DOWNLOAD_TO_ROOTS)

        if limit_download_to_roots:
            org_units = OrgUnit.objects.filter_for_user_and_project(self.request.user, project)
        else:
            org_units = OrgUnit.objects.filter_for_user_and_project(None, project)
        queryset = (
            org_units.filter(validation_status=OrgUnit.VALIDATION_VALID)
            .order_by("path")
            .annotate(
                parent_validation_status=F("parent__validation_status"),
                parent_org_unit_type_id=F("parent__org_unit_type_id"),
                org_unit_type_name_annotated=F("org_unit_type__name"),
            )
            .prefetch_related("groups")
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
        context["project"] = self.project
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
                .annotate(
                    parent_validation_status=F("parent__validation_status"),
                    parent_org_unit_type_id=F("parent__org_unit_type_id"),
                    org_unit_type_name_annotated=F("org_unit_type__name"),
                )
                .prefetch_related("groups")
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
        try:
            new_org_units = import_org_units(data, request.user, self.get_app_id())
        except Project.DoesNotExist:
            raise Http404
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
            .filter(form__deleted_at__isnull=True)
            .prefetch_related("instancefile_set")
            .order_by("id")
        )

        filtered_reference_instances = ReferenceInstancesFilter(request.query_params, reference_instances).qs

        self.paginator.page_size = self.paginator.get_page_size(request) or 10
        paginated_reference_instances = self.paginate_queryset(filtered_reference_instances)
        serializer = ReferenceInstancesSerializer(
            paginated_reference_instances, many=True, context=self.get_serializer_context()
        )
        return self.get_paginated_response(serializer.data)
