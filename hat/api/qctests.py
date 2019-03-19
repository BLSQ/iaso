from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.response import Response

from hat.sync.models import ImageUpload
from hat.patient.models import Test
from hat.constants import TYPES_WITH_IMAGES, TYPES_WITH_VIDEOS
from hat.users.models import LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5


class QCTestsViewSet(viewsets.ViewSet):
    """
    API to list tests, with images or video links if needed.

    list:
        parameters:
           limit: the limit on the number of tests
           type: the type of test (Ex: 'CATT', 'RDT', 'PG', ....)
           checked: if true, get tests that have already been checked, if false: get tests without check yet (only tests with images or videos allowing a check)
    """

    permission_required = ["menupermissions.x_qualitycontrol"]

    def list(self, request):
        user_level = request.user.profile.level
        print("user_level", user_level)
        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)
        checked = request.GET.get("checked", None)
        limit = int(request.GET.get("limit", 1))
        test_type = request.GET.get("type", None)

        qs = Test.objects.all()

        if from_date is not None:
            qs = qs.filter(date__date__gte=from_date)
        if to_date is not None:
            qs = qs.filter(date__date__lte=to_date)

        if checked is not None:
            qs = qs.annotate(num_checks=Count("check"))
            if checked != "true":
                if user_level == LEVEL_1:
                    qs = qs.exclude(num_checks__gt=0)
                else:
                    if user_level > LEVEL_1:
                        target_level = LEVEL_1
                        if user_level == LEVEL_3:
                            target_level = LEVEL_2
                        elif user_level == LEVEL_4:
                            target_level == LEVEL_3
                        elif user_level == LEVEL_5:
                            target_level == LEVEL_4
                        qs = qs.filter(check__level=target_level).exclude(
                            check__level__gt=target_level
                        )
            else:
                qs = qs.filter(num_checks__gt=0)

        if test_type:
            qs = qs.filter(type=test_type)

            if checked != "true":
                if test_type in TYPES_WITH_IMAGES:
                    qs = qs.exclude(image=None)
                if test_type in TYPES_WITH_VIDEOS:
                    qs = qs.exclude(video=None)

        if qs and test_type == "CATT":
            first_catt_test = qs[0]
            temp_res = qs.filter(image=first_catt_test.image).order_by("index")
            remaining = ImageUpload.objects.filter(
                id__in=qs.values_list("image_id", flat=True)
            ).count()
        else:
            temp_res = qs[:limit]
            remaining = qs.count()

        res = {
            "results": [test.as_dict() for test in temp_res],
            "remaining_count": remaining,
        }
        return Response(res)

    def retrieve(self, request, pk):
        test = get_object_or_404(Test, id=pk)
        return Response(test.as_dict(with_checks=True))
