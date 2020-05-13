import json
from copy import copy

from django.contrib.gis.geos import Polygon
from django.core.paginator import Paginator
from django.views.decorators.cache import cache_control
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from hat.geo.geojson import geojson_queryset
from hat.geo.models import ZS, AS, Province, Village
from django.db.models import Q
from django.db.models import Count
from hat.users.models import get_user_geo_list, is_authorized_user
from django.db.models.expressions import RawSQL
from django.http import StreamingHttpResponse, HttpResponse
from .export_utils import Echo, generate_xlsx, iter_items
from hat.audit.models import log_modification, ZONE_API
from rest_framework.authentication import BasicAuthentication
from .authentication import CsrfExemptSessionAuthentication


class ZSViewSet(viewsets.ViewSet):
    """
    list:
    Returns a list of ZS, that can be filtered by providing a province_id
        /api/zs/
        /api/zs/?province_id=2

    retrieve:
    It is also possible to get additional information on a given ZS by providing directly its id
        /api/zs/2


    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    def list(self, request):
        province_ids = request.GET.get("province_id", None)
        as_geo_json = request.GET.get("geojson", None)
        years = request.GET.get("years", None)
        with_geo_json = request.GET.get("with_geo_json", None)

        as_list = request.GET.get("as_list", False)
        orders = request.GET.get("order", "name").split(",")
        page_offset = request.GET.get("page", None)
        limit = request.GET.get("limit", None)
        search = request.GET.get("search", None)
        csv_format = request.GET.get("csv", None)
        xlsx_format = request.GET.get("xlsx", None)
        is_erased = request.GET.get("is_erased", False)
        shapes = request.GET.get("shapes", None)

        queryset = ZS.objects.all()

        queryset = queryset.filter(is_erased=is_erased)

        if search:
            aliases_query = RawSQL(
                "select count(*) from unnest("
                "geo_zs"
                ".aliases) it where it ilike %s",
                (f"%{search}%",),
            )
            queryset = queryset.annotate(alias_match=aliases_query)
            queryset = queryset.filter(Q(name__icontains=search) | Q(alias_match__gt=0))

        if request.user.profile.province_scope.count() != 0:
            queryset = queryset.filter(
                province_id__in=get_user_geo_list(request.user, "province_scope")
            )
        if request.user.profile.ZS_scope.count() != 0:
            queryset = queryset.filter(
                id__in=get_user_geo_list(request.user, "ZS_scope")
            )
        if request.user.profile.AS_scope.count() != 0:
            zs_from_as = (
                AS.objects.filter(id__in=get_user_geo_list(request.user, "AS_scope"))
                .values_list("ZS_id", flat=True)
                .distinct()
            )
            queryset = queryset.filter(id__in=zs_from_as)
        if shapes == "with":
            queryset = queryset.filter(simplified_geom__isnull=False)
        if shapes == "without":
            queryset = queryset.filter(simplified_geom__isnull=True)
        if province_ids:
            queryset = queryset.filter(province_id__in=province_ids.split(","))

        values = ["name", "id", "province_id"]
        if with_geo_json:
            queryset = queryset.filter(geom__isnull=False)
        if years:
            years_array = years.split(",")
            nr_positive_cases = Count(
                "as",
                filter=Q(
                    as__village__caseview__confirmed_case=True,
                    as__village__caseview__normalized_year__in=years_array,
                ),
            )
            queryset = queryset.annotate(nr_positive_cases=nr_positive_cases)
            values.append("nr_positive_cases")
        if as_geo_json:
            queryset = queryset.filter(geom__isnull=False)
            geo_json = geojson_queryset(
                queryset, geometry_field="simplified_geom", fields=["name", "province"]
            )
            return Response(geo_json)
        elif as_list:
            if page_offset:
                page_offset = int(page_offset)
                queryset = queryset.order_by(*orders)
                paginator = Paginator(queryset, limit)
                res = {"count": paginator.count}
                if page_offset > paginator.num_pages:
                    page_offset = paginator.num_pages
                page = paginator.page(page_offset)

                res["zones"] = map(lambda x: x.as_full_dict(), page.object_list)
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
            filename = "zones"
            columns = [
                {"title": "Identifiant"},
                {"title": "Nom"},
                {"title": "Province"},
                {"title": "Alias"},
                {"title": "Source"},
            ]

            def get_row(zone, **kwargs):
                aliases = "/"
                if zone.aliases:
                    aliases = ", ".join(zone.aliases)
                return [
                    zone.id,
                    zone.name,
                    zone.province.name,
                    aliases,
                    zone.source,
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
        zs = get_object_or_404(ZS, pk=pk)
        user_zs_ids = get_user_geo_list(request.user, "ZS_scope")
        user_as_zs_ids = (
            AS.objects.filter(id__in=get_user_geo_list(request.user, "AS_scope"))
            .values_list("ZS_id", flat=True)
            .distinct()
        )
        user_province_ids = get_user_geo_list(request.user, "province_scope")
        is_authorized = (
            len(user_as_zs_ids) == 0
            and len(user_zs_ids) == 0
            and len(user_province_ids) == 0
        )
        if not is_authorized:
            if (
                (zs.province.id in user_province_ids)
                and len(user_zs_ids) == 0
                and len(user_as_zs_ids) == 0
            ):
                is_authorized = True
            if zs.id in user_zs_ids:
                is_authorized = True
            if zs.id in user_as_zs_ids:
                is_authorized = True
        res = zs.as_full_dict()
        if zs.simplified_geom:
            queryset = ZS.objects.all().filter(id=zs.id)
            res["geo_json"] = geojson_queryset(
                queryset, geometry_field="simplified_geom"
            )

        villages = Village.objects.filter(
            Q(AS__ZS_id=pk) & Q(village_official="YES")
        )
        res["villages"] = [village.as_dict() for village in villages]
        if is_authorized:
            return Response(res)
        else:
            return Response("Unauthorized", status=401)

    def partial_update(self, request, pk=None):
        zone = get_object_or_404(ZS, id=pk)
        is_authorized = is_authorized_user(
            request.user, zone.province.id, zone.id, None
        ) and (
            request.user.has_perm("menupermissions.x_management_edit_zones")
            or request.user.is_superuser
        )
        if is_authorized:
            original_zone = copy(zone)
            zone.name = request.data.get("name", "")
            zone.source = request.data.get("source", None)
            zone.aliases = request.data.get("aliases", None)
            zone.is_erased = request.data.get("is_erased", False)
            if "geo_json" in request.data:
                geo_json = request.data.get("geo_json", None)
                if (
                    geo_json
                    and geo_json["geometry"]
                    and geo_json["geometry"]["coordinates"]
                ):
                    if len(geo_json["geometry"]["coordinates"]) == 1:
                        zone.simplified_geom = Polygon(
                            geo_json["geometry"]["coordinates"][0]
                        )
                    else:
                        # DB has a single Polygon, refuse if we have more, or less.
                        return Response(
                            "Only one polygon should be saved in the geo_json shape",
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                else:
                    zone.simplified_geom = None
            province_id = request.data.get("province_id")
            province = get_object_or_404(Province, id=province_id)
            zone.province = province
            zone.save()
            log_modification(original_zone, zone, ZONE_API, request.user)
            return Response(zone.as_dict())
        else:
            return Response("Unauthorized", status=401)

    def create(self, request):
        newZone = ZS()
        is_authorized = (
            request.user.has_perm("menupermissions.x_management_edit_zones")
            or request.user.is_superuser
        )
        if is_authorized:
            newZone.name = request.data.get("name", "")
            newZone.source = request.data.get("source", None)
            newZone.aliases = request.data.get("aliases", None)
            newZone.is_erased = request.data.get("is_erased", False)
            geo_json = request.data.get("geo_json", None)
            if (
                geo_json
                and geo_json["geometry"]
                and geo_json["geometry"]["coordinates"]
            ):
                if len(geo_json["geometry"]["coordinates"]) == 1:
                    newZone.simplified_geom = Polygon(
                        geo_json["geometry"]["coordinates"][0]
                    )
                else:
                    # DB has a single Polygon, refuse if we have more, or less.
                    return Response(
                        "Only one polygon should be saved in the geo_json shape",
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                newZone.simplified_geom = None

            province_id = request.data.get("province_id")
            province = get_object_or_404(Province, id=province_id)
            newZone.province = province

            newZone.save()
            log_modification(None, newZone, ZONE_API, request.user)
            return Response(newZone.as_dict())
        else:
            return Response("Unauthorized", status=401)
