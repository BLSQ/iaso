from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from hat.constants import CATT, RDT, CTCWOO, MAECT, PL, PG
from hat.patient.models import Test
from hat.sync.models import DeviceDB
from .authentication import CsrfExemptSessionAuthentication


class DevicesViewSet(viewsets.ViewSet):
    """
    Team API to allow modifications and retrieval of devices.

    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    permission_required = [
        'menupermissions.x_management_devices'
    ]

    def list(self, request):
        devices = DeviceDB.objects.all()\
            .prefetch_related("last_user")\
            .prefetch_related("last_user__profile")\
            .prefetch_related("last_user__profile__team")
        res = []
        for device in devices:
            # Add stats about pictures and videos
            device_stats = Test.objects.all().select_related('form').filter(form__device_id=device.device_id)\
                .aggregate(
                    count_total=Count('id'),
                    # count_catt=Count('id', filter=Q(type=CATT)),
                    # count_catt_with_filename=Count('id', filter=Q(image_filename__isnull=False)),
                    # count_catt_with_linked_picture=Count('id',
                    #                                      filter=Q(image_filename__isnull=False) & Q(
                    #                                          image_id__isnull=False) & Q(type=CATT)),
                    # count_rdt=Count('id', filter=Q(type=RDT)),
                    # count_rdt_with_filename=Count('id', filter=Q(image_filename__isnull=False)),
                    # count_rdt_with_linked_picture=Count('id',
                    #                                     filter=Q(image_filename__isnull=False) & Q(
                    #                                         image_id__isnull=False) & Q(type=RDT)),
                    count_linked_pictures=Count('id', filter=Q(image_filename__isnull=False) & Q(
                                            image_id__isnull=False) & (Q(type=RDT) | Q(type=CATT))),
                    count_pictures_with_filename=Count('id', filter=Q(image_filename__isnull=False)),
                    count_video_with_filename=Count('id', filter=Q(video_filename__isnull=False)),
                    count_video_with_linked_video=Count(
                        'id',
                        filter=Q(video_filename__isnull=False) &
                            Q(video_id__isnull=False) &
                            Q(
                                Q(type=CTCWOO) |
                                Q(type=MAECT) |
                                Q(type=PL) |
                                Q(type=PG)
                            )
                    ),
                )
            # Fetch user information
            last_team = ""
            last_user = ""
            if device.last_user and device.last_user.profile:
                last_user = device.last_user.profile.full_name()
                if device.last_user.profile.team:
                    last_team = device.last_user.profile.team.name
            log_message = device.last_synced_log_message
            if not log_message:
                log_message = ""

            device_dict = {
                "last_synced_date": device.last_synced_date,
                "last_synced_log_message": log_message,
                "device_id": device.device_id,
                "days_since_sync": device.days_since_sync(),
                "last_user": last_user,
                "last_team": last_team,
                "id": device.id,
                **device_stats
            }

            res.append(device_dict)

        orders = request.GET.get("order", "-days_since_sync").split(",")
        orders = [w.replace("last_synced_date", "days_since_sync") for w in orders]
        orders = [w.replace("-last_synced_date", "-days_since_sync") for w in orders]

        orders.reverse()

        for order in orders:
            key = order
            invert = False
            if order.startswith("-"):
                key = order[1:]
                invert = True

            res = sorted(
                res,
                key=lambda d: (d.get(key, "").lower() if isinstance(d.get(key, ""), str) else d.get(key, "")),
                reverse=invert,
            )

        return Response(res)

    def retrieve(self, request, pk=None):
        device = get_object_or_404(DeviceDB, pk=pk)

        return Response(device.as_dict())
