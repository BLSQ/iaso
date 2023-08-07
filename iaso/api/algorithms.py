from django.db.models import Q
from rest_framework import viewsets, permissions, serializers

from iaso.models import MatchingAlgorithm, Project
from hat.menupermissions import models as permission


class AlgorithmsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchingAlgorithm
        fields = ["id", "name", "description", "created_at", "projects"]
        read_only_fields = ["created_at"]


class AlgorithmsViewSet(viewsets.ModelViewSet):
    f"""Algorithms API

    This API is restricted to authenticated users having the "{permission.LINKS}" permission

    GET /api/algorithms/
    """

    permission_classes = [permissions.IsAuthenticated]

    serializer_class = AlgorithmsSerializer
    http_method_names = ["get", "post", "put", "head", "options", "trace", "delete"]

    def get_queryset(self):
        user = self.request.user
        projects = Project.objects.filter(account=user.iaso_profile.account)
        algos = MatchingAlgorithm.objects.filter(Q(projects__in=projects) | Q(projects=None)).order_by("id").distinct()
        return algos
