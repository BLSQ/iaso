from rest_framework import viewsets, permissions, serializers

from iaso.models import MatchingAlgorithm, Project



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
        project = Project.objects.get(account=user.iaso_profile.account)
        algos = MatchingAlgorithm.objects.filter(projects=project).order_by("id").distinct()
        return algos
