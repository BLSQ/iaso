from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_control
from django.db.models import Q
from django.db.models import Count
from rest_framework import viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from hat.geo.geojson import geojson_queryset
from hat.geo.models import AS
from hat.planning.models import Planning
from hat.planning.models import TeamActionZone
from hat.users.models import Team
from hat.users.models import get_user_geo_list
from .authentication import CsrfExemptSessionAuthentication


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
        'menupermissions.x_management_users',
        'menupermissions.x_plannings_microplanning',
        'menupermissions.x_locator'
    ]

    @cache_control(max_age=24*60*60, public=True)
    def list(self, request):
        zs_ids = request.GET.get("zs_id", None)
        as_geo_json = request.GET.get("geojson", None)
        years = request.GET.get("years", None)

        queryset = AS.objects.all()
        if request.user.profile.province_scope.count() != 0:
            queryset = queryset.filter(ZS__province_id__in=get_user_geo_list(request.user, 'province_scope')).distinct()
        if request.user.profile.ZS_scope.count() != 0:
            queryset = queryset.filter(ZS_id__in=get_user_geo_list(request.user, 'ZS_scope')).distinct()
        if request.user.profile.AS_scope.count() != 0:
            queryset = queryset.filter(id__in=get_user_geo_list(request.user, 'AS_scope')).distinct()
        if zs_ids:
            queryset = queryset.filter(ZS_id__in=zs_ids.split(','))

        values = ['name', 'id', 'ZS_id']
        if years:
            years_array = years.split(",")
            nr_positive_cases = Count(
                "village", filter=Q(village__caseview__confirmed_case=True, village__caseview__normalized_year__in=years_array)
            )
            queryset = queryset.annotate(nr_positive_cases=nr_positive_cases)
            values.append('nr_positive_cases')

        if as_geo_json:
            queryset = queryset.filter(simplified_geom__isnull=False)
            geo_json = geojson_queryset(queryset, geometry_field='simplified_geom', fields=['name', 'ZS'])

            return Response(geo_json)
        else:
            return Response(queryset.values(*values).order_by('name'))

    def retrieve(self, request, pk=None):
        aire = get_object_or_404(AS, pk=pk)
        user_as_ids = get_user_geo_list(request.user, 'AS_scope')
        user_zs_ids = get_user_geo_list(request.user, 'ZS_scope')
        province_ids = get_user_geo_list(request.user, 'province_scope')
        is_authorized = len(user_as_ids) == 0 and \
            len(user_zs_ids) == 0 and \
            len(province_ids) == 0
        if not is_authorized:
            if (aire.ZS.province.id in province_ids) and len(user_zs_ids) == 0 and len(user_as_ids) == 0:
                is_authorized = True
            if (aire.ZS.id in user_zs_ids) and len(user_as_ids) == 0:
                is_authorized = True
            if aire.id in user_as_ids:
                is_authorized = True

        if is_authorized:
            return Response(aire.as_dict())
        else:
            return Response('Unauthorized', status=401)

    def update(self, request, pk=None):
        planning_id = request.data.get("planning_id", None)
        team_id = request.data.get("team_id", None)
        delete = request.data.get("delete", None)

        team = get_object_or_404(Team, id=team_id)
        planning = get_object_or_404(Planning, id=planning_id)
        user_as_ids = get_user_geo_list(request.user, 'AS_scope')
        user_zs_ids = get_user_geo_list(request.user, 'ZS_scope')
        province_ids = get_user_geo_list(request.user, 'province_scope')
        is_authorized = len(user_as_ids) == 0 and \
            len(user_zs_ids) == 0 and \
            len(province_ids) == 0

        for as_id in pk.split(','):
            area = get_object_or_404(AS, id=as_id)

            if not is_authorized:
                if (area.ZS.province.id in province_ids) and len(user_zs_ids) == 0 and len(user_as_ids) == 0:
                    is_authorized = True
                if (area.ZS.id in user_zs_ids) and len(user_as_ids) == 0:
                    is_authorized = True
                if area.id in user_as_ids:
                    is_authorized = True

            if is_authorized:
                if delete:
                    TeamActionZone.objects.filter(area=area, planning=planning, team=team).delete()
                else:
                    TeamActionZone.objects.filter(area=area, planning=planning).delete()
                    taz = TeamActionZone()
                    taz.team = team
                    taz.area = area
                    taz.planning = planning
                    taz.save()

        return Response(area.as_dict())





