from rest_framework import status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response

from django.db.models import F
from django.http import FileResponse

from plugins.polio.api.notifications.filters import NotificationFilter
from plugins.polio.api.notifications.permissions import HasNotificationPermission
from plugins.polio.api.notifications.serializers import NotificationSerializer, NotificationImportSerializer
from plugins.polio.models import Notification, NotificationImport, create_polio_notifications_async


class NotificationPagination(LimitOffsetPagination):
    default_limit = 20


class NotificationViewSet(viewsets.ModelViewSet):
    filterset_class = NotificationFilter
    pagination_class = NotificationPagination
    permission_classes = [HasNotificationPermission]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        account = self.request.user.iaso_profile.account
        return Notification.objects.filter(account=account, org_unit__isnull=False).annotate(
            annotated_district=F("org_unit__name"),
            annotated_province=F("org_unit__parent__name"),
            annotated_country=F("org_unit__parent__parent__name"),
        )

    @action(detail=False, methods=["get"])
    def download_sample_xlsx(self, request):
        return FileResponse(open(NotificationImport.XLSX_TEMPLATE_PATH, "rb"))

    @action(detail=False, methods=["post"])
    def import_xlsx(self, request):
        serializer = NotificationImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        notification_import = serializer.save()
        create_polio_notifications_async(pk=notification_import.pk, user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
