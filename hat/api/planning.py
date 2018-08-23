from rest_framework import viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.exceptions import NotFound
from django.shortcuts import get_object_or_404
from hat.planning.models import Planning, Assignation

from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class PlanningViewSet(viewsets.ViewSet):
    """
    Planning API to allow modifications and retrieval of computed plannings.

    list:
    Returns the list of existing plannings

    retrieve:
    returns a given planning information
    example: /api/plannings/2/

    update:
    To totally update a planning, send a PUT request to its URL (example: /api/plannings/2/)
    with a json body containing a list of objects with village_id and team_id fields.

    Example: PUT on /api/plannings/2/ with JSON body
    [{
            "village_id": 39979,
            "team_id": 2
        },
        {
            "village_id": 39978,
            "team_id": 2
        }]

    partial_update:
    Same as update, but with a PATCH request, and it won't erase all existing assignations, just replace the one who
    conflict with the body of the request. For example, if you associate village 3 with team 3 and it was previously
    associated with team 2, this assignation to team 2 will be deleted.
    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = [
        'menupermissions.x_management_plannings',
        'menupermissions.x_management_workzones',
        'menupermissions.x_plannings_macroplanning',
        'menupermissions.x_plannings_microplanning',
        'menupermissions.x_plannings_routes'
    ]

    def list(self, request):
        orders = request.GET.get('order', '-created_at').split(',')
        return Response(Planning.objects.all().values('name', 'id', 'year', 'updated_at').order_by(*orders))


    def retrieve(self, request, pk=None):
        planning = get_object_or_404(Planning, pk=pk)

        return Response(planning.as_dict())

    def update(self, request, pk=None):
        if pk == "0":
            planning = Planning()
        else:
            planning = get_object_or_404(Planning, pk=pk)
        Assignation.objects.filter(planning=planning).delete()
        village_id = request.data.get('village_id', -1)
        team_id = request.data.get('team_id', -1)
        if village_id != -1 and team_id != -1:
            for obj in request.data:
                assignation = Assignation()
                assignation.planning = planning
                assignation.village_id = obj['village_id']
                assignation.team_id = obj['team_id']
                assignation.save()
        newYear = request.data.get('year', '')
        if newYear != '':
            planning.year = newYear #Bonne année !
            planning.save()
        newName = request.data.get('name', '')
        if newName != '':
            planning.name = newName
            planning.save()

        return Response(planning.as_dict())

    def partial_update(self, request, pk=None):
        planning = get_object_or_404(Planning, pk=pk)

        for obj in request.data:
            Assignation.objects.filter(planning=planning, village_id=obj['village_id']).delete()
            assignation = Assignation.objects.get_or_create(planning=planning,
                                                            village_id=obj['village_id'],
                                                            team_id = obj['team_id'] )
        return Response(planning.as_dict())

    def delete(self, request, pk=None):
        planning = get_object_or_404(Planning, pk=pk)
        planning.delete()
        return Response(True)