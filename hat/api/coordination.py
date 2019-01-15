import json
from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.core.serializers import serialize
from django.db.models import Sum
from hat.planning.models import Planning, Assignation, WorkZone
from hat.geo.models import AS, ZS, Village
from hat.users.models import Coordination
from hat.planning.algo import optimize_path
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from collections import defaultdict
from hat.dashboard.views import get_last_years
from hat.users.models import get_user_geo_list

class CoordinationViewSet(viewsets.ViewSet):
    """
    Api to list all coordinations,  retrieve information about just one, or update the assignations for a coordination.
    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = [
        'menupermissions.x_management_coordinations',
        'menupermissions.x_management_workzones',
        'menupermissions.x_management_teams',
        'menupermissions.x_plannings_macroplanning',
        'menupermissions.x_plannings_microplanning',
        'menupermissions.x_qualitycontrol'
    ]

    def list(self, request):
        order = request.GET.get("order", None)
        queryset = Coordination.objects.all()
        if not request.user.profile.province_scope.count() == 0:
            queryset = queryset.filter(ZS__province_id__in=get_user_geo_list(request.user, 'province_scope')).distinct()
        if not request.user.profile.ZS_scope.count() == 0:
            queryset = queryset.filter(ZS__id__in=get_user_geo_list(request.user, 'ZS_scope')).distinct()

        res = map(lambda x: x.as_dict(), queryset)
        if order is not None:
            reverse = order.startswith('-')

            if reverse:
                order = order[1:]

            res = sorted(res, key=lambda k: k[order], reverse=reverse)

        return Response(res)

    def retrieve(self, request, pk=None):
        as_geo_json = request.GET.get("geojson", None)
        coordination = get_object_or_404(Coordination, pk=pk)
        endemic_population = request.GET.get("endemic_population", None)
        years = request.GET.get("years", get_last_years(5))
        workzone_id = request.GET.get('workzone_id', None)

        isAuthorized = request.user.profile.ZS_scope.count() == 0 and request.user.profile.province_scope.count() == 0
        for zone in coordination.ZS.all():
            if zone.province.id in get_user_geo_list(request.user, 'province_scope'):
                isAuthorized = True
            if zone.id in get_user_geo_list(request.user, 'ZS_scope'):
                isAuthorized = True
        if not isAuthorized:
            return Response('Unauthorized', status=401)
        else:

            if as_geo_json:
                if workzone_id:
                    work_zone = get_object_or_404(WorkZone, id=workzone_id)
                    areas = work_zone.AS.all()
                    all_zs = ZS.objects.filter(id__in=work_zone.AS.values_list('ZS_id', flat=True)).distinct()

                else:
                    all_zs = coordination.ZS.all()
                    areas = AS.objects.filter(ZS__in=all_zs)


                if endemic_population:
                    as_pop_dict = {}
                    years_array = years.split(",")
                    endemic_villages_ids = Village.objects.filter(AS__in=areas).filter(caseview__confirmed_case=True,
                                                                                    caseview__normalized_year__in=years_array).values('id')
                    endemic_as_populations = Village.objects.filter(AS__in=areas).filter(id__in=endemic_villages_ids).values('AS_id').annotate(endemic_population=Sum('population'))

                    for obj in endemic_as_populations:
                        pop = obj["endemic_population"]
                        if pop is None:
                            pop = 0
                        as_pop_dict[obj["AS_id"]] = pop

                serialized_zs = serialize('geojson', all_zs, geometry_field='simplified_geom', fields=('name', 'pk',))
                serialized_as = serialize('geojson', areas, geometry_field='simplified_geom', fields=['name', 'pk', 'ZS'])
                res_dict = {
                    'areas': json.loads(serialized_as),
                    'zones': json.loads(serialized_zs)
                }
                if endemic_population:
                    res_dict["endemic_as_populations"] = as_pop_dict
                return Response(res_dict)
            else:
                return Response(coordination.as_dict())

    def update(self, request, pk=None):
        if pk == "0":
            coordination = Coordination()
        else:
            coordination = get_object_or_404(Coordination, pk=pk)

        assignations = request.data.get('assignations', -1)
        if assignations != -1:
            planning = get_object_or_404(Planning, pk=request.data.get('planning_id', -1))
            Assignation.objects.filter(team__coordination=coordination, planning=planning).delete()

            assignations = request.data['assignations']

            teams_dict = defaultdict(list)
            for a in assignations:
                teams_dict[a['team_id']].append(a)

            if -1 in teams_dict:
                del teams_dict[-1]

            for team_id in teams_dict:
                assignation_list = teams_dict[team_id]
                ordered = optimize_path(assignation_list)
                for index, obj in enumerate(ordered):

                    Assignation.objects.filter(planning=planning, village_id=obj['village_id']).delete()
                    assignation = Assignation()
                    assignation.planning = planning
                    assignation.index = obj['index']
                    assignation.month = obj['month']
                    assignation.village_id = obj['village_id']
                    assignation.team_id = obj['team_id']
                    assignation.save()
        else:
            coordination.name = request.data.get('name', '')
            locations = request.data.get('zs', None)
            if locations:
                if pk == "0":
                    coordination.save()
                coordination.ZS.clear()
                for location in locations:
                    new_location = get_object_or_404(ZS, pk=location['id'])
                    if new_location.province.id in get_user_geo_list(request.user, 'province_scope') or\
                        new_location.id in get_user_geo_list(request.user, 'ZS_scope'):
                        coordination.ZS.add(new_location)
            coordination.save()

        return Response(coordination.as_dict())

    def delete(self, request, pk=None):
        coordination = get_object_or_404(Coordination, pk=pk)
        isAuthorized = request.user.profile.ZS_scope.count() == 0 and request.user.profile.province_scope.count() == 0
        for zone in coordination.ZS.all():
            if zone.province.id in get_user_geo_list(request.user, 'province_scope'):
                isAuthorized = True
            if zone.id in get_user_geo_list(request.user, 'ZS_scope'):
                isAuthorized = True
        if not isAuthorized:
            return Response('Unauthorized', status=401)
        else:
            coordination.delete()
            return Response(True)
