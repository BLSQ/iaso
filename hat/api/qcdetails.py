from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.response import Response

from hat.patient.models import Test


from hat.users.models import Profile
from hat.quality.models import Check
from hat.constants import TYPES_WITH_VIDEOS, TYPES_WITH_IMAGES

from hat.cases.models import testResultString


class QCDetailsViewSet(viewsets.ViewSet):
    """
    API to get details of QC for a given user
    """

    permission_required = ["menupermissions.x_qualitycontrol"]

    def retrieve(self, request, pk):
        # TODO check geographical limits
        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)

        tester = get_object_or_404(Profile, id=pk)
        test_with_checks_ids = Check.objects.filter(test__tester=tester).values_list(
            "test_id"
        )

        tests = (
            Test.objects.filter(id__in=test_with_checks_ids)
            .order_by("created_at")
            .prefetch_related("check_set")
        )
        if from_date is not None:
            tests = tests.filter(date__date__gte=from_date)
        if to_date is not None:
            tests = tests.filter(date__date__lte=to_date)

        res = {}
        res["tester"] = tester.full_name()
        test_array = []

        for test in tests:
            test_dict = {}
            test_dict["created_at"] = test.created_at
            test_dict["id"] = test.id
            test_dict["tester"] = test.tester.full_name()
            test_dict["result"] = testResultString(test.result)
            test_dict["type"] = test.type
            if test.type == "CATT":
                test_dict["index"] = test.index
            if test.type in TYPES_WITH_IMAGES:

                if test.image:
                    test_dict["media_type"] = "image"
                    test_dict["media_url"] = test.image.image.url

            if test.type in TYPES_WITH_VIDEOS:
                if test.video:
                    test_dict["media_type"] = "video"
                    test_dict["media_url"] = test.video.video.url

            for check in test.check_set.all():
                if check.level == 20:
                    test_dict["check_20_result"] = testResultString(check.result)
                    test_dict["check_20_date"] = check.created_at
                    test_dict[
                        "check_20_validator"
                    ] = check.validator.profile.full_name()
                    test_dict["check_20_created_at"] = check.created_at
                if check.level == 30:
                    test_dict["check_30_result"] = testResultString(check.result)
                    test_dict["check_30_date"] = check.created_at
                    test_dict[
                        "check_30_validator"
                    ] = check.validator.profile.full_name()
                    test_dict["check_30_created_at"] = check.created_at

            test_array.append(test_dict)

        res["tests"] = test_array

        return Response(res)
