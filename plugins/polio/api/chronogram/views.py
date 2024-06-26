import django_filters

from django.db.models import QuerySet

from rest_framework import filters
from rest_framework import viewsets

from iaso.api.common import Paginator

from plugins.polio.api.chronogram.filters import ChronogramFilter
from plugins.polio.api.chronogram.permissions import HasChronogramPermission
from plugins.polio.api.chronogram.serializers import (
    ChronogramSerializer,
    ChronogramTaskSerializer,
    ChronogramTemplateTaskSerializer,
)
from plugins.polio.models import Campaign, Chronogram, ChronogramTask, ChronogramTemplateTask


class ChronogramPagination(Paginator):
    page_size = 20


class ChronogramViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = ChronogramFilter
    http_method_names = ["get", "options", "head", "trace"]
    pagination_class = ChronogramPagination
    permission_classes = [HasChronogramPermission]
    serializer_class = ChronogramSerializer

    def get_queryset(self) -> QuerySet:
        user = self.request.user
        rounds_ids = Campaign.polio_objects.filter_for_user(user).values_list("rounds", flat=True)
        return (
            Chronogram.objects.valid()
            .filter(round_id__in=rounds_ids)
            .select_related("round__campaign", "created_by", "updated_by")
            .prefetch_related("tasks__user_in_charge", "tasks__created_by", "tasks__updated_by")
            .order_by("created_at")
        )


class ChronogramTaskViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    pagination_class = ChronogramPagination
    permission_classes = [HasChronogramPermission]
    serializer_class = ChronogramTaskSerializer

    def get_queryset(self) -> QuerySet:
        user = self.request.user
        campaigns = Campaign.polio_objects.filter_for_user(user)
        return (
            ChronogramTask.objects.filter(chronogram__round__campaign__in=campaigns)
            .select_related("chronogram__round", "user_in_charge", "created_by", "updated_by")
            .order_by("created_at")
        )

    def perform_create(self, serializer):
        serializer.validated_data["created_by"] = self.request.user
        serializer.save()

    def perform_update(self, serializer):
        serializer.validated_data["updated_by"] = self.request.user
        serializer.save()


class ChronogramTemplateTaskViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    pagination_class = ChronogramPagination
    permission_classes = [HasChronogramPermission]
    serializer_class = ChronogramTemplateTaskSerializer

    def get_queryset(self) -> QuerySet:
        account = self.request.user.iaso_profile.account
        return (
            ChronogramTemplateTask.objects.valid()
            .filter(account=account)
            .select_related("created_by", "updated_by")
            .order_by("created_at")
        )

    def perform_create(self, serializer):
        serializer.validated_data["created_by"] = self.request.user
        serializer.save()

    def perform_update(self, serializer):
        serializer.validated_data["updated_by"] = self.request.user
        serializer.save()
