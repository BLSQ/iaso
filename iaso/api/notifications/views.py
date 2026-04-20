from django.utils.translation import ngettext
from rest_framework import permissions, viewsets
from rest_framework.response import Response

from iaso.api.notifications.checks import check_apiimport_for_user
from iaso.api.notifications.models import Notification, NotificationLevel, NotificationType
from iaso.api.notifications.serializers import NotificationSerializer


class NotificationViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        notifications = []
        if request.user.is_staff or request.user.is_superuser:
            apiimport_count = check_apiimport_for_user(request.user)
            if apiimport_count:
                notifications.append(
                    Notification(
                        message=ngettext(
                            singular="There is %(count)d failing import needing your attention.",
                            plural="There are %(count)d failing imports needing your attention.",
                            number=apiimport_count,
                        )
                        % {"count": apiimport_count},
                        level=NotificationLevel.ERROR,
                        type=NotificationType.APIIMPORT,
                    )
                )
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)
