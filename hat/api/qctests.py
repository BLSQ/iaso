from rest_framework import viewsets
from rest_framework.response import Response
from hat.patient.models import Test
from django.db.models import Count


class QCTestsViewSet(viewsets.ViewSet):
    """
    API to list tests, with images or video links if needed.

    list:
        parameters:
           limit: the limit on the number of tests
           type: the type of test (Ex: 'CATT', 'RDT', 'PG', ....)
           checked: if true, get tests that have already been checked, if false: get tests without check yet (only tests with images or videos allowing a check)
    """
    def list(self, request):
        checked = request.GET.get("checked", None)
        limit = int(request.GET.get("limit", 1))
        ttype = request.GET.get("type", None)

        qs = Test.objects.all()

        if checked is not None:
            qs = qs.annotate(num_checks=Count('check'))
            print(checked, type(checked))
            if checked != 'true':
                qs = qs.exclude(num_checks__gt=0)
            else:
                qs = qs.filter(num_checks__gt=0)

        if ttype:
            qs = qs.filter(type=ttype)

            if checked != 'true':
                if ttype in Test.TYPES_WITH_IMAGES:
                    qs = qs.exclude(image=None)
                if ttype in Test.TYPES_WITH_VIDEOS:
                    qs = qs.exclude(video=None)

        qs = qs[:limit]

        res = [test.to_dict() for test in qs]
        return Response(res)

