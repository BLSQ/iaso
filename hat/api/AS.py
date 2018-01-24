from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from hat.geo.models import AS
from hat.users.models import Team

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
    def list(self, request):
        zs_ids = request.GET.get("zs_id", None)
        queryset = AS.objects.all()
        if zs_ids:
            queryset=queryset.filter(ZS_id__in=zs_ids.split(','))
        return Response(queryset.values('name', 'id'))

    def retrieve(self, request, pk=None):
        aire = get_object_or_404(AS, pk=pk)
        return Response(aire.as_dict())

    def update(self, request, pk=None):
        team_id = request.data.get("team_id", None)
        delete = request.data.get("delete", None)
        team = get_object_or_404(Team, id=team_id)
        aire = get_object_or_404(AS, id=pk)
        if delete:
            team.AS.remove(aire)
        else:
            team.AS.add(aire)
        return Response(aire.as_dict())





