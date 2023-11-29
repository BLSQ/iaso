from rest_framework import status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response

from django.db.models import F
from django.http import FileResponse
from django.utils import timezone

from iaso.api.common import Paginator

from plugins.polio.api.notifications.filters import NotificationFilter
from plugins.polio.api.notifications.permissions import HasNotificationPermission
from plugins.polio.api.notifications.serializers import NotificationSerializer, NotificationImportSerializer
from plugins.polio.models import Notification, NotificationImport, create_polio_notifications_async


class NotificationPagination(Paginator):
    default_limit = 20


class NotificationViewSet(viewsets.ModelViewSet):
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
