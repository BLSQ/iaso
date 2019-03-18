from django.db.models import Count, Q, Max
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from hat.constants import CATT, RDT, CTCWOO, MAECT, PL, PG
from hat.patient.models import Test
from hat.sync.models import DeviceDB
from .authentication import CsrfExemptSessionAuthentication
from django.core.cache import cache


class DevicesViewSet(viewsets.ViewSet):
    """
    Team API to allow modifications and retrieval of devices.

    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    permission_required = [
        'menupermissions.x_management_devices'
    ]

    def list(self, request):
        absolute_url = request.build_absolute_uri()

        result = cache.get(absolute_url)
        if result:
            return Response(result)
        with_tests_devices = request.GET.get("with_tests_devices", False)
        coordination_ids = request.GET.get("coordination_id", None)
        teams = request.GET.get("teams", None)
        profile_ids = request.GET.get("profile_id", None)
        as_list = request.GET.get("as_list", None)
        devices = DeviceDB.objects.all()\
            .prefetch_related("last_user")\
            .prefetch_related("last_user__profile")\
            .prefetch_related("last_user__profile__team")

        if not with_tests_devices:
            devices = devices.filter(is_test=False)
        if coordination_ids:
            devices = devices.filter(last_user__profile__team__coordination__id__in=coordination_ids.split(","))
        if teams:
            devices = devices.filter(last_user__profile__team__id__in=teams.split(","))
        if profile_ids:
            devices = devices.filter(last_user__id__in=profile_ids.split(","))
        res = []

        if as_list:
            res = map(lambda device: device.as_dict(),  devices)
            cache.set(absolute_url, res, 30 * 60)
            return Response(res)
        else:
            for device in devices:
                # Add stats about pictures and videos
                device_stats = Test.objects.all().select_related('form').filter(form__device_id=device.device_id)\
                    .aggregate(
                        count_total=Count('id'),
                        count_uploaded_pictures=Count('id', filter=Q(image_filename__isnull=False) & Q(
                                                image_id__isnull=False) & (Q(type=RDT) | Q(type=CATT))),
                        count_captured_pictures=Count('id', filter=Q(image_filename__isnull=False)),
                        latest_image_upload=Max('image__upload_date', filter=Q(image_filename__isnull=False) & Q(
                                                image_id__isnull=False) & (Q(type=RDT) | Q(type=CATT))),
                        count_captured_video=Count('id', filter=Q(video_filename__isnull=False)),
                        count_uploaded_video=Count(
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
                        latest_video_upload=Max(
                            'video__upload_date',
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
                if with_tests_devices:
                    device_dict['is_test'] = device.is_test

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

            cache.set(absolute_url, res, 30 * 60)
            return Response(res)

    def retrieve(self, request, pk=None):
        device = get_object_or_404(DeviceDB, pk=pk)

        return Response(device.as_dict())

    def partial_update(self, request, pk=None):
        device = get_object_or_404(DeviceDB, pk=pk)
        is_test = request.data.get("is_test", None)
        if is_test is not None:
            device.is_test = is_test
        device.save()
        return Response(device.as_dict())

