from django.db.models import Count, Min, Max
from django.db.models import Q
from pg_utils import DistinctSum
from rest_framework import viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from hat.cases.models import RES_POSITIVE
from hat.constants import CATT, PG, PL, CTCWOO, MAECT, RDT, TYPES_CONFIRMATION
from hat.patient.models import Test
from .authentication import CsrfExemptSessionAuthentication


class TestStatsViewSet(viewsets.ViewSet):
    """
    API to allow retrieval of test stats per device, per team, grouped by month, village and day, or village and year.

    Example usage:
    /api/teststats/?grouping=villageday&team_id=5&from=2013-01-19 (for the list, per team)
    /api/teststats/?device_id=394b85dce74bf3ee&grouping=villageday&from=2013-01-01&to=2017-12-31 (for the list, per device)
    /api/teststats/?device_id=394b85dce74bf3ee&grouping=villageyear&from=2013-01-01&to=2017-12-31 (for the map)
    /api/teststats/?device_id=394b85dce74bf3ee&grouping=month&from=2013-01-01&to=2017-12-31 (for the stat screen)

    all results will include the following fields:
        "test_count"
        "catt_count"
        "rdt_count"
        "pg_count"
        "ctcwoo_count"
        "maect_count"
        "pl_count",
        "date"

    If you group by village and day (grouping=villageday), you will also get information about the village (name, id,
    location).
    If you group by village and year (grouping=villageyear), you will get information about the village and the dates
    of the first and last tests in that village for a year.

    Additionally, you will get a "total" section that contains total statistics:
    total_count: total number of records
    total_confirmation_tests: total number of confirmation (MAECT, CTCWOO, PG, PL) tests performed
    total_confirmation_tests_positive: total number of positive confirmation tests
    total_catt: total number of catt tests
    total_catt_positive: total number of positive catt tests
    total_rdt: total number of rdt tests
    total_rdt_positive: total number of positive rdt tests
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    def list(self, request):
        device_id = request.GET.get("device_id", None)
        team_id = request.GET.get("team_id", None)
        grouping = request.GET.get("grouping", "villageday")
        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)
        orders = request.GET.get("order", "date").split(",")

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

        grouped_queryset = (
                queryset
                .values(*grouping_fields)
                .annotate(test_count=Count("id"))
                .annotate(catt_count=Count("id", filter=Q(type=CATT)))
                .annotate(rdt_count=Count("id", filter=Q(type=RDT)))
                .annotate(pg_count=Count("id", filter=Q(type=PG)))
                .annotate(ctcwoo_count=Count("id", filter=Q(type=CTCWOO)))
                .annotate(maect_count=Count("id", filter=Q(type=MAECT)))
                .annotate(pl_count=Count("id", filter=Q(type=PL)))
                .annotate(pl_count_stage1=Count("id", filter=Q(type=PL) & Q(form__test_pl_result='stage1')))
                .annotate(pl_count_stage2=Count("id", filter=Q(type=PL) & Q(form__test_pl_result='stage2')))
                .annotate(confirmation_count=Count("id", filter=Q(type=PG) | Q(type=CTCWOO) | Q(type=MAECT)))
                .annotate(positive_catt_count=Count("id", filter=Q(type=CATT) & Q(result__gte=RES_POSITIVE)))
                .annotate(positive_rdt_count=Count("id", filter=Q(type=RDT) & Q(result__gte=RES_POSITIVE)))
                .annotate(positive_screening_test_count=Count(
                    "id",
                    filter=(Q(type=RDT) & Q(result__gte=RES_POSITIVE)) | (Q(type=CATT) & Q(result__gte=RES_POSITIVE))))
                .annotate(first_test_date=Min("date"))
                .annotate(last_test_date=Max("date"))
                .annotate(total_population=DistinctSum("village__population"))
        )

        if grouping == "month":
            values = ("date", "confirmation_count", "positive_catt_count", "positive_rdt_count",
                      "positive_screening_test_count","pl_count_stage1" , "pl_count_stage2")
            orders = "date",
        elif grouping == "villageday":
            values = ("village__name", "village__id", "village__latitude", "village__longitude", "date")
            # order = "date",
        elif grouping == "villageyear":
            values = ("village__name", "date", "village__id", "village__latitude", "village__longitude",
                      "first_test_date", "last_test_date")
            orders = "date", "village__name"
        values = values + ("test_count", "catt_count", "rdt_count", "pg_count", "ctcwoo_count")
        values = values + ("maect_count", "pl_count", "total_population")

        grouped_queryset = grouped_queryset.values(*values).order_by(*orders)


        # To compute the positive confirmation tests, one first needs to group by form/patient and then annotate tests
        case_queryset = queryset \
            .values('form__id') \
            .annotate(confirmation_tests=Count("id", filter=Q(type__in=TYPES_CONFIRMATION))) \
            .annotate(confirmation_tests_positive=Count("id", filter=Q(type__in=TYPES_CONFIRMATION) & Q(
                result__gte=RES_POSITIVE))) \
            .annotate(catt_tests=Count("id", filter=Q(type=CATT))) \
            .annotate(catt_tests_positive=Count("id", filter=Q(type=CATT) & Q(result__gte=RES_POSITIVE))) \
            .annotate(rdt_tests=Count("id", filter=Q(type=RDT))) \
            .annotate(rdt_tests_positive=Count("id", filter=Q(type=RDT) & Q(result__gte=RES_POSITIVE)))

        total_queryset = case_queryset.aggregate(
            total_count=Count("*"),
            total_confirmation_tests=Count("confirmation_tests", filter=Q(confirmation_tests__gt=0)),
            total_confirmation_tests_positive=Count("confirmation_tests_positive",
                                                    filter=Q(confirmation_tests_positive__gt=0)),
            total_catt=Count("catt_tests", filter=Q(catt_tests__gt=0)),
            total_catt_positive=Count("catt_tests", filter=Q(catt_tests_positive__gt=0)),
            total_rdt=Count("rdt_tests", filter=Q(rdt_tests__gt=0)),
            total_rdt_positive=Count("rdt_tests", filter=Q(rdt_tests_positive__gt=0)),
        )

        return Response({"result": grouped_queryset, "total": total_queryset})