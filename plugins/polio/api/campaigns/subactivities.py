from django.shortcuts import get_object_or_404
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.response import Response

from iaso.models import OrgUnit
from plugins.polio.models import Campaign, SubActivity
from iaso.api.common import ModelViewSet


class SubActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubActivity
        fields = ["id", "round", "name", "start_date", "end_date", "org_units"]


class SubActivityViewSet(ModelViewSet):
    serializer_class = SubActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SubActivity.objects.filter(round__campaign__account=self.request.user.iaso_profile.account)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.user.account != obj.round.campaign.account:
            self.permission_denied(request)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        round = serializer.validated_data["round"]
        campaign = get_object_or_404(Campaign, rounds__in=[round])
        if self.request.user.account != campaign.account:
            raise serializers.ValidationError("You do not have permission to create a SubActivity for this Campaign.")
        org_units = serializer.validated_data["org_units"]
        user_org_units = OrgUnit.objects.filter_for_user_and_app_id(self.request.user)
        for org_unit in org_units:
            if org_unit not in user_org_units:
                raise serializers.ValidationError(
                    "You do not have permission to create a SubActivity for this OrgUnit."
                )
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def perform_update(self, serializer):
        round = serializer.validated_data["round"]
        campaign = get_object_or_404(Campaign, rounds__in=[round])
        if self.request.user.account != campaign.account:
            raise serializers.ValidationError("You do not have permission to update a SubActivity for this Campaign.")
        org_units = serializer.validated_data["org_units"]
        user_org_units = OrgUnit.objects.filter_for_user_and_app_id(self.request.user)
        for org_unit in org_units:
            if org_unit not in user_org_units:
                raise serializers.ValidationError(
                    "You do not have permission to update a SubActivity for this OrgUnit."
                )
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        if self.request.user.account != instance.round.campaign.account:
            raise serializers.ValidationError("You do not have permission to delete this SubActivity.")
        user_org_units = OrgUnit.objects.filter_for_user_and_app_id(self.request.user)
        for org_unit in instance.org_units.all():
            if org_unit not in user_org_units:
                raise serializers.ValidationError("You do not have permission to delete this SubActivity.")
        instance.delete()
