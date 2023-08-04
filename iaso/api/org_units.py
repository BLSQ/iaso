import json
from copy import deepcopy
from time import gmtime, strftime

from django.conf import settings
from django.contrib.gis.geos import Point
from django.contrib.gis.geos import Polygon, GEOSGeometry, MultiPolygon
from django.core.paginator import Paginator
from django.db.models import Q, IntegerField, Value, Count
from django.http import StreamingHttpResponse, HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.translation import gettext as _
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from hat.api.export_utils import Echo, generate_xlsx, iter_items, timestamp_to_utc_datetime
from hat.audit import models as audit_models
from iaso.api.common import safe_api_import, CONTENT_TYPE_XLSX, CONTENT_TYPE_CSV
from iaso.api.org_unit_search import build_org_units_queryset, annotate_query
from iaso.api.serializers import OrgUnitSmallSearchSerializer, OrgUnitSearchSerializer, OrgUnitTreeSearchSerializer
from iaso.gpkg import org_units_to_gpkg_bytes
from iaso.models import OrgUnit, OrgUnitType, Group, Project, SourceVersion, Form, Instance, DataSource
from iaso.utils import geojson_queryset
from hat.menupermissions import models as permission


# noinspection PyMethodMayBeStatic
class HasOrgUnitPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not (
            request.user.is_authenticated
            and (
                request.user.has_perm(permission.FORMS)
                or request.user.has_perm(permission.ORG_UNITS)
                or request.user.has_perm(permission.SUBMISSIONS)
                or request.user.has_perm(permission.REGISTRY)
                or request.user.has_perm(permission.POLIO)
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


# noinspection PyMethodMayBeStatic
class OrgUnitViewSet(viewsets.ViewSet):
    f"""Org units API

    This API is open to anonymous users for actions that are not org unit-specific (see create method for nuance in
    projects that require authentication). Actions on specific org units are restricted to authenticated users with the
    "{permission.FORMS}", "{permission.ORG_UNITS}" or "{permission.SUBMISSIONS}" permission.

    GET /api/orgunits/
    GET /api/orgunits/<id>
    POST /api/orgunits/ Create org units, used by mobile app
    POST /api/orgunits/create_org_unit Create org unit, used by web app
    PATCH /api/orgunits/<id>
    """

    # this bypass UserAccessPermission and allow anonymous access
    permission_classes = [HasOrgUnitPermission]

    def get_queryset(self):
        return OrgUnit.objects.filter_for_user_and_app_id(self.request.user, self.request.query_params.get("app_id"))

    def list(self, request):
        """Power the almighty Search function, and export

        which all the power should be really specified.

        Can serve these formats, depending on the combination of GET Parameters:
         * Simple JSON (default) -> as_dict_for_mobile
         * Paginated JSON (if a `limit` is passed) -> OrgUnitSearchSerializer
         * Paginated JSON with less info (if both `limit` and `smallSearch` are passed) -> OrgUnitSmallSearchSerializer
         * GeoJson with the geo info (if `withShapes` is passed` ) -> as_dict
         * Paginated GeoJson (if `asLocation` is passed) Note: Don't respect the page setting -> as_location
         * GeoPackage format (if `gpkg` is passed)
         * Excel XLSX  (if `xslx` is passed)
         * CSV (if `csv` is passed)

         These parameter can totally conflict and the result is undocumented
        """
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

        if as_location:
            queryset = queryset.filter(Q(location__isnull=False) | Q(simplified_geom__isnull=False))

        # Annotate number of instance per org unit to sort by it
        order_by_instance_count = "instances_count" in order or "-instances_count" in order
        count_instances = order_by_instance_count or is_export
        count_per_form = csv_format or xlsx_format
        # add annotation(s) if needed
        queryset = annotate_query(queryset, count_instances, count_per_form, forms)

        if not request.user.is_anonymous:
            profile = request.user.iaso_profile
        else:
            profile = None

        searches = request.GET.get("searches", None)
        counts = []

        if searches:
            search_index = 0
            base_queryset = queryset
            queryset = OrgUnit.objects.none()
            for search in json.loads(searches):
                sub_queryset = build_org_units_queryset(base_queryset, search, profile).annotate(
                    search_index=Value(search_index, IntegerField())
                )
                counts.append({"index": search_index, "count": sub_queryset.count()})
                queryset = queryset.union(sub_queryset)
                search_index += 1
        else:
            queryset = build_org_units_queryset(queryset, request.GET, profile)

        queryset = queryset.order_by(*order)

        if not is_export:
            if limit and not as_location:
                limit = int(limit)
                page_offset = int(page_offset)
                paginator = Paginator(queryset, limit)

                if page_offset > paginator.num_pages:
                    page_offset = paginator.num_pages
                page = paginator.page(page_offset)

                if small_search:
                    serializer = OrgUnitSmallSearchSerializer
                else:
                    serializer = OrgUnitSearchSerializer
                res = {
                    "count": paginator.count,
                    "counts": counts,
                    "orgunits": serializer(page.object_list, many=True).data,
                    "has_next": page.has_next(),
                    "has_previous": page.has_previous(),
                    "page": page_offset,
                    "pages": paginator.num_pages,
                    "limit": limit,
                }

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
                    temp_org_unit = unit.as_location(with_parents=request.GET.get("withParents", None))
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
            user_account_name = profile.account.name if profile else ""
            environment = settings.ENVIRONMENT
            filename = "org_units"
            filename = "%s-%s-%s-%s" % (environment, user_account_name, filename, strftime("%Y-%m-%d-%H-%M", gmtime()))
            return self.list_to_gpkg(queryset, filename)
        else:
            # When filtering the org units by group, the values_list will return the groups also filtered.
            #  In order to get the all groups independently of filters, we should get the groups
            # based on the org_unit FK.

            org_ids = queryset.order_by("pk").values_list("pk", flat=True)
            groups = Group.objects.filter(org_units__id__in=set(org_ids)).only("id", "name").distinct("id")

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

            user_account_name = profile.account.name if profile else ""
            environment = settings.ENVIRONMENT
            filename = "org_units"
            filename = "%s-%s-%s-%s" % (environment, user_account_name, filename, strftime("%Y-%m-%d-%H-%M", gmtime()))

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

            if xlsx_format:
                filename = filename + ".xlsx"
                response = HttpResponse(
                    generate_xlsx("Forms", columns, queryset, get_row),
                    content_type=CONTENT_TYPE_XLSX,
                )
            if csv_format:
                response = StreamingHttpResponse(
                    streaming_content=(iter_items(queryset, Echo(), columns, get_row)), content_type=CONTENT_TYPE_CSV
                )
                filename = filename + ".csv"
            response["Content-Disposition"] = "attachment; filename=%s" % filename
            return response

    def list_to_gpkg(self, queryset, filename):
        response = HttpResponse(org_units_to_gpkg_bytes(queryset), content_type="application/octet-stream")
        filename = f"{filename}.gpkg"
        response["Content-Disposition"] = f"attachment; filename={filename}"

        return response

    @action(methods=["GET"], detail=False)
    def treesearch(self, request, **kwargs):
        queryset = self.get_queryset().order_by("name")
        params = request.GET
        parent_id = params.get("parent_id")
        validation_status = params.get("validation_status")
        roots_for_user = params.get("rootsForUser", None)
        source = params.get("source", None)
        version = params.get("version", None)
        ignore_empty_names = params.get("ignoreEmptyNames", False)
        default_version = params.get("defaultVersion", None)
        if not request.user.is_anonymous:
            profile = request.user.iaso_profile
        else:
            profile = None

        if source:
            source = DataSource.objects.get(id=source)
            if source.default_version:
                queryset = queryset.filter(version=source.default_version)
            else:
                queryset = queryset.filter(version__data_source_id=source)

        if version:
            queryset = queryset.filter(version=version)

        if default_version == "true" and profile is not None:
            queryset = queryset.filter(version=profile.account.default_version)

        if roots_for_user:
            org_unit_for_profile = request.user.iaso_profile.org_units.only("id")
            if org_unit_for_profile:
                queryset = queryset.filter(id__in=org_unit_for_profile)
            else:
                queryset = queryset.filter(parent__isnull=True)

        if parent_id:
            get_object_or_404(self.get_queryset().only("id"), id=parent_id)
            queryset = queryset.filter(parent=parent_id)

        if validation_status != "all":
            queryset = queryset.filter(validation_status=validation_status)
        if ignore_empty_names:
            queryset = queryset.filter(~Q(name=""))

        queryset = queryset.only("id", "name", "validation_status", "version", "org_unit_type", "parent")
        queryset = queryset.annotate(children_count=Count("orgunit__id"))
        org_units = OrgUnitTreeSearchSerializer(queryset, many=True).data
        response = Response({"orgunits": org_units})
        return response

    def partial_update(self, request, pk=None):
        errors = []
        org_unit = get_object_or_404(self.get_queryset(), id=pk)

        self.check_object_permissions(request, org_unit)

        original_copy = deepcopy(org_unit)

        if "name" in request.data:
            org_unit.name = request.data["name"]
        if "source_ref" in request.data:
            org_unit.source_ref = request.data["source_ref"]

        if "short_name" in request.data:
            org_unit.short_name = request.data["short_name"]
        if "source" in request.data:
            org_unit.source = request.data["source"]
        if "validation_status" in request.data:
            validation_status = request.data["validation_status"]
            # TODO: this should come from , OrgUnit.VALIDATION_STATUS_CHOICES
            valid_validations_status = ["NEW", "VALID", "REJECTED", "CLOSED"]

            org_unit.validation_status = validation_status

            if validation_status not in valid_validations_status:
                errors.append(
                    {
                        "errorKey": "validation_status",
                        "errorMessage": _(f"Invalid validation status : {validation_status}"),
                    }
                )

        if "geo_json" in request.data:
            geo_json = request.data["geo_json"]
            if geo_json and geo_json["features"][0]["geometry"] and geo_json["features"][0]["geometry"]["coordinates"]:
                org_unit.simplified_geom = MultiPolygon(
                    *[Polygon(*coord) for coord in geo_json["features"][0]["geometry"]["coordinates"]]
                )
            else:
                org_unit.simplified_geom = None
        elif "simplified_geom" in request.data:
            org_unit.simplified_geom = request.data["simplified_geom"]
        if "geo_json" in request.data or "simplified_geom" in request.data:
            org_unit.geom = org_unit.simplified_geom

        if "catchment" in request.data:
            catchment = request.data["catchment"]
            if (
                catchment
                and catchment["features"][0]["geometry"]
                and catchment["features"][0]["geometry"]["coordinates"]
            ):
                org_unit.catchment = MultiPolygon(
                    *[Polygon(*coord) for coord in catchment["features"][0]["geometry"]["coordinates"]]
                )
            else:
                org_unit.catchment = None

        if "latitude" in request.data and "longitude" in request.data:
            latitude = request.data["latitude"]
            longitude = request.data["longitude"]
            altitude = request.data["altitude"]
            if latitude and longitude:
                org_unit.location = Point(x=longitude, y=latitude, z=altitude, srid=4326)
            else:
                org_unit.location = None

        # doing reassignment below to avoid a test fail. Assigning a default value doesn't prevent the test to fail
        if "aliases" in request.data:
            aliases = request.data.get("aliases")
            if aliases is None:
                aliases = []
            org_unit.aliases = list(filter(lambda x: x != "", aliases))

        if "org_unit_type_id" in request.data:
            org_unit_type_id = request.data["org_unit_type_id"]
            org_unit_type = get_object_or_404(OrgUnitType, id=org_unit_type_id)
            org_unit.org_unit_type = org_unit_type

        if "reference_instance_id" in request.data:
            reference_instance_id = request.data["reference_instance_id"]
            if reference_instance_id:
                instance = Instance.objects.get(pk=reference_instance_id)
                # Check if the instance has as form the reference_form for the orgUnittype
                # if the reference_form is the same as the form related to the instance one,
                # assign the instance to the orgUnit as reference instance
                if org_unit.org_unit_type.reference_form != instance.form:
                    errors.append(
                        {
                            "errorKey": "reference_form",
                            "errorMessage": _("Form of subimssion is not allowed on this type of org unit"),
                        }
                    )
                else:
                    org_unit.reference_instance = instance
            else:
                instance = None
                org_unit.reference_instance = instance

        if "parent_id" in request.data:
            parent_id = request.data["parent_id"]
            if parent_id != org_unit.parent_id:
                # This check is a fix for when a user is restricted to certain org units hierarchy.
                # When a user want to modify his "root" orgunit, the parent_id is included by the frontend even if
                # not modified (the field is not present but the front send all fields)
                #  Since the can't access the parent it 404ed
                if parent_id:
                    parent_org_unit = get_object_or_404(self.get_queryset(), id=parent_id)
                    org_unit.parent = parent_org_unit
                else:
                    # User that are restricted to parts of the hierarchy cannot create root orgunit
                    profile = request.user.iaso_profile
                    if profile.org_units.all():
                        errors.append(
                            {
                                "errorKey": "parent_id",
                                "errorMessage": _("You cannot create an Org Unit without a parent"),
                            }
                        )
                    org_unit.parent = None

        new_groups = None
        if "groups" in request.data:
            new_groups = []
            groups = request.data["groups"]
            current_groups_ids = list(org_unit.groups.all().values_list("id", flat=True))
            for group_id in groups:
                temp_group = get_object_or_404(Group, id=group_id)
                #  fix bug where if an org unit was already in a group it failed
                if group_id not in current_groups_ids and (
                    temp_group.source_version and temp_group.source_version != org_unit.version
                ):
                    errors.append({"errorKey": "groups", "errorMessage": _("Group must be in the same source version")})
                    continue
                new_groups.append(temp_group)

        if not errors:
            org_unit.save()
            if new_groups is not None:
                org_unit.groups.set(new_groups)

            audit_models.log_modification(original_copy, org_unit, source=audit_models.ORG_UNIT_API, user=request.user)

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
        """This endpoint is used by the React frontend"""
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

        reference_instance_id = request.data.get("reference_instance_id", None)

        parent_id = request.data.get("parent_id", None)
        groups = request.data.get("groups", [])

        org_unit.aliases = list(filter(lambda x: x != "", request.data.get("aliases", [])))

        geom = request.data.get("geom")
        if geom:
            try:
                g = GEOSGeometry(json.dumps(geom))
                org_unit.geom = g
                org_unit.simplified_geom = g  # maybe think of a standard simplification here?
            except Exception:
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
        else:
            # User that are restricted to parts of the hierarchy cannot create root orgunit
            if profile.org_units.all():
                errors.append(
                    {"errorKey": "parent_id", "errorMessage": _("You cannot create an Org Unit without a parent")}
                )

        new_groups = []
        for group in groups:
            temp_group = get_object_or_404(Group, id=group)

            if temp_group.source_version != org_unit.version:
                errors.append({"errorKey": "groups", "errorMessage": _("Group must be in the same source version")})
                continue
            new_groups.append(temp_group)

        if errors:
            return Response(errors, status=400)

        org_unit_type = get_object_or_404(OrgUnitType, id=org_unit_type_id)
        org_unit.org_unit_type = org_unit_type

        if reference_instance_id and org_unit_type:
            instance = Instance.objects.get(pk=reference_instance_id)
            # Check if the instance has as form the reference_form for the orgUnittype
            # if the reference_form is the same as the form related to the instance one,
            # assign the instance to the orgUnit as a reference instance
            if org_unit_type.reference_form == instance.form:
                org_unit.reference_instance = instance

        org_unit.save()
        org_unit.groups.set(new_groups)

        audit_models.log_modification(None, org_unit, source=audit_models.ORG_UNIT_API, user=request.user)

        res = org_unit.as_dict_with_parents()
        return Response(res)

    @safe_api_import("orgUnit")
    def create(self, _, request):
        """This endpoint is used by mobile app"""
        new_org_units = import_data(request.data, request.user, request.query_params.get("app_id"))
        return Response([org_unit.as_dict() for org_unit in new_org_units])

    def retrieve(self, request, pk=None):
        org_unit: OrgUnit = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, org_unit)
        res = org_unit.as_dict_with_parents(light=False, light_parents=False)
        res["geo_json"] = None
        res["catchment"] = None
        # Had first geojson of parent, so we can add it to map. Caution: we stop after the first
        ancestor = org_unit.parent
        ancestor_dict = res["parent"]
        while ancestor:
            if ancestor.simplified_geom:
                geo_queryset = self.get_queryset().filter(id=ancestor.id)
                ancestor_dict["geo_json"] = geojson_queryset(geo_queryset, geometry_field="simplified_geom")
                break
            ancestor = ancestor.parent
            ancestor_dict = ancestor_dict["parent"]
        if org_unit.simplified_geom or org_unit.catchment:
            geo_queryset = self.get_queryset().filter(id=org_unit.id)
            if org_unit.simplified_geom:
                res["geo_json"] = geojson_queryset(geo_queryset, geometry_field="simplified_geom")
            if org_unit.catchment:
                res["catchment"] = geojson_queryset(geo_queryset, geometry_field="catchment")
        # add the reference instance in the dictiannary to return
        res["reference_instance"] = org_unit.reference_instance.as_full_model() if org_unit.reference_instance else None

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
                # there exist versions of the mobile app in the wild with both parentId and parent_id
                parent_id = org_unit.get("parent_id", None)
            if parent_id is not None:
                if str.isdigit(parent_id):
                    org_unit_db.parent_id = parent_id
                else:
                    parent_org_unit = OrgUnit.objects.get(uuid=parent_id)
                    org_unit_db.parent_id = parent_org_unit.id

            # there exist versions of the mobile app in the wild with both orgUnitTypeId and org_unit_type_id
            org_unit_type_id = org_unit.get("orgUnitTypeId", None)
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
