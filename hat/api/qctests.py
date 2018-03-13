from django.db.models import Count
from rest_framework import viewsets
from rest_framework.response import Response

from hat.patient.models import Test
from hat.constants import TYPES_WITH_IMAGES, TYPES_WITH_VIDEOS


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
        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)
        checked = request.GET.get("checked", None)
        limit = int(request.GET.get("limit", 1))
        ttype = request.GET.get("type", None)

        qs = Test.objects.all()

        if from_date is not None:
            qs = qs.filter(date__date__gte=from_date)
        if to_date is not None:
            qs = qs.filter(date__date__lte=to_date)

        if checked is not None:
            qs = qs.annotate(num_checks=Count('check'))
            if checked != 'true':
                qs = qs.exclude(num_checks__gt=0)
            else:
                qs = qs.filter(num_checks__gt=0)

        if ttype:
            qs = qs.filter(type=ttype)

            if checked != 'true':
                if ttype in TYPES_WITH_IMAGES:
                    qs = qs.exclude(image=None)
                if ttype in TYPES_WITH_VIDEOS:
                    qs = qs.exclude(video=None)

        remaining = qs.count()
        qs = qs[:limit]

        res = {
            'results': [test.to_dict() for test in qs], 'remaining_count': remaining}
        return Response(res)
