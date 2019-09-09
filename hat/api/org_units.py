from rest_framework import viewsets, status
from django.contrib.gis.geos import Polygon
from rest_framework.response import Response
from iaso.models import OrgUnit, Project, OrgUnitType
from hat.vector_control.models import APIImport
from django.contrib.gis.geos import Point
from .catches import timestamp_to_utc_datetime
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404
from hat.geo.geojson import geojson_queryset
from django.db.models import Q
from copy import deepcopy
from hat.audit.models import log_modification, ORG_UNIT_API
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


def import_data(org_units, user, api_import):
    new_org_units = []
    for org_unit in org_units:
        uuid = org_unit.get("id", None)
        latitude = org_unit.get("latitude", None)
        longitude = org_unit.get("longitude", None)
        altitude = org_unit.get("altitude", 0)
        org_unit_location = None

        if latitude and longitude:
            org_unit_location = Point(x=longitude, y=latitude, z=altitude, srid=4326)
        org_unit_db, created = OrgUnit.objects.get_or_create(uuid=uuid)

        if created:
            org_unit_db.custom = True
            org_unit_db.validated = False
            org_unit_db.name = org_unit.get("name", None)
            org_unit_db.accuracy = org_unit.get("accuracy", None)
            parent_id = org_unit.get("parentId", None)
            if parent_id is not None:
                if str.isdigit(parent_id):
                    org_unit_db.parent_id = parent_id
                else:
                    parent_org_unit = OrgUnit.objects.get(uuid=parent_id)
                    org_unit_db.parent_id = parent_org_unit.id
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

            org_unit_db.creator = user
            org_unit_db.source = "API"
            org_unit_db.api_import = api_import
            if org_unit_location:
                org_unit_db.location = org_unit_location

            new_org_units.append(org_unit_db)
            org_unit_db.save()
    return new_org_units


class OrgUnitViewSet(viewsets.ViewSet):
    """
    list:
    """

    # Check with Mobile application if not broken
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []

    def list(self, request):
        app_id = request.GET.get("app_id", "org.bluesquarehub.iaso")

        limit = request.GET.get("limit", None)
        validated = request.GET.get("validated", True)
        search = request.GET.get("search", None)
        page_offset = request.GET.get("page", 1)
        org_unit_type_id = request.GET.get("orgUnitTypeId", None)
        source_id = request.GET.get("sourceId", None)
        with_shape = request.GET.get("withShape", None)
        with_location = request.GET.get("withLocation", None)
        parent_id = request.GET.get("parent_id", None)
        order = request.GET.get("order", "id").split(",")
        org_unit_parent_id = request.GET.get("orgUnitParentId", None)

        if validated == "true":
            validated = True
        if validated == "false":
            validated = False

        queryset = (
            OrgUnit.objects.filter(validated=validated)
            .exclude(org_unit_type=None)
            .filter(org_unit_type__projects__app_id=app_id)
            .order_by(*order)
        )

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(aliases__contains=[search])
            )
        if org_unit_type_id:
            queryset = queryset.filter(org_unit_type__id=org_unit_type_id)

        if with_shape == "true":
            queryset = queryset.filter(simplified_geom__isnull=False)

        if with_shape == "false":
            queryset = queryset.filter(simplified_geom__isnull=True)

        if with_location == "true":
            queryset = queryset.filter(
                Q(location__isnull=False)
                | (Q(latitude__isnull=False) & Q(longitude__isnull=False))
            )

        if with_location == "false":
            queryset = queryset.filter(
                Q(location__isnull=True)
                & Q(latitude__isnull=True)
                & Q(longitude__isnull=True)
            )

        if parent_id:
            if parent_id == "0":
                queryset = queryset.filter(parent__isnull=True)
            else:
                queryset = queryset.filter(parent__id=parent_id)

        if org_unit_parent_id:
            queryset = queryset.filter(
                Q(id=org_unit_parent_id)
                | Q(parent__id=org_unit_parent_id)
                | Q(parent__parent__id=org_unit_parent_id)
                | Q(parent__parent__parent__id=org_unit_parent_id)
                | Q(parent__parent__parent__parent__id=org_unit_parent_id)
                | Q(parent__parent__parent__parent__parent__id=org_unit_parent_id)
                | Q(parent__parent__parent__parent__parent__parent__id=org_unit_parent_id)
                | Q(parent__parent__parent__parent__parent__parent__parent__id=org_unit_parent_id)
            )

        if source_id:
            queryset = queryset.filter(source=source_id)

        if limit:
            limit = int(limit)
            page_offset = int(page_offset)

            paginator = Paginator(queryset, limit)
            res = {"count": paginator.count}
            if page_offset > paginator.num_pages:
                page_offset = paginator.num_pages
            page = paginator.page(page_offset)

            res["orgunits"] = map(lambda x: x.as_dict(), page.object_list)
            res["has_next"] = page.has_next()
            res["has_previous"] = page.has_previous()
            res["page"] = page_offset
            res["pages"] = paginator.num_pages
            res["limit"] = limit
            return Response(res)
        else:
            queryset = queryset.select_related("org_unit_type")
            return Response({"orgUnits": [unit.as_dict() for unit in queryset]})

    def partial_update(self, request, pk=None):
        org_unit = get_object_or_404(OrgUnit, id=pk)
        original_copy = deepcopy(org_unit)
        org_unit.name = request.data.get("name", "")
        org_unit.short_name = request.data.get("short_name", "")
        org_unit.source = request.data.get("source", "")
        org_unit.validated = request.data.get("status", True)
        geo_json = request.data.get("geo_json", None)
        simplified_geom = request.data.get("simplified_geom", None)
        if (
            geo_json
            and geo_json["features"][0]["geometry"]
            and geo_json["features"][0]["geometry"]["coordinates"]
        ):
            if len(geo_json["features"][0]["geometry"]["coordinates"]) == 1:
                org_unit.simplified_geom = Polygon(
                    geo_json["features"][0]["geometry"]["coordinates"][0]
                )
            else:
                # DB has a single Polygon, refuse if we have more, or less.
                return Response(
                    "Only one polygon should be saved in the geo_json shape",
                    status=status.HTTP_400_BAD_REQUEST,
                )
        elif simplified_geom:
            org_unit.simplified_geom = simplified_geom
        else:
            org_unit.simplified_geom = None
        latitude = request.data.get("latitude", None)
        longitude = request.data.get("longitude", None)
        if latitude and str(latitude) != str(org_unit.latitude):
            org_unit.latitude = latitude
        if longitude and str(longitude) != str(org_unit.longitude):
            org_unit.longitude = longitude

        if latitude and longitude:
            org_unit.location = Point(x=latitude, y=longitude, srid=4326)
        org_unit.aliases = request.data.get("aliases", "")

        org_unit_type_id = request.data.get("org_unit_type_id", None)
        if org_unit_type_id:
            org_unit_type = get_object_or_404(OrgUnitType, id=org_unit_type_id)
            org_unit.org_unit_type = org_unit_type

        log_modification(
            original_copy, org_unit, source=ORG_UNIT_API, user=request.user
        )
        org_unit.save()

        res = org_unit.as_dict()
        res["geo_json"] = None
        if org_unit.simplified_geom:
            queryset = OrgUnit.objects.all().filter(id=org_unit.id)
            res["geo_json"] = geojson_queryset(
                queryset, geometry_field="simplified_geom"
            )

        return Response(res)

    def create(self, request):
        org_units = request.data

        api_import = APIImport()
        if not request.user.is_anonymous:
            api_import.user = request.user
        api_import.import_type = "orgUnit"
        api_import.json_body = org_units
        api_import.save()

        try:
            new_org_units = import_data(org_units, request.user, api_import)
            return Response([org_unit.as_dict() for org_unit in new_org_units])
        except Exception as exe:
            print("Excpetion", exe)
            return Response({"res": "a problem happened, but your data was saved"})

    def retrieve(self, request, pk=None):
        org_unit = get_object_or_404(OrgUnit, pk=pk)
        res = org_unit.as_dict()
        res["geo_json"] = None
        if org_unit.simplified_geom:
            queryset = OrgUnit.objects.all().filter(id=org_unit.id)
            res["geo_json"] = geojson_queryset(
                queryset, geometry_field="simplified_geom"
            )
        return Response(res)
