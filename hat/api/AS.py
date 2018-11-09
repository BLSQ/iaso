import json

from django.views.decorators.cache import cache_control
from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from hat.geo.models import AS
from hat.users.models import Team
from hat.planning.models import Planning
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from django.core.serializers import serialize
from hat.planning.models import TeamActionZone


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

        queryset = AS.objects.all()
        if zs_ids:
            queryset = queryset.filter(ZS_id__in=zs_ids.split(','))

        if as_geo_json:
            queryset = queryset.filter(geom__isnull=False)
            serialized_as = serialize('geojson', queryset, geometry_field='simplified_geom',
                                      fields=('name', 'pk', 'ZS',))
            return Response(json.loads(serialized_as))
        else:
            return Response(queryset.values('name', 'id', 'ZS_id').order_by('name'))

    def retrieve(self, request, pk=None):
        aire = get_object_or_404(AS, pk=pk)
        return Response(aire.as_dict())

    def update(self, request, pk=None):
        planning_id = request.data.get("planning_id", None)
        team_id = request.data.get("team_id", None)
        delete = request.data.get("delete", None)

        team = get_object_or_404(Team, id=team_id)
        planning = get_object_or_404(Planning, id=planning_id)

        for as_id in pk.split(','):
            area = get_object_or_404(AS, id=as_id)
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





