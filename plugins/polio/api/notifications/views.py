import django_filters

from rest_framework import filters
from rest_framework import status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from django.db.models import F
from django.http import FileResponse
from django.utils import timezone

from iaso.api.common import Paginator
from iaso.models import OrgUnitType

from plugins.polio.api.notifications.filters import NotificationFilter
from plugins.polio.api.notifications.permissions import HasNotificationPermission
from plugins.polio.api.notifications.serializers import NotificationSerializer, NotificationImportSerializer
from plugins.polio.models import Notification, NotificationImport, create_polio_notifications_async


class NotificationPagination(Paginator):
    page_size = 20


class NotificationViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = NotificationFilter
    pagination_class = NotificationPagination
    permission_classes = [HasNotificationPermission]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        account = self.request.user.iaso_profile.account
        return Notification.objects.filter(account=account).annotate(
            annotated_district=F("org_unit__name"),
            annotated_province=F("org_unit__parent__name"),
            annotated_country=F("org_unit__parent__parent__name"),
        )

    def options(self, request, *args, **kwargs):
        """
        Add custom metadata about the API.
        It's used by the front-end to build the UI.
        """
        if self.metadata_class is None:
            return self.http_method_not_allowed(request, *args, **kwargs)
        data = self.metadata_class().determine_metadata(request, self)

        try:
            countries_for_account = Notification.objects.get_countries_for_account(request.user.iaso_profile.account)
            country_choices = [{"display_name": ou.name, "value": ou.pk} for ou in countries_for_account]
            data["actions"]["POST"]["country"]["choices"] = country_choices
        except AttributeError:
            data["actions"]["POST"]["country"]["choices"] = []

        data["actions"]["POST"]["org_unit"]["allowed_ids"] = OrgUnitType.objects.filter(
            category="DISTRICT"
        ).values_list(flat=True)

        return Response(data, status=status.HTTP_200_OK)

    def perform_create(self, serializer):
        user = self.request.user
        account = user.iaso_profile.account
        serializer.save(account=account, created_by=user)

    def perform_update(self, serializer):
        user = self.request.user
        account = user.iaso_profile.account
        serializer.save(account=account, updated_by=user, updated_at=timezone.now())

    @action(detail=False, methods=["get"])
    def download_sample_xlsx(self, request):
        return FileResponse(open(NotificationImport.XLSX_TEMPLATE_PATH, "rb"))

    @action(detail=False, methods=["post"])
    def import_xlsx(self, request):
        user = request.user
        account = user.iaso_profile.account
        serializer = NotificationImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        notification_import = serializer.save(account=account, created_by=user)
        create_polio_notifications_async(pk=notification_import.pk, user=user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
