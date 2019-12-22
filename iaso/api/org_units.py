from rest_framework import viewsets, status
from django.contrib.gis.geos import Polygon
from rest_framework.response import Response
from iaso.models import OrgUnit, OrgUnitType, Instance, SourceVersion
from hat.vector_control.models import APIImport
from django.contrib.gis.geos import Point
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404
from hat.geo.geojson import geojson_queryset
from django.db.models import Q
from copy import deepcopy
from hat.audit.models import log_modification, ORG_UNIT_API
from hat.api.authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from time import gmtime, strftime
from iaso.utils import timestamp_to_datetime
from django.http import StreamingHttpResponse, HttpResponse
from django.core.exceptions import PermissionDenied
from hat.api.export_utils import (
    Echo,
    generate_xlsx,
    iter_items,
    timestamp_to_utc_datetime,
)


def check_access(org_unit, user):
    user_account = user.iaso_profile.account
    projects = org_unit.version.data_source.projects.all()
    account_ids = [p.account_id for p in projects]
    if user_account.id not in account_ids:
        raise PermissionDenied("Your account does not have access to this org unit")


def import_data(org_units, user, api_import):
    new_org_units = []
    version = None
    if not user.is_anonymous:
        version = user.iaso_profile.account.default_version

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
            org_unit_db.version = version
            org_unit_db.save()
    return new_org_units


class OrgUnitViewSet(viewsets.ViewSet):
    """
    list:
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []

    def list(self, request):
        queryset = OrgUnit.objects.all()
        if not request.user.is_anonymous:
            account = request.user.iaso_profile.account
            version_ids = (
                SourceVersion.objects.filter(data_source__projects__account=account)
                .values_list("id", flat=True)
                .distinct()
            )
            queryset = queryset.filter(version_id__in=version_ids)
            default_app_id = None
        else:
            default_app_id = "org.bluesquarehub.iaso"
        app_id = request.GET.get("app_id", default_app_id)

        limit = request.GET.get("limit", None)
        validated = request.GET.get("validated", "true")
        has_instances = request.GET.get("hasInstances", None)
        search = request.GET.get("search", None)
        page_offset = request.GET.get("page", 1)
        org_unit_type_id = request.GET.get("orgUnitTypeId", None)
        source_id = request.GET.get("sourceId", None)
        with_shape = request.GET.get("withShape", None)
        with_location = request.GET.get("withLocation", None)
        parent_id = request.GET.get("parent_id", None)
        source = request.GET.get("source", None)
        group = request.GET.get("group", None)
        version = request.GET.get("version", None)
        order = request.GET.get("order", "id").split(",")
        org_unit_parent_id = request.GET.get("orgUnitParentId", None)
        csv_format = request.GET.get("csv", None)
        xlsx_format = request.GET.get("xlsx", None)
        with_shapes = request.GET.get("withShapes", None)
        as_location = request.GET.get("asLocation", None)

        linked_to = request.GET.get("linkedTo", None)
        link_validated = request.GET.get("linkValidated", True)
        link_source = request.GET.get("linkSource", None)
        link_version = request.GET.get("linkVersion", None)

        if validated == "true":
            validated = True
        if validated == "false":
            validated = False

        if validated != "both":
            queryset = queryset.filter(validated=validated)

        if app_id:
            queryset = queryset.filter(  # .exclude(org_unit_type=None)
                org_unit_type__projects__app_id=app_id
            )
        queryset = queryset.order_by(*order)

        queryset = queryset.prefetch_related("version__data_source")

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(aliases__contains=[search])
            )

        if group:
            queryset = queryset.filter(groups__in=group.split(","))

        if source:
            queryset = queryset.filter(version__data_source_id__in=source.split(","))

        if version:
            queryset = queryset.filter(version=version)

        if has_instances is not None:
            ids_with_instances = Instance.objects.filter(
                org_unit__isnull=False
            ).values_list("org_unit_id", flat=True)
            if has_instances == "true":
                queryset = queryset.filter(id__in=ids_with_instances)
            else:
                queryset = queryset.exclude(id__in=ids_with_instances)

        if org_unit_type_id:
            queryset = queryset.filter(
                org_unit_type__id__in=org_unit_type_id.split(",")
            )

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
                | Q(
                    parent__parent__parent__parent__parent__parent__id=org_unit_parent_id
                )
                | Q(
                    parent__parent__parent__parent__parent__parent__parent__id=org_unit_parent_id
                )
            )

        if linked_to:
            queryset = queryset.filter(
                destination_set__destination_id=linked_to,
                destination_set__validated=link_validated,
            )
            if link_source:
                queryset = queryset.filter(version__data_source_id=link_source)
            if link_version:
                queryset = queryset.filter(version_id=link_version)

        if source_id:
            queryset = queryset.filter(sub_source=source_id)

        if csv_format is None:
            if limit and not as_location:
                limit = int(limit)
                page_offset = int(page_offset)

                paginator = Paginator(queryset, limit)
                res = {"count": paginator.count}
                if page_offset > paginator.num_pages:
                    page_offset = paginator.num_pages
                page = paginator.page(page_offset)
                print("queryset", queryset.query)
                res["orgunits"] = map(lambda x: x.as_dict(), page.object_list)
                res["has_next"] = page.has_next()
                res["has_previous"] = page.has_previous()
                res["page"] = page_offset
                res["pages"] = paginator.num_pages
                res["limit"] = limit
                return Response(res)
            elif with_shapes:
                queryset = queryset.select_related("org_unit_type")
                org_units = []
                for unit in queryset:
                    temp_org_unit = unit.as_dict()
                    temp_org_unit["geo_json"] = None
                    if temp_org_unit["has_geo_json"] == True:
                        shape_queryset = OrgUnit.objects.all().filter(
                            id=temp_org_unit["id"]
                        )
                        temp_org_unit["geo_json"] = geojson_queryset(
                            shape_queryset, geometry_field="simplified_geom"
                        )
                    org_units.append(temp_org_unit)
                return Response({"orgUnits": org_units})
            elif as_location:
                limit = int(limit)
                queryset = queryset.filter(
                    Q(location__isnull=False)
                    | (Q(latitude__isnull=False) & Q(longitude__isnull=False))
                    | Q(simplified_geom__isnull=False)
                )

                paginator = Paginator(queryset, limit)
                page = paginator.page(1)
                org_units = []
                for unit in page.object_list:
                    temp_org_unit = unit.as_location()
                    temp_org_unit["geo_json"] = None
                    if temp_org_unit["has_geo_json"] == True:
                        shape_queryset = OrgUnit.objects.all().filter(
                            id=temp_org_unit["id"]
                        )
                        temp_org_unit["geo_json"] = geojson_queryset(
                            shape_queryset, geometry_field="simplified_geom"
                        )
                    org_units.append(temp_org_unit)
                return Response(org_units)
            else:
                queryset = queryset.select_related("org_unit_type")
                return Response({"orgUnits": [unit.as_dict() for unit in queryset]})
        else:
            columns = [
                {"title": "ID", "width": 20},
                {"title": "Nom", "width": 20},
                {"title": "Type", "width": 20},
                {"title": "Latitude", "width": 40},
                {"title": "Longitude", "width": 20},
                {"title": "Date de création", "width": 20},
                {"title": "Date de modification", "width": 20},
                {"title": "Source", "width": 20},
                {"title": "Statut", "width": 20},
                {"title": "Référence externe", "width": 20},
                {"title": "parent1", "width": 20},
                {"title": "parent2", "width": 20},
                {"title": "parent3", "width": 20},
                {"title": "parent4", "width": 20},
            ]

            filename = "org_units"
            filename = "%s-%s" % (filename, strftime("%Y-%m-%d-%H-%M", gmtime()))

            def get_row(org_unit, **kwargs):
                idict = org_unit.as_dict_with_parents()
                created_at = timestamp_to_datetime(idict.get("created_at"))
                updated_at = timestamp_to_datetime(idict.get("updated_at"))
                org_unit_values = [
                    idict.get("id"),
                    idict.get("name"),
                    idict.get("org_unit_type_name"),
                    idict.get("latitude"),
                    idict.get("longitude"),
                    created_at,
                    updated_at,
                    idict.get("source"),
                    idict.get("status"),
                    idict.get("source_ref"),
                ]
                parent = idict.get("parent")
                for i in range(4):
                    if parent:
                        org_unit_values.append(parent.get("name"))
                        parent = parent.get("parent")
                    else:
                        org_unit_values.append("")

                return org_unit_values

            queryset.prefetch_related(
                "parent__parent__parent__parent"
            ).prefetch_related("parent__parent__parent").prefetch_related(
                "parent__parent"
            ).prefetch_related(
                "parent"
            )

            if xlsx_format:
                filename = filename + ".xlsx"
                response = HttpResponse(
                    generate_xlsx("Forms", columns, queryset, get_row),
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            if csv_format:
                response = StreamingHttpResponse(
                    streaming_content=(iter_items(queryset, Echo(), columns, get_row)),
                    content_type="text/csv",
                )
                filename = filename + ".csv"
            response["Content-Disposition"] = "attachment; filename=%s" % filename
            return response

    def partial_update(self, request, pk=None):
        org_unit = get_object_or_404(OrgUnit, id=pk)
        check_access(org_unit, request.user)
        original_copy = deepcopy(org_unit)
        org_unit.name = request.data.get("name", "")
        org_unit.short_name = request.data.get("short_name", "")
        org_unit.source = request.data.get("source", "")
        org_unit.validated = request.data.get("status", True)
        geo_json = request.data.get("geo_json", None)
        catchment = request.data.get("catchment", None)
        simplified_geom = request.data.get("simplified_geom", None)
        org_unit_type_id = request.data.get("org_unit_type_id", None)
        parent_id = request.data.get("parent_id", None)
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

        if (
            catchment
            and catchment["features"][0]["geometry"]
            and catchment["features"][0]["geometry"]["coordinates"]
        ):
            if len(catchment["features"][0]["geometry"]["coordinates"]) == 1:
                org_unit.catchment = Polygon(
                    catchment["features"][0]["geometry"]["coordinates"][0]
                )
            else:
                # DB has a single Polygon, refuse if we have more, or less.
                return Response(
                    "Only one polygon should be saved in the catchment shape",
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            org_unit.catchment = None
        latitude = request.data.get("latitude", None)
        longitude = request.data.get("longitude", None)
        if latitude and str(latitude) != str(org_unit.latitude):
            org_unit.latitude = latitude
        if longitude and str(longitude) != str(org_unit.longitude):
            org_unit.longitude = longitude
        if not latitude:
            org_unit.latitude = None
        if not longitude:
            org_unit.longitude = None

        if latitude and longitude:
            org_unit.location = Point(x=float(longitude), y=float(latitude), srid=4326)
        else:
            org_unit.location = None
        org_unit.aliases = request.data.get("aliases", "")

        if org_unit_type_id:
            org_unit_type = get_object_or_404(OrgUnitType, id=org_unit_type_id)
            org_unit.org_unit_type = org_unit_type
        if parent_id:
            parent_org_unit = get_object_or_404(OrgUnit, id=parent_id)
            org_unit.parent = parent_org_unit
        else:
            org_unit.parent = None

        log_modification(
            original_copy, org_unit, source=ORG_UNIT_API, user=request.user
        )
        org_unit.save()

        res = org_unit.as_dict_with_parents()
        res["geo_json"] = None
        res["catchment"] = None
        if org_unit.simplified_geom or org_unit.catchment:
            queryset = OrgUnit.objects.all().filter(id=org_unit.id)
            if org_unit.simplified_geom:
                res["geo_json"] = geojson_queryset(
                    queryset, geometry_field="simplified_geom"
                )
            if org_unit.catchment:
                res["catchment"] = geojson_queryset(
                    queryset, geometry_field="catchment"
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
            print("Exception", exe)
            return Response({"res": "a problem happened, but your data was saved"})

    def retrieve(self, request, pk=None):
        org_unit = get_object_or_404(OrgUnit, pk=pk)
        check_access(org_unit, request.user)

        res = org_unit.as_dict_with_parents()
        res["geo_json"] = None
        res["catchment"] = None
        if org_unit.simplified_geom or org_unit.catchment:
            queryset = OrgUnit.objects.all().filter(id=org_unit.id)
            if org_unit.simplified_geom:
                res["geo_json"] = geojson_queryset(
                    queryset, geometry_field="simplified_geom"
                )
            if org_unit.catchment:
                res["catchment"] = geojson_queryset(
                    queryset, geometry_field="catchment"
                )
        return Response(res)
