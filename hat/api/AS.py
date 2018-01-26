from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from hat.geo.models import AS
from hat.users.models import Team, Coordination
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication

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
    
    def list(self, request):
        zs_ids = request.GET.get("zs_id", None)
        coordination_id = request.GET.get("coordination_id", None)

        queryset = AS.objects.all()
        if zs_ids:
            queryset=queryset.filter(ZS_id__in=zs_ids.split(','))

        # if coordination_id:
        #     coordination = get_object_or_404(Coordination, id=coordination_id)
        #     queryset = queryset.filter(ZS_id__in=coordination.ZS.all())

        return Response(queryset.values('name', 'id'))

    def retrieve(self, request, pk=None):
        aire = get_object_or_404(AS, pk=pk)
        return Response(aire.as_dict())

    def update(self, request, pk=None):
        team_id = request.data.get("team_id", None)
        delete = request.data.get("delete", None)

        team = get_object_or_404(Team, id=team_id)
        area = get_object_or_404(AS, id=pk)

        if team.AS.all():
            if delete:
                team.AS.remove(area)
            else:
                team.AS.add(area)
        else:
            areas = team.get_as()
            team.AS.clear()
            if delete:
                areas = filter(lambda ar: ar.id != area.id, areas)
                for a in areas:
                    team.AS.add(a)
            else:
                for a in areas:
                    team.AS.add(a)
                team.AS.add(area)

        return Response(area.as_dict())





