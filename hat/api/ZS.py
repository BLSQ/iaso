import json

from django.core.paginator import Paginator
from django.views.decorators.cache import cache_control
from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from hat.geo.geojson import geojson_queryset
from hat.geo.models import ZS, AS
from django.db.models import Q
from django.db.models import Count
from hat.users.models import get_user_geo_list
from django.db.models.expressions import RawSQL
from django.http import StreamingHttpResponse, HttpResponse
from .export_utils import Echo, generate_xlsx, iter_items


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

    @cache_control(max_age=24 * 60 * 60, public=True)
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

        queryset = ZS.objects.all()

        if search:
            aliases_query = RawSQL("select count(*) from unnest(""geo_zs"".aliases) it where it ilike %s",
                                   (f"%{search}%",))
            queryset = queryset.annotate(alias_match=aliases_query)
            queryset = queryset.filter(Q(name__icontains=search) | Q(alias_match__gt=0))

        if request.user.profile.province_scope.count() != 0:
            queryset = queryset.filter(province_id__in=get_user_geo_list(request.user, 'province_scope'))
        if request.user.profile.ZS_scope.count() != 0:
            queryset = queryset.filter(id__in=get_user_geo_list(request.user, 'ZS_scope'))
        if request.user.profile.AS_scope.count() != 0:
            zs_from_as = AS.objects.filter(id__in=get_user_geo_list(request.user, 'AS_scope'))\
                .values_list("ZS_id", flat=True).distinct()
            queryset = queryset.filter(id__in=zs_from_as)
        if province_ids:
            queryset = queryset.filter(province_id__in=province_ids.split(','))

        values = ['name', 'id', 'province_id']
        if with_geo_json:
            queryset = queryset.filter(geom__isnull=False)
        if years:
            years_array = years.split(",")
            nr_positive_cases = Count(
                "as", filter=Q(as__village__caseview__confirmed_case=True, as__village__caseview__normalized_year__in=years_array)
            )
            queryset = queryset.annotate(nr_positive_cases=nr_positive_cases)
            values.append('nr_positive_cases')
        if as_geo_json:
            queryset = queryset.filter(geom__isnull=False)
            geo_json = geojson_queryset(queryset, geometry_field='simplified_geom', fields=['name', 'province'])
            return Response(geo_json)
        elif as_list:
            if page_offset:
                page_offset = int(page_offset)
                queryset = queryset.order_by(*orders)
                values = (
                    'name',
                    'id',
                    'province_id',
                    'province__name',
                    "aliases",
                    "source",
                )
                paginator = Paginator(queryset.values(*values), limit)
                res = {"count": paginator.count}
                if page_offset > paginator.num_pages:
                    page_offset = paginator.num_pages
                page = paginator.page(page_offset)
                res["zones"] = page.object_list
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
                        aliases = ', '.join(zone.aliases)
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
                        streaming_content=(
                            iter_items(queryset, Echo(), columns, get_row)
                        ),
                        content_type="text/csv",
                    )

                response["Content-Disposition"] = "attachment; filename=%s" % filename
                response["Cache-Control"] = "no-cache, no-store, must-revalidate"
                return response
        else:
            return Response(queryset.values(*values).order_by('name'))

    def retrieve(self, request, pk=None):
        zs = get_object_or_404(ZS, pk=pk)
        user_zs_ids = get_user_geo_list(request.user, 'ZS_scope')
        user_as_zs_ids = AS.objects.filter(id__in=get_user_geo_list(request.user, 'AS_scope'))\
            .values_list("ZS_id", flat=True).distinct()
        user_province_ids = get_user_geo_list(request.user, 'province_scope')
        is_authorized = len(user_as_zs_ids) == 0 and len(user_zs_ids) == 0 and \
            len(user_province_ids) == 0
        if not is_authorized:
            if (zs.province.id in user_province_ids) and len(user_zs_ids) == 0 and len(user_as_zs_ids) == 0:
                is_authorized = True
            if zs.id in user_zs_ids:
                is_authorized = True
            if zs.id in user_as_zs_ids:
                is_authorized = True
        res = zs.as_dict()
        if zs.simplified_geom:
            queryset = ZS.objects.all().filter(id=zs.id)
            res["geo_json"] = geojson_queryset(queryset, geometry_field='simplified_geom')
        if is_authorized:
            return Response(res)
        else:
            return Response('Unauthorized', status=401)
