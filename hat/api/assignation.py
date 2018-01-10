from rest_framework import viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.exceptions import NotFound
from django.shortcuts import get_object_or_404
from hat.planning.models import Planning, Assignation
from hat.users.models import Team, Coordination
from hat.geo.models import Village
from rest_framework import generics
from rest_framework import serializers


class AssignationSerializer(serializers.ModelSerializer):
    AS_name = serializers.CharField(source='village.AS.name')
    village_name = serializers.CharField(source='village.name')
    village_id = serializers.CharField(source='village.id')

    class Meta:
        model = Assignation
        fields = ('team_id', 'AS_name', 'village_name', 'village_id')


class AssignationList(generics.ListAPIView):
    """
    Provide /planning_id/team_id/ to get a list of villages assigned to that team in that planning.
    """
    serializer_class = AssignationSerializer
    paginator = None

    def get_queryset(self):
        """
        This view should return a list of all the purchases for
        the user as determined by the username portion of the URL.
        """
        planning_id = self.kwargs['planning_id']
        team_id = self.kwargs['team_id']
        return Assignation.objects.filter(team_id=team_id, planning_id=planning_id).order_by("village__name").select_related('village__AS')

