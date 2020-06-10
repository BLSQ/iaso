from copy import copy

from django.contrib.gis.geos import Polygon
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_control
from django.db.models import Q
from django.db.models import Count
from rest_framework import viewsets, status
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response
from django.contrib.gis.measure import D

from django.core.paginator import Paginator
from hat.geo.geojson import geojson_queryset
from hat.geo.models import AS, ZS
from hat.planning.models import Planning
from hat.planning.models import TeamActionZone
from hat.users.models import Team
from hat.users.models import get_user_geo_list, is_authorized_user
from .authentication import CsrfExemptSessionAuthentication
from django.db.models.expressions import RawSQL
from django.http import StreamingHttpResponse, HttpResponse
from .export_utils import Echo, generate_xlsx, iter_items
from hat.audit.models import log_modification, AREA_API


class ASViewSet(viewsets.ViewSet):
    """
    list:
    Returns a list of AS, that can be filtered by providing a zs_id
        /api/as/
        /api/as/?zs_id=2

    retrieve:
    It is also possible to get additional information on a given AS by providing directly its id
        /api/as/2
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = [
        "menupermissions.x_management_users",
        "menupermissions.x_plannings_microplanning",
        "menupermissions.x_locator",
    ]

    # @cache_control(max_age=24*60*60, public=True)
    def list(self, request):
        zs_ids = request.GET.get("zs_id", None)
        as_geo_json = request.GET.get("geojson", None)
        years = request.GET.get("years", None)

        as_list = request.GET.get("as_list", False)
        orders = request.GET.get("order", "name").split(",")
        page_offset = int(request.GET.get("page", 0))
        limit = request.GET.get("limit", None)
        search = request.GET.get("search", None)
        province_ids = request.GET.get("province_id", None)
        zone_ids = request.GET.get("zone_id", None)
        csv_format = request.GET.get("csv", None)
        xlsx_format = request.GET.get("xlsx", None)
        is_erased = request.GET.get("is_erased", False)
        shapes = request.GET.get("shapes", None)

        queryset = AS.objects.all()

        queryset = queryset.filter(is_erased=is_erased)
        if search:
            aliases_query = RawSQL(
                "select count(*) from unnest("
                "geo_as"
                ".aliases) it where it ilike %s",
                (f"%{search}%",),
            )
            queryset = queryset.annotate(alias_match=aliases_query)
            queryset = queryset.filter(Q(name__icontains=search) | Q(alias_match__gt=0))

        if shapes == "with":
            queryset = queryset.filter(simplified_geom__isnull=False)
        if shapes == "without":
            queryset = queryset.filter(simplified_geom__isnull=True)
        if province_ids:
            queryset = queryset.filter(ZS__province_id__in=province_ids.split(","))
        if zone_ids:
            queryset = queryset.filter(ZS_id__in=zone_ids.split(","))

        if request.user.profile.province_scope.count() != 0:
            queryset = queryset.filter(
                ZS__province_id__in=get_user_geo_list(request.user, "province_scope")
            ).distinct()
        if request.user.profile.ZS_scope.count() != 0:
            queryset = queryset.filter(
                ZS_id__in=get_user_geo_list(request.user, "ZS_scope")
            ).distinct()
        if request.user.profile.AS_scope.count() != 0:
            queryset = queryset.filter(
                id__in=get_user_geo_list(request.user, "AS_scope")
            ).distinct()
        if zs_ids:
            queryset = queryset.filter(ZS_id__in=zs_ids.split(","))

        values = ["name", "id", "ZS_id"]
        if years:
            years_array = years.split(",")
            nr_positive_cases = Count(
                "village",
                filter=Q(
                    village__caseview__confirmed_case=True,
                    village__caseview__normalized_year__in=years_array,
                ),
            )
            queryset = queryset.annotate(nr_positive_cases=nr_positive_cases)
            values.append("nr_positive_cases")

        if as_geo_json:
            queryset = queryset.filter(simplified_geom__isnull=False)
            geo_json = geojson_queryset(
                queryset, geometry_field="geo_as.simplified_geom", fields=["name", "ZS"]
            )
            return Response(geo_json)
        elif as_list:
            queryset = queryset.order_by(*orders)
            paginator = Paginator(queryset, limit)
            res = {"count": paginator.count}
            if page_offset > paginator.num_pages:
                page_offset = paginator.num_pages
            page = paginator.page(page_offset)
            res["areas"] = map(lambda x: x.as_full_dict(), page.object_list)
            res["has_next"] = page.has_next()
            res["has_previous"] = page.has_previous()
            res["page"] = page_offset
            res["pages"] = paginator.num_pages
            res["limit"] = limit
            return Response(res)
        elif csv_format or xlsx_format:
            if (
                request.user.has_perm("menupermissions.x_anonymous")
                or not request.user.has_perm("menupermissions.x_datas_download")
            ) and not request.user.is_superuser:
                return Response("Unauthorized", status=401)
            filename = "aires"
            columns = [
                {"title": "Identifiant"},
                {"title": "Nom"},
                {"title": "Province"},
                {"title": "Zone"},
                {"title": "Alias"},
                {"title": "Source"},
            ]

            def get_row(area, **kwargs):
                aliases = "/"
                if area.aliases:
                    aliases = ", ".join(area.aliases)
                return [
                    area.id,
                    area.name,
                    area.ZS.province.name,
                    area.ZS.name,
                    aliases,
                    area.source,
                ]

            if xlsx_format:
                filename = filename + ".xlsx"
                response = HttpResponse(
                    generate_xlsx("Villages", columns, queryset, get_row),
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            if csv_format:
                filename = filename + ".csv"
                response = StreamingHttpResponse(
                    streaming_content=(iter_items(queryset, Echo(), columns, get_row)),
                    content_type="text/csv",
                )

            response["Content-Disposition"] = "attachment; filename=%s" % filename
            response["Cache-Control"] = "no-cache, no-store, must-revalidate"
            return response
        else:
            return Response(queryset.values(*values).order_by("name"))

    def retrieve(self, request, pk=None):
        area = get_object_or_404(AS, pk=pk)
        user_as_ids = get_user_geo_list(request.user, "AS_scope")
        user_zs_ids = get_user_geo_list(request.user, "ZS_scope")
        province_ids = get_user_geo_list(request.user, "province_scope")
        is_authorized = (
            len(user_as_ids) == 0 and len(user_zs_ids) == 0 and len(province_ids) == 0
        )
        if not is_authorized:
            if (
                (area.ZS.province.id in province_ids)
                and len(user_zs_ids) == 0
                and len(user_as_ids) == 0
            ):
                is_authorized = True
            if (area.ZS.id in user_zs_ids) and len(user_as_ids) == 0:
                is_authorized = True
            if area.id in user_as_ids:
                is_authorized = True
        res = area.as_full_dict_with_villages()
        if area.simplified_geom:
            queryset = AS.objects.all().filter(id=area.id)
            res["geo_json"] = geojson_queryset(
                queryset, geometry_field="simplified_geom"
            )
            # neighbour_areas = AS.objects.filter(simplified_geom__touches=area.simplified_geom)
            neighbour_areas = AS.objects.filter(
                simplified_geom__distance_lt=(area.simplified_geom, D(m=5))).exclude(pk=area.pk)

            res["neighbours"] = map(
                lambda x: x.as_full_dict_with_villages(), neighbour_areas)

        if is_authorized:
            return Response(res)
        else:
            return Response("Unauthorized", status=401)

    def update(self, request, pk=None):
        planning_id = request.data.get("planning_id", None)
        team_id = request.data.get("team_id", None)
        delete = request.data.get("delete", None)

        team = get_object_or_404(Team, id=team_id)
        planning = get_object_or_404(Planning, id=planning_id)
        user_as_ids = get_user_geo_list(request.user, "AS_scope")
        user_zs_ids = get_user_geo_list(request.user, "ZS_scope")
        province_ids = get_user_geo_list(request.user, "province_scope")
        is_authorized = (
            len(user_as_ids) == 0 and len(user_zs_ids) == 0 and len(province_ids) == 0
        )

        for as_id in pk.split(","):
            area = get_object_or_404(AS, id=as_id)

            if not is_authorized:
                if (
                    (area.ZS.province.id in province_ids)
                    and len(user_zs_ids) == 0
                    and len(user_as_ids) == 0
                ):
                    is_authorized = True
                if (area.ZS.id in user_zs_ids) and len(user_as_ids) == 0:
                    is_authorized = True
                if area.id in user_as_ids:
                    is_authorized = True

            if is_authorized:
                if delete:
                    TeamActionZone.objects.filter(
                        area=area, planning=planning, team=team
                    ).delete()
                else:
                    TeamActionZone.objects.filter(
                        area=area, planning=planning, team=team
                    ).delete()
                    taz = TeamActionZone()
                    taz.team = team
                    taz.area = area
                    taz.planning = planning
                    taz.save()

        return Response(area.as_dict())

    def partial_update(self, request, pk=None):
        area = get_object_or_404(AS, id=pk)
        is_authorized = is_authorized_user(
            request.user, area.ZS.province.id, area.ZS.id, area.id
        ) and (
            request.user.has_perm("menupermissions.x_management_edit_areas")
            or request.user.is_superuser
        )
        if is_authorized:
            original_area = copy(area)
            area.name = request.data.get("name", "")
            area.source = request.data.get("source", None)
            area.aliases = request.data.get("aliases", None)
            area.is_erased = request.data.get("is_erased", False)
            if "geo_json" in request.data:
                geo_json = request.data.get("geo_json", None)
                if (
                    geo_json
                    and geo_json["geometry"]
                    and geo_json["geometry"]["coordinates"]
                ):
                    if len(geo_json["geometry"]["coordinates"]) == 1:
                        area.simplified_geom = Polygon(
                            geo_json["geometry"]["coordinates"][0]
                        )
                    else:
                        # DB has a single Polygon, refuse if we have more, or less.
                        return Response(
                            "Only one polygon should be saved in the geo_json shape",
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                else:
                    area.simplified_geom = None
            zone_id = request.data.get("ZS_id")
            zone = get_object_or_404(ZS, id=zone_id)
            area.ZS = zone
            area.save()
            log_modification(original_area, area, AREA_API, request.user)
            return Response(area.as_dict())
        else:
            return Response("Unauthorized", status=401)

    def create(self, request):
        area = AS()
        is_authorized = (
            request.user.has_perm("menupermissions.x_management_edit_areas")
            or request.user.is_superuser
        )
        if is_authorized:
            area.name = request.data.get("name", "")
            area.source = request.data.get("source", None)
            area.aliases = request.data.get("aliases", None)
            area.is_erased = request.data.get("is_erased", False)
            geo_json = request.data.get("geo_json", None)
            if (
                geo_json
                and geo_json["geometry"]
                and geo_json["geometry"]["coordinates"]
            ):
                if len(geo_json["geometry"]["coordinates"]) == 1:
                    area.simplified_geom = Polygon(
                        geo_json["geometry"]["coordinates"][0]
                    )
                else:
                    # DB has a single Polygon, refuse if we have more, or less.
                    return Response(
                        "Only one polygon should be saved in the geo_json shape",
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                area.simplified_geom = None
            zone_id = request.data.get("ZS_id")
            zone = get_object_or_404(ZS, id=zone_id)
            area.ZS = zone

            area.save()
            log_modification(None, area, AREA_API, request.user)
            return Response(area.as_dict())
        else:
            return Response("Unauthorized", status=401)
