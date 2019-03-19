from rest_framework import viewsets
from rest_framework.response import Response
from hat.quality.models import Check
from hat.patient.models import Test
from django.db.models import Count
from django.db.models import F
from hat.sync.models import ImageUpload


class QCStatsViewSet(viewsets.ViewSet):
    """
    list:
    Show statistics on the amounts of checked and unchecked tests for images and for videos.
    Parameters: from, to: range for test dates
    """

    permission_required = ["menupermissions.x_qualitycontrol"]

    def list(self, request):
        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)
        tests_with_images = Test.objects.annotate(num_checks=Count("check")).exclude(
            image=None
        )
        tests_with_videos = Test.objects.annotate(num_checks=Count("check")).exclude(
            video=None
        )

        if from_date is not None:
            tests_with_images = tests_with_images.filter(date__date__gte=from_date)
            tests_with_videos = tests_with_videos.filter(date__date__gte=from_date)
        if to_date is not None:
            tests_with_images = tests_with_images.filter(date__date__lte=to_date)
            tests_with_videos = tests_with_videos.filter(date__date__lte=to_date)

        images_no_checks_all = tests_with_images.exclude(num_checks__gt=0)
        images_no_checks = ImageUpload.objects.filter(
            id__in=images_no_checks_all.values_list("image_id", flat=True)
        )
        images_checks_all = tests_with_images.filter(num_checks__gt=0)
        images_checks = ImageUpload.objects.filter(
            id__in=images_checks_all.values_list("image_id", flat=True)
        )
        videos_no_checks = tests_with_videos.exclude(num_checks__gt=0)
        videos_checks = tests_with_videos.filter(num_checks__gt=0)

        image_mismatches = Check.objects.exclude(result=F("test__result")).exclude(
            test__image=None
        )
        video_mismatches = Check.objects.exclude(result=F("test__result")).exclude(
            test__video=None
        )

        return Response(
            {
                "images": {
                    "no_checks_count": images_no_checks.count(),
                    "checks_count": images_checks.count(),
                    "mismatch_count": image_mismatches.count(),
                },
                "videos": {
                    "no_checks_count": videos_no_checks.count(),
                    "checks_count": videos_checks.count(),
                    "mismatch_count": video_mismatches.count(),
                },
            }
        )
