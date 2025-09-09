import django_filters

from django.db.models import Prefetch, QuerySet
from django.utils import timezone
from rest_framework import exceptions, filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import SAFE_METHODS
from rest_framework.response import Response

from iaso.api.common import Paginator
from plugins.polio import permissions as polio_permissions
from plugins.polio.api.chronogram.filters import ChronogramFilter, ChronogramTaskFilter
from plugins.polio.api.chronogram.permissions import HasChronogramPermission, HasChronogramRestrictedWritePermission
from plugins.polio.api.chronogram.serializers import (
    ChronogramCreateSerializer,
    ChronogramSerializer,
    ChronogramTaskSerializer,
    ChronogramTemplateTaskSerializer,
)
from plugins.polio.models import Campaign, Chronogram, ChronogramTask, ChronogramTemplateTask, Round


class ChronogramPagination(Paginator):
    page_size = 20


class ChronogramViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = ChronogramFilter
    http_method_names = ["delete", "get", "options", "head", "post", "trace"]
    pagination_class = ChronogramPagination
    permission_classes = [HasChronogramPermission | HasChronogramRestrictedWritePermission]

    def get_serializer_class(self):
        if self.action == "create":
            return ChronogramCreateSerializer
        return ChronogramSerializer

    def get_permissions(self):
        if self.request.user.has_perm(polio_permissions.POLIO_CHRONOGRAM):
            return super().get_permissions()
        if self.request.method not in SAFE_METHODS and self.request.user.has_perm(
            polio_permissions.POLIO_CHRONOGRAM_RESTRICTED_WRITE
        ):
            raise exceptions.PermissionDenied()
        return super().get_permissions()

    def get_queryset(self) -> QuerySet:
        user = self.request.user
        rounds_ids = Campaign.polio_objects.filter_for_user(user).values_list("rounds", flat=True)
        return (
            Chronogram.objects.valid()
            .filter(round_id__in=rounds_ids, round__on_hold=False)
            .select_related("round__campaign", "created_by", "updated_by")
            .prefetch_related(Prefetch("tasks", queryset=ChronogramTask.objects.valid()))
            .prefetch_related("tasks__created_by", "tasks__updated_by")
            .order_by("created_at")
        )

    def options(self, request, *args, **kwargs):
        """
        Add custom metadata about the API.
        """
        if self.metadata_class is None:
            return self.http_method_not_allowed(request, *args, **kwargs)
        data = self.metadata_class().determine_metadata(request, self)

        chronogram_campaigns = (
            self.get_queryset()
            .order_by("round__campaign__obr_name")
            .distinct("round__campaign__obr_name")
            .values_list(
                "round__campaign__id",  # `id` is a UUID.
                "round__campaign__obr_name",
            )
        )
        data["campaigns_filter_choices"] = [{"value": str(c[0]), "display_name": c[1]} for c in chronogram_campaigns]

        return Response(data, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        """
        Create a `Chronogram` and populate it with `ChronogramTemplateTask` objects (if any).
        """
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=self.request.user)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_destroy(self, instance):
        """
        Perform soft delete.
        """
        instance.delete()
        instance.tasks.update(deleted_at=timezone.now())  # Bulk soft delete of related tasks.

    @action(detail=False, methods=["GET"])
    def available_rounds_for_create(self, request):
        """
        Returns all available rounds that can be used to create a new `Chronogram`.
        """
        user_campaigns = Campaign.polio_objects.filter_for_user(self.request.user).filter(
            country__isnull=False, is_test=False, on_hold=False
        )
        already_linked_rounds = (
            Chronogram.objects.valid().filter(round__campaign__in=user_campaigns).values_list("round_id", flat=True)
        )
        available_rounds = (
            Round.objects.filter(campaign__in=user_campaigns)
            .exclude(pk__in=already_linked_rounds)
            .select_related("campaign__country")
            .order_by("campaign__country__name", "campaign__obr_name", "number")
            .only(
                "id",
                "number",
                "campaign_id",
                "campaign__obr_name",
                "campaign__country_id",
                "campaign__country__name",
                "target_population",
            )
        )
        return Response(available_rounds.as_ui_dropdown_data(), status=status.HTTP_200_OK)


class ChronogramTaskViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = ChronogramTaskFilter
    pagination_class = ChronogramPagination
    permission_classes = [HasChronogramPermission | HasChronogramRestrictedWritePermission]
    serializer_class = ChronogramTaskSerializer

    def get_permissions(self):
        if self.request.user.has_perm(polio_permissions.POLIO_CHRONOGRAM):
            return super().get_permissions()
        if self.request.method in ["POST", "DELETE"] and self.request.user.has_perm(
            polio_permissions.POLIO_CHRONOGRAM_RESTRICTED_WRITE
        ):
            raise exceptions.PermissionDenied()
        return super().get_permissions()

    def get_queryset(self) -> QuerySet:
        user = self.request.user
        campaigns = Campaign.polio_objects.filter_for_user(user)
        return (
            ChronogramTask.objects.valid()
            .filter(chronogram__round__campaign__in=campaigns)
            .select_related("chronogram__round", "created_by", "updated_by")
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
        serializer.validated_data["account"] = self.request.user.iaso_profile.account
        serializer.save()

    def perform_update(self, serializer):
        serializer.validated_data["updated_by"] = self.request.user
        serializer.save()
