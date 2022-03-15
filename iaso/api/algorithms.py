from django.contrib.auth.models import User
from rest_framework import viewsets, permissions, serializers
from rest_framework.response import Response

from iaso.models import MatchingAlgorithm
from .common import HasPermission


class AlgorithmsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchingAlgorithm
        fields = ["id", "name", "description", "created_at"]
        read_only_fields = ["created_at"]


class AlgorithmsViewSet(viewsets.ModelViewSet):
    """Algorithms API

    This API is restricted to authenticated users having the "menupermissions.iaso_links" permission

    GET /api/algorithms/
    """

    permission_classes = [permissions.IsAuthenticated]

    serializer_class = AlgorithmsSerializer
    http_method_names = ["get", "post", "put", "head", "options", "trace", "delete"]

    def get_queryset(self):
        user = self.request.user
        users = User.objects.filter(iaso_profile__account=user.iaso_profile.account)
        algos = MatchingAlgorithm.objects.filter(users__in=users).order_by("id").distinct()
        return algos
