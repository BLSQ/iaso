from rest_framework import viewsets
from rest_framework.response import Response
from django.db.models import Count, Min, Max
from django.db.models import Q
from hat.constants import CATT, PG, PL, CTCWOO, MAECT, RDT
from hat.patient.models import Test


from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class TestStatsViewSet(viewsets.ViewSet):
    """
    API to allow retrieval of test stats per device, per team, grouped by month, village and day, or village and year.

    Example usage:
    /api/teststats/?grouping=villageday&team_id=5&from=2013-01-19 (for the list, per team)
    /api/teststats/?device_id=394b85dce74bf3ee&grouping=villageday&from=2013-01-01&to=2017-12-31 (for the list, per device)
    api/teststats/?device_id=394b85dce74bf3ee&grouping=villageyear&from=2013-01-01&to=2017-12-31 (for the map)
    api/teststats/?device_id=394b85dce74bf3ee&grouping=month&from=2013-01-01&to=2017-12-31 (for the stat screen)

    all results will include the following fields:
        "test_count"
        "catt_count"
        "rdt_count"
        "pg_count"
        "ctcwoo_count"
        "maect_count"
        "pl_count",
        "date"

    If you group by village and day (grouping=villageday), you will also get information about the village (name, id, location)
    If you group by village and year (grouping=villageyear), you will get information about the village and the dates of the first and last tests in that village for a year
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    def list(self, request):
        device_id = request.GET.get("device_id", None)
        team_id = request.GET.get("team_id", None)
        grouping = request.GET.get("grouping", "villageday")
        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)

        if grouping == "villageday":
            grouping_fields = (
                'village_id', "date"
            )
            queryset = Test.objects.extra(select={'date': 'date( date )'})
        elif grouping == "villageyear":
            grouping_fields = (
                "village_id", "date",
            )
            queryset = Test.objects.select_related('village').extra(select={'date': "date_trunc('year', date) "})
        elif grouping == "month":
            grouping_fields = (
                "date",
            )
            queryset = Test.objects.extra(select={'date': "date_trunc('month', date) "})

        if from_date is not None:
            queryset = queryset.filter(date__gte=from_date)

        if to_date is not None:
            queryset = queryset.filter(date__lte=to_date)

        if device_id:
            queryset = queryset.filter(form__device_id=device_id)

        if team_id:
            queryset = queryset.filter(form__normalized_team_id=team_id)

        queryset = (
                queryset
                .values(*grouping_fields)
                .annotate(test_count=Count("id"))
                .annotate(catt_count=Count("id", filter=Q(type=CATT)))
                .annotate(rdt_count=Count("id", filter=Q(type=RDT)))
                .annotate(pg_count=Count("id", filter=Q(type=PG)))
                .annotate(ctcwoo_count=Count("id", filter=Q(type=CTCWOO)))
                .annotate(maect_count=Count("id", filter=Q(type=MAECT)))
                .annotate(pl_count=Count("id", filter=Q(type=PL)))
                .annotate(first_test_date=Min("date"))
                .annotate(last_test_date=Max("date"))
        )

        if grouping == "month":
            values = ("date", )
            order = "date",
        elif grouping == "villageday":
            values = ("village__name", "village__id", "village__latitude", "village__longitude", "date")
            order = "date",
        elif grouping == "villageyear":
            values = ("village__name", "date", "village__id", "village__latitude", "village__longitude", 'first_test_date', 'last_test_date')
            order = "date", "village__name"
        values = values + ("test_count", "catt_count", "rdt_count", "pg_count", "ctcwoo_count")
        values = values + ("maect_count", "pl_count")

        queryset = queryset.values(*values).order_by(*order)

        return Response(queryset)

