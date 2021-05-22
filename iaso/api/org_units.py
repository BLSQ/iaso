from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from django.contrib.gis.geos import Polygon, GEOSGeometry
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils.translation import gettext as _
from iaso.api.common import safe_api_import
from iaso.gpkg import org_units_to_gpkg
from iaso.models import OrgUnit, OrgUnitType, Group, Project, SourceVersion, Form, DataSource
from django.contrib.gis.geos import Point

from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404

from iaso.models.org_unit_search import build_org_units_queryset
from iaso.utils import geojson_queryset
from django.db.models import Q
from copy import deepcopy
from hat.audit import models as audit_models
from time import gmtime, strftime
from django.http import StreamingHttpResponse, HttpResponse
from hat.api.export_utils import Echo, generate_xlsx, iter_items, timestamp_to_utc_datetime
import json
from django.db.models import Value, IntegerField


class HasOrgUnitPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not (
            request.user.is_authenticated
            and (
                request.user.has_perm("menupermissions.iaso_forms")
                or request.user.has_perm("menupermissions.iaso_org_units")
            )
        ):
            return False

        if obj.version.data_source.read_only and request.method != "GET":
            return False
        # TODO: can be handled with get_queryset()
        user_account = request.user.iaso_profile.account
        projects = obj.version.data_source.projects.all()
        account_ids = [p.account_id for p in projects]

        return user_account.id in account_ids


class OrgUnitViewSet(viewsets.ViewSet):
    """Org units API

    This API is open to anonymous users for actions that are not org unit-specific (see create method for nuance in
    projects that require authentication). Actions on specific org units are restricted to authenticated users with the
    "menupermissions.iaso_forms" or "menupermissions.iaso_org_units" permission.

    GET /api/orgunits/
    GET /api/orgunits/<id>
    POST /api/orgunits/
    PATCH /api/orgunits/<id>
    """

    permission_classes = [HasOrgUnitPermission]

    def get_queryset(self):
        return OrgUnit.objects.filter_for_user_and_app_id(self.request.user, self.request.query_params.get("app_id"))

    def list(self, request):
        queryset = self.get_queryset()

        forms = Form.objects.filter_for_user_and_app_id(self.request.user, self.request.query_params.get("app_id"))
        limit = request.GET.get("limit", None)
        page_offset = request.GET.get("page", 1)
        order = request.GET.get("order", "name").split(",")

        csv_format = bool(request.query_params.get("csv"))
        xlsx_format = bool(request.query_params.get("xlsx"))
        gpkg_format = bool(request.query_params.get("gpkg"))
        is_export = any([csv_format, xlsx_format, gpkg_format])

        with_shapes = request.GET.get("withShapes", None)
        as_location = request.GET.get("asLocation", None)
        small_search = request.GET.get("smallSearch", None)
        direct_children = request.GET.get("onlyDirectChildren", False)

        queryset.prefetch_related("group_set")

        if as_location:
            queryset = queryset.filter(Q(location__isnull=False) | Q(simplified_geom__isnull=False))

        searches = request.GET.get("searches", None)
        counts = []
        if not request.user.is_anonymous:
            profile = request.user.iaso_profile
        else:
            profile = None
        if searches:
            search_index = 0
            base_queryset = queryset
            for search in json.loads(searches):
                additional_queryset = build_org_units_queryset(
                    base_queryset, search, profile, is_export, forms
                ).annotate(search_index=Value(search_index, IntegerField()))
                if search_index == 0:
                    queryset = additional_queryset
                else:
                    queryset = queryset.union(additional_queryset)
                counts.append({"index": search_index, "count": additional_queryset.count()})
                search_index += 1
        else:
            queryset = build_org_units_queryset(queryset, request.GET, profile, is_export, forms)

        queryset = queryset.order_by(*order)

        if not is_export:
            if limit and not as_location:
                limit = int(limit)
                page_offset = int(page_offset)
                paginator = Paginator(queryset, limit)
                res = {"count": paginator.count}
                res["counts"] = counts
                if page_offset > paginator.num_pages:
                    page_offset = paginator.num_pages
                page = paginator.page(page_offset)
                if small_search:
                    res["orgunits"] = map(lambda x: x.as_small_dict(), page.object_list)
                else:
                    res["orgunits"] = map(lambda x: x.as_dict_with_parents(light=False), page.object_list)

                res["has_next"] = page.has_next()
                res["has_previous"] = page.has_previous()
                res["page"] = page_offset
                res["pages"] = paginator.num_pages
                res["limit"] = limit

                res["orgunits"] = list(res["orgunits"])

                return Response(res)
            elif with_shapes:

                org_units = []
                for unit in queryset:
                    temp_org_unit = unit.as_dict()
                    temp_org_unit["geo_json"] = None
                    if temp_org_unit["has_geo_json"] == True:
                        shape_queryset = self.get_queryset().filter(id=temp_org_unit["id"])
                        temp_org_unit["geo_json"] = geojson_queryset(shape_queryset, geometry_field="simplified_geom")
                    org_units.append(temp_org_unit)
                return Response({"orgUnits": org_units})
            elif as_location:
                limit = int(limit)
                paginator = Paginator(queryset, limit)
                page = paginator.page(1)
                org_units = []
                for unit in page.object_list:
                    temp_org_unit = unit.as_location()
                    temp_org_unit["geo_json"] = None
                    if temp_org_unit["has_geo_json"] == True:
                        shape_queryset = self.get_queryset().filter(id=temp_org_unit["id"])
                        temp_org_unit["geo_json"] = geojson_queryset(shape_queryset, geometry_field="simplified_geom")
                    org_units.append(temp_org_unit)
                return Response(org_units)
            else:
                queryset = queryset.select_related("org_unit_type")
                return Response({"orgUnits": [unit.as_dict_for_mobile() for unit in queryset]})
        elif gpkg_format:
            return self.list_to_gpkg(queryset)
        else:

            """
            When filtering the org units by group, the values_list will return the groups also filtered.
            In order to get the all groups independently of filters, we should get the groups
            based on the org_unit FK.
            """
            org_ids = queryset.order_by("pk").values_list("pk", flat=True).distinct()
            groups = Group.objects.filter(org_units__id__in=list(org_ids)).only("id", "name").distinct("id")

            columns = [
                {"title": "ID", "width": 10},
                {"title": "Nom", "width": 25},
                {"title": "Type", "width": 15},
                {"title": "Latitude", "width": 15},
                {"title": "Longitude", "width": 15},
                {"title": "Date de création", "width": 20},
                {"title": "Date de modification", "width": 20},
                {"title": "Source", "width": 20},
                {"title": "Validé", "width": 15},
                {"title": "Référence externe", "width": 17},
                {"title": "parent 1", "width": 20},
                {"title": "parent 2", "width": 20},
                {"title": "parent 3", "width": 20},
                {"title": "parent 4", "width": 20},
                {"title": "Ref Ext parent 1", "width": 20},
                {"title": "Ref Ext parent 2", "width": 20},
                {"title": "Ref Ext parent 3", "width": 20},
                {"title": "Ref Ext parent 4", "width": 20},
            ]
            counts_by_forms = []
            if is_export:
                for frm in forms:
                    columns.append({"title": "Total d'instances " + frm.name, "width": 15})
                    counts_by_forms.append("form_" + str(frm.id) + "_instances")
                columns.append({"title": "Total d'instances", "width": 15})

            for group in groups:
                group.org_units__ids = list(group.org_units.values_list("id", flat=True))
                columns.append({"title": group.name, "width": 20})

            parent_field_names = ["parent__" * i + "name" for i in range(1, 5)]
            parent_field_names.extend(["parent__" * i + "source_ref" for i in range(1, 5)])

            queryset = queryset.values(
                "id",
                "name",
                "org_unit_type__name",
                "version__data_source__name",
                "validation_status",
                "source_ref",
                "created_at",
                "updated_at",
                "location",
                *parent_field_names,
                *counts_by_forms,
                "instances_count",
            )

            filename = "org_units"
            filename = "%s-%s" % (filename, strftime("%Y-%m-%d-%H-%M", gmtime()))

            def get_row(org_unit, **kwargs):
                location = org_unit.get("location", None)
                org_unit_values = [
                    org_unit.get("id"),
                    org_unit.get("name"),
                    org_unit.get("org_unit_type__name"),
                    location.y if location else None,
                    location.x if location else None,
                    org_unit.get("created_at").strftime("%Y-%m-%d %H:%M"),
                    org_unit.get("updated_at").strftime("%Y-%m-%d %H:%M"),
                    org_unit.get("version__data_source__name"),
                    org_unit.get("validation_status"),
                    org_unit.get("source_ref"),
                    *[org_unit.get(field_name) for field_name in parent_field_names],
                    *[org_unit.get(count_field_name) for count_field_name in counts_by_forms],
                    org_unit.get("instances_count"),
                    *[int(org_unit.get("id") in group.org_units__ids) for group in groups],
                ]
                return org_unit_values

            queryset.prefetch_related("parent__parent__parent__parent").prefetch_related(
                "parent__parent__parent"
            ).prefetch_related("parent__parent").prefetch_related("parent")

            if xlsx_format:
                filename = filename + ".xlsx"
                response = HttpResponse(
                    generate_xlsx("Forms", columns, queryset, get_row),
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            if csv_format:
                response = StreamingHttpResponse(
                    streaming_content=(iter_items(queryset, Echo(), columns, get_row)), content_type="text/csv"
                )
                filename = filename + ".csv"
            response["Content-Disposition"] = "attachment; filename=%s" % filename
            return response

    def list_to_gpkg(self, queryset):
        queryset = queryset.prefetch_related("parent", "org_unit_type")

        response = HttpResponse(org_units_to_gpkg(queryset), content_type="application/octet-stream")
        filename = f"org_units-{timezone.now().strftime('%Y-%m-%d-%H-%M')}.gpkg"
        response["Content-Disposition"] = f"attachment; filename={filename}"

        return response

    def partial_update(self, request, pk=None):
        errors = []
        org_unit = get_object_or_404(self.get_queryset(), id=pk)

        self.check_object_permissions(request, org_unit)

        original_copy = deepcopy(org_unit)

        name = request.data.get("name", None)
        if not name:
            errors.append({"errorKey": "name", "errorMessage": _("Org unit name is required")})
        org_unit.name = name

        source_ref = request.data.get("source_ref", None)
        org_unit.source_ref = source_ref

        org_unit.short_name = request.data.get("short_name", "")
        org_unit.source = request.data.get("source", "")

        validation_status = request.data.get("validation_status", None)
        if validation_status is None:
            org_unit.validation_status = OrgUnit.VALIDATION_NEW
        else:
            org_unit.validation_status = validation_status
        geo_json = request.data.get("geo_json", None)
        catchment = request.data.get("catchment", None)
        simplified_geom = request.data.get("simplified_geom", None)
        org_unit_type_id = request.data.get("org_unit_type_id", None)
        parent_id = request.data.get("parent_id", None)
        groups = request.data.get("groups")

        if False:  # simplified geom shape editing is currently disabled
            if geo_json and geo_json["features"][0]["geometry"] and geo_json["features"][0]["geometry"]["coordinates"]:
                if len(geo_json["features"][0]["geometry"]["coordinates"]) == 1:
                    org_unit.simplified_geom = Polygon(geo_json["features"][0]["geometry"]["coordinates"][0])
                else:
                    # DB has a single Polygon, refuse if we have more, or less.
                    return Response(
                        "Only one polygon should be saved in the geo_json shape", status=status.HTTP_400_BAD_REQUEST
                    )
            elif simplified_geom:
                org_unit.simplified_geom = simplified_geom
            else:
                org_unit.simplified_geom = None

        if False:  # catchment shape editing is currently disabled
            if (
                catchment
                and catchment["features"][0]["geometry"]
                and catchment["features"][0]["geometry"]["coordinates"]
            ):
                if len(catchment["features"][0]["geometry"]["coordinates"]) == 1:
                    org_unit.catchment = Polygon(catchment["features"][0]["geometry"]["coordinates"][0])
                else:
                    # DB has a single Polygon, refuse if we have more, or less.
                    return Response(
                        "Only one polygon should be saved in the catchment shape", status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                org_unit.catchment = None

        latitude = request.data.get("latitude", None)
        longitude = request.data.get("longitude", None)

        if latitude and longitude:
            # TODO: remove this mess once the frontend handles altitude edition
            if "altitude" in request.data:  # provided explicitly
                altitude = request.data["altitude"]
            elif org_unit.location is not None:  # not provided but we have a current location: keep altitude
                altitude = org_unit.location.z
            else:  # no location yet, no altitude provided, set to 0
                altitude = 0

            org_unit.location = Point(x=longitude, y=latitude, z=altitude, srid=4326)
        else:
            org_unit.location = None

        org_unit.aliases = request.data.get("aliases", "")

        if org_unit_type_id:
            org_unit_type = get_object_or_404(OrgUnitType, id=org_unit_type_id)
            org_unit.org_unit_type = org_unit_type
        else:
            errors.append({"errorKey": "org_unit_type_id", "errorMessage": _("Org unit type is required")})

        if parent_id:
            parent_org_unit = get_object_or_404(self.get_queryset(), id=parent_id)
            org_unit.parent = parent_org_unit
        else:
            org_unit.parent = None
        new_groups = []
        for group in groups:
            temp_group = get_object_or_404(Group, id=group)
            new_groups.append(temp_group)
        org_unit.groups.set(new_groups)
        audit_models.log_modification(original_copy, org_unit, source=audit_models.ORG_UNIT_API, user=request.user)
        if not errors:
            org_unit.save()

            res = org_unit.as_dict_with_parents()
            res["geo_json"] = None
            res["catchment"] = None
            if org_unit.simplified_geom or org_unit.catchment:
                queryset = self.get_queryset().filter(id=org_unit.id)
                if org_unit.simplified_geom:
                    res["geo_json"] = geojson_queryset(queryset, geometry_field="simplified_geom")
                if org_unit.catchment:
                    res["catchment"] = geojson_queryset(queryset, geometry_field="catchment")

            return Response(res)
        else:
            return Response(errors, status=400)

    @action(detail=False, methods=["POST"], permission_classes=[permissions.IsAuthenticated, HasOrgUnitPermission])
    def create_org_unit(self, request):
        errors = []
        org_unit = OrgUnit()

        profile = request.user.iaso_profile
        if request.user:
            org_unit.creator = request.user
        name = request.data.get("name", None)
        version_id = request.data.get("version_id", None)
        if version_id:
            authorized_ids = list(
                SourceVersion.objects.filter(data_source__projects__account=profile.account).values_list(
                    "id", flat=True
                )
            )
            if version_id in authorized_ids:
                org_unit.version_id = version_id
            else:
                errors.append(
                    {
                        "errorKey": "version_id",
                        "errorMessage": _("Unauthorized version id")
                        + ": "
                        + str(version_id)
                        + " | authorized ones are "
                        + str(authorized_ids),
                    }
                )
        else:
            org_unit.version = profile.account.default_version

        if not name:
            errors.append({"errorKey": "name", "errorMessage": _("Org unit name is required")})

        if org_unit.version.data_source.read_only:
            errors.append(
                {"errorKey": "name", "errorMessage": "Creation of org unit not authorized on read only data source"}
            )

        org_unit.name = name

        source_ref = request.data.get("source_ref", None)
        org_unit.source_ref = source_ref

        org_unit.short_name = request.data.get("short_name", "")
        org_unit.source = request.data.get("source", "")

        validation_status = request.data.get("validation_status", None)
        if validation_status is None:
            org_unit.validation_status = OrgUnit.VALIDATION_NEW
        else:
            org_unit.validation_status = validation_status

        org_unit_type_id = request.data.get("org_unit_type_id", None)
        parent_id = request.data.get("parent_id", None)
        groups = request.data.get("groups", [])

        org_unit.aliases = request.data.get("aliases", [])

        geom = request.data.get("geom")
        if geom:
            try:
                g = GEOSGeometry(json.dumps(geom))
                org_unit.geom = g
                org_unit.simplified_geom = g  # maybe think of a standard simplification here?
            except Exception as e:
                errors.append({"errorKey": "geom", "errorMessage": _("Can't parse geom")})

        latitude = request.data.get("latitude")
        longitude = request.data.get("longitude")
        altitude = request.data.get("altitude", 0)
        if latitude and longitude:
            org_unit.location = Point(x=longitude, y=latitude, z=altitude, srid=4326)

        if not org_unit_type_id:
            errors.append({"errorKey": "org_unit_type_id", "errorMessage": _("Org unit type is required")})

        if parent_id:
            parent_org_unit = get_object_or_404(self.get_queryset(), id=parent_id)
            if org_unit.version_id != parent_org_unit.version_id:
                errors.append({"errorKey": "parent_id", "errorMessage": _("Parent is not in the same version")})
            org_unit.parent = parent_org_unit

        if not errors:
            org_unit.save()
        else:
            return Response(errors, status=400)
        org_unit_type = get_object_or_404(OrgUnitType, id=org_unit_type_id)
        org_unit.org_unit_type = org_unit_type

        new_groups = []
        for group in groups:
            temp_group = get_object_or_404(Group, id=group)
            new_groups.append(temp_group)
        org_unit.groups.set(new_groups)

        audit_models.log_modification(None, org_unit, source=audit_models.ORG_UNIT_API, user=request.user)
        org_unit.save()

        res = org_unit.as_dict_with_parents()
        return Response(res)

    @safe_api_import("orgUnit")
    def create(self, _, request):
        new_org_units = import_data(request.data, request.user, request.query_params.get("app_id"))
        return Response([org_unit.as_dict() for org_unit in new_org_units])

    def retrieve(self, request, pk=None):
        org_unit = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, org_unit)
        res = org_unit.as_dict_with_parents(light=False, light_parents=False)
        res["geo_json"] = None
        res["catchment"] = None
        if org_unit.simplified_geom or org_unit.catchment:
            geo_queryset = self.get_queryset().filter(id=org_unit.id)
            if org_unit.simplified_geom:
                res["geo_json"] = geojson_queryset(geo_queryset, geometry_field="simplified_geom")
            if org_unit.catchment:
                res["catchment"] = geojson_queryset(geo_queryset, geometry_field="catchment")
        return Response(res)


def import_data(org_units, user, app_id):
    new_org_units = []
    project = Project.objects.get_for_user_and_app_id(user, app_id)
    if project.account.default_version.data_source.read_only:
        raise Exception("Creation of org unit not authorized on default data source")
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
            org_unit_db.validation_status = OrgUnit.VALIDATION_NEW
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
