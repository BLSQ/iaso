from rest_framework.response import Response

from ..tasks.copy_pyramid import copy_pyramid
from ..models import DataSource, SourceVersion, Task
from rest_framework import viewsets, permissions, serializers
from .common import HasPermission
from django.shortcuts import get_object_or_404


class CopySourceSerializer(serializers.Serializer):
    source_source_id = serializers.IntegerField(required=True)
    source_version_number = serializers.IntegerField(required=True)
    destination_source_id = serializers.IntegerField(required=True)
    destination_version_number = serializers.CharField(max_length=200, required=True)
    force = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        validated_data = super().validate(attrs)
        request = self.context["request"]
        user = request.user
        user.account.project_set.all()
        possible_data_sources = DataSource.objects.filter(
            projects__account__in=user.account.project_set.all()
        ).values_list("id", flat=True)
        source_source_id = attrs["source_source_id"]
        get_object_or_404(SourceVersion, data_source_id=source_source_id, number=attrs["source_version_number"])
        if validated_data["source_source_id"] not in possible_data_sources:
            raise serializers.ValidationError("Unauthorized source_source_id")
        if validated_data["destination_source_id"] not in possible_data_sources:
            raise serializers.ValidationError("Unauthorized source_source_id")

        return validated_data


class CopySourceViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_sources")]
    serializer_class = CopySourceSerializer

    def create(self, request):
        data = request.data
        source_source_id = data["source_source_id"]
        source_version_number = data["source_version_number"]
        destination_source_id = data["destination_source_id"]
        destination_version_number = data["destination_version_number"]
        force = data.get("force", False)
        task = Task()
        task.account = request.user.iaso_profile.account
        task.launcher = request.user
        task.name = "Copy pyramid by %s" % task.launcher
        task.save()

        copy_pyramid(
            source_source_id, source_version_number, destination_source_id, destination_version_number, force, task.id
        )
        return Response(task.as_dict())
