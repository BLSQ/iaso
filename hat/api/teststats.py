from datetime import datetime

from django.core.cache import cache
from django.db.models import Count, Min, Max, TextField, F
from django.db.models import Q
from django.db.models.functions import Coalesce, Cast
from django.http import HttpResponse
from pg_utils import DistinctSum
from rest_framework import viewsets, status
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from hat.cases.models import RES_POSITIVE, RES_UNREADABLE, RES_NEGATIVE, RES_MISSING, RES_ABSENT, RES_UNSURE, RES_INVALID
from hat.constants import CATT, PG, PL, CTCWOO, MAECT, RDT, TYPES_CONFIRMATION, TYPES_WITH_IMAGES
from hat.patient.models import Test
from hat.patient.teststats_report import generate_report
from .authentication import CsrfExemptSessionAuthentication


class TestStatsViewSet(viewsets.ViewSet):
    """
    API to allow retrieval of test stats per device, per team, grouped by month, village and day, or village and year.

    Example usage:
    /api/teststats/?grouping=villageday&team_id=5&from=2013-01-19 (for the list, per team)
    /api/teststats/?device_id=394b85dce74bf3ee&grouping=villageday&from=2013-01-01&to=2017-12-31 (for the list, per device)
    /api/teststats/?device_id=394b85dce74bf3ee&grouping=villageyear&from=2013-01-01&to=2017-12-31 (for the map)
    /api/teststats/?device_id=394b85dce74bf3ee&grouping=month&from=2013-01-01&to=2017-12-31 (for the stat screen)
    /api/teststats/?grouping=tester&from=2017-01-01&to=2017-12-31&testertype=screener (for the user stats screen)
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
        absolute_url = request.build_absolute_uri()
        user_level = request.user.profile.level if request.user.profile.level else 10

        result = cache.get(absolute_url)
        device_id = request.GET.get("device_id", None)
        team_id = request.GET.get("team_id", None)
        grouping = request.GET.get("grouping", "villageday")
        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)
        orders = request.GET.get("order", "date").split(",")
        tester_type = request.GET.get("testertype", None)
        xlsx_format = request.GET.get("xlsx", None)

        if result is None:
            if grouping == "villageday":
                grouping_fields = ("village_id", "date")
                queryset = Test.objects.extra(select={"date": "date( date )"})
            elif grouping == "village":
                if from_date is None or to_date is None:
                    return Response(
                        {
                            "error": "The village grouping requires a date range `from` and `to`"
                        },
                        status.HTTP_400_BAD_REQUEST,
                    )
                grouping_fields = (
                    "village_id",
                    "village__population",
                    "village__AS_id",
                    "village__AS__name",
                    "village__AS__ZS_id",
                    "village__AS__ZS__name",
                    "village__AS__ZS__province_id",
                    "village__AS__ZS__province__name",
                )
                queryset = Test.objects.all()
            elif grouping == "villageyear":
                grouping_fields = ("village_id", "date")
                queryset = Test.objects.select_related("village").extra(
                    select={"date": "date_trunc('year', date) "}
                )
            elif grouping == "month":
                grouping_fields = ("date",)
                queryset = Test.objects.extra(
                    select={"date": "date_trunc('month', date) "}
                )
            elif grouping == "year":
                grouping_fields = ("date",)
                queryset = Test.objects.extra(
                    select={"date": "date_trunc('year', date) "}
                )
            elif grouping == "tester":
                grouping_fields = (
                    "tester_id",
                    "tester__user__last_name",
                    "tester__user__first_name",
                )
                queryset = Test.objects.select_related("tester__user").filter(
                    tester__isnull=False
                )
            else:
                return Response(
                    data={"error": "invalid grouping parameter"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if from_date is not None:
                queryset = queryset.filter(date__gte=from_date)

            if to_date is not None:
                queryset = queryset.filter(date__lte=to_date)

            if device_id:
                queryset = queryset.filter(form__device_id=device_id)

            if team_id:
                queryset = queryset.filter(form__normalized_team_id=team_id)

            if tester_type:
                queryset = queryset.filter(tester__tester_type=tester_type)

            grouped_queryset = (
                queryset.values(*grouping_fields)
                .annotate(test_count=Count("id"))
                .annotate(catt_count=Count("id", filter=Q(type=CATT)))
                .annotate(rdt_count=Count("id", filter=Q(type=RDT)))
                .annotate(
                    screening_count=Count("id", filter=Q(type=CATT) | Q(type=RDT))
                )
                .annotate(pg_count=Count("id", filter=Q(type=PG)))
                .annotate(
                    pg_count_positive=Count(
                        "id", filter=Q(type=PG) & Q(result__gte=RES_POSITIVE)
                    )
                )
                .annotate(ctcwoo_count=Count("id", filter=Q(type=CTCWOO)))
                .annotate(
                    ctcwoo_count_positive=Count(
                        "id", filter=Q(type=CTCWOO) & Q(result__gte=RES_POSITIVE)
                    )
                )
                .annotate(maect_count=Count("id", filter=Q(type=MAECT)))
                .annotate(
                    maect_count_positive=Count(
                        "id", filter=Q(type=MAECT) & Q(result__gte=RES_POSITIVE)
                    )
                )
                .annotate(pl_count=Count("id", filter=Q(type=PL)))
                .annotate(
                    pl_count_positive=Count(
                        "id", filter=Q(type=PL) & Q(result__gte=RES_POSITIVE)
                    )
                )
                .annotate(
                    pl_count_stage1=Count(
                        "id", filter=Q(type=PL) & Q(form__test_pl_result="stage1")
                    )
                )
                .annotate(
                    pl_count_stage2=Count(
                        "id", filter=Q(type=PL) & Q(form__test_pl_result="stage2")
                    )
                )
                .annotate(
                    confirmation_count=Count(
                        "id", filter=Q(type__in=TYPES_CONFIRMATION)
                    )
                )
                .annotate(
                    positive_catt_count=Count(
                        "id", filter=Q(type=CATT) & Q(result__gte=RES_POSITIVE)
                    )
                )
                .annotate(
                    positive_rdt_count=Count(
                        "id", filter=Q(type=RDT) & Q(result__gte=RES_POSITIVE)
                    )
                )
                .annotate(
                    positive_screening_test_count=Count(
                        "id",
                        filter=(Q(type=RDT) & Q(result__gte=RES_POSITIVE))
                        | (Q(type=CATT) & Q(result__gte=RES_POSITIVE)),
                    )
                )
                .annotate(
                    positive_confirmation_test_count=Count(
                        "id",
                        filter=(
                            Q(type__in=TYPES_CONFIRMATION) & Q(result__gte=RES_POSITIVE)
                        ),
                    )
                )
                .annotate(first_test_date=Min("date"))
                .annotate(last_test_date=Max("date"))
                .annotate(total_population=DistinctSum("village__population"))
            )

            if grouping == "month" or grouping == "year":
                values = (
                    "date",
                    "confirmation_count",
                    "positive_catt_count",
                    "positive_rdt_count",
                    "positive_screening_test_count",
                    "pl_count_stage1",
                    "pl_count_stage2",
                    "positive_confirmation_test_count",
                    "pg_count_positive",
                    "ctcwoo_count_positive",
                    "maect_count_positive",
                    "pl_count_positive",
                )
                orders = ("date",)
            elif grouping == "villageday":
                grouped_queryset = grouped_queryset.annotate(
                    village__name=Coalesce(
                        Cast("village__name", TextField()), "form__village"
                    )
                )
                values = (
                    "village__name",
                    "village__id",
                    "village__latitude",
                    "village__longitude",
                    "date",
                    "positive_screening_test_count",
                    "positive_confirmation_test_count",
                    "pl_count_stage1",
                    "pl_count_stage2",
                    "confirmation_count",
                    "screening_count",
                )
                # order = "date",
            elif grouping == "village":
                grouped_queryset = grouped_queryset.annotate(
                    village__name=Coalesce(
                        Cast("village__name", TextField()), "form__village"
                    )
                )
                values = (
                    "village__name",
                    "village__id",
                    "village__AS_id",
                    "village__AS__name",
                    "village__AS__ZS_id",
                    "village__AS__ZS__name",
                    "village__AS__ZS__province_id",
                    "village__AS__ZS__province__name",
                    "positive_screening_test_count",
                    "positive_confirmation_test_count",
                    "pl_count_stage1",
                    "pl_count_stage2",
                    "confirmation_count",
                    "screening_count",
                    "village__population",
                    "positive_catt_count",
                    "positive_rdt_count",
                )
                orders = (Coalesce(
                        Cast("village__name", TextField()), "form__village"
                    ),)
            elif grouping == "villageyear":
                grouped_queryset = grouped_queryset.annotate(
                    village__name=Coalesce(
                        Cast("village__name", TextField()), "form__village"
                    )
                )
                values = (
                    "village__name",
                    "date",
                    "village__id",
                    "village__latitude",
                    "village__longitude",
                    "first_test_date",
                    "last_test_date",
                    "positive_confirmation_test_count",
                )
                orders = "date", "village__name"
            elif grouping == "tester":
                values = (
                    "tester_id",
                    "tester__user__last_name",
                    "tester__user__first_name",
                    "screening_count",
                    "rdt_count",
                    "catt_count",
                    "positive_catt_count",
                    "positive_rdt_count",
                    "positive_screening_test_count",
                    "confirmation_count",
                    "positive_confirmation_test_count",
                    "pl_count_positive",
                    "pl_count_stage1",
                    "pl_count_stage2",
                    "pg_count_positive",
                    "ctcwoo_count_positive",
                    "maect_count_positive",
                    "checked",
                    "checked_ok",
                    "checked_ko",
                    "checked_mismatch",
                    "checked_unreadable",
                    "checked_invalid",
                )

                if tester_type == "screener":
                    test_types = TYPES_WITH_IMAGES
                    grouped_queryset = (
                        grouped_queryset.annotate(
                            rdt_test_pictures=Count(
                                "id", filter=Q(image__isnull=False) & Q(type=RDT)
                            )
                        )
                        .annotate(
                            rdt_test_positive_pictures=Count(
                                "id",
                                filter=Q(image__isnull=False)
                                & Q(type=RDT)
                                & Q(result__gte=RES_POSITIVE),
                            )
                        )
                        .annotate(
                            rdt_test_negative_pictures=Count(
                                "id",
                                filter=Q(image__isnull=False)
                                & Q(type=RDT)
                                & Q(result__lt=RES_POSITIVE),
                            )
                        )
                        .annotate(
                            catt_test_pictures=Count(
                                "id", filter=Q(image__isnull=False) & Q(type=CATT)
                            )
                        )
                        .annotate(
                            catt_test_positive_pictures=Count(
                                "id",
                                filter=Q(image__isnull=False)
                                & Q(type=CATT)
                                & Q(result__gte=RES_POSITIVE),
                            )
                        )
                        .annotate(
                            catt_test_negative_pictures=Count(
                                "id",
                                filter=Q(image__isnull=False)
                                & Q(type=CATT)
                                & Q(result__lt=RES_POSITIVE),
                            )
                        )
                    )
                    values = values + (
                        "rdt_test_pictures",
                        "rdt_test_positive_pictures",
                        "rdt_test_negative_pictures",
                        "catt_test_pictures",
                        "catt_test_positive_pictures",
                        "catt_test_negative_pictures",
                    )
                else:
                    grouped_queryset = grouped_queryset.annotate(
                        confirmation_video_count=Count(
                            "id",
                            filter=(Q(type__in=TYPES_CONFIRMATION) & Q(video__isnull=False)),
                        )
                    ).annotate(
                        confirmation_positive_video_count=Count(
                            "id",
                            filter=(Q(type__in=TYPES_CONFIRMATION)
                            & Q(video__isnull=False)
                            & Q(result__gte=RES_POSITIVE)),
                        )
                    )

                    test_types = TYPES_CONFIRMATION
                    values = values + (
                        "confirmation_video_count",
                        "confirmation_positive_video_count",
                    )

                grouped_queryset = grouped_queryset.annotate(
                    checked=Count("check", filter=(Q(check__level=user_level) & Q(type__in=test_types)))
                ).annotate(
                    checked_ok=Count("check", filter=(Q(check__level=user_level) & Q(
                        check__result=F("result")) & Q(type__in=test_types)))
                ).annotate(
                    checked_ko=Count("check",
                                     filter=(Q(check__level=user_level) & ~Q(check__result=F("result")) & Q(
                                         type__in=test_types)))
                ).annotate(
                    checked_mismatch=Count("check",
                                           filter=(Q(check__level=user_level) &
                                                   (
                                                           (Q(check__result=RES_NEGATIVE) & Q(
                                                               result__gte=RES_POSITIVE)) |
                                                           (Q(check__result__gte=RES_POSITIVE) & Q(
                                                               result=RES_NEGATIVE))
                                                   ) &
                                                   Q(type__in=test_types)))
                ).annotate(
                    checked_unreadable=Count("check",
                                             filter=(Q(check__level__lte=user_level) & Q(
                                                 check__result=RES_UNREADABLE) & Q(
                                                 type__in=test_types)))
                ).annotate(
                    checked_invalid=Count("check",
                                          filter=(Q(check__level__lte=user_level) &
                                                  (
                                                          Q(check__result=RES_MISSING) |
                                                          Q(check__result=RES_ABSENT) |
                                                          Q(check__result=RES_UNSURE) |
                                                          Q(check__result=RES_INVALID)
                                                  ) &
                                                  Q(type__in=test_types)))
                )
                orders = ("tester__user__last_name",)

            values = values + (
                "test_count",
                "catt_count",
                "rdt_count",
                "pg_count",
                "ctcwoo_count",
            )
            values = values + ("maect_count", "pl_count", "total_population")

            grouped_queryset = grouped_queryset.values(*values).order_by(*orders)

            # To compute the positive confirmation tests, one first needs to group by form/patient and then annotate tst
            case_queryset = (
                queryset.values("form__id")
                .annotate(
                    confirmation_tests=Count(
                        "id", filter=Q(type__in=TYPES_CONFIRMATION)
                    )
                )
                .annotate(
                    confirmation_tests_positive=Count(
                        "id",
                        filter=Q(type__in=TYPES_CONFIRMATION)
                        & Q(result__gte=RES_POSITIVE),
                    )
                )
                .annotate(catt_tests=Count("id", filter=Q(type=CATT)))
                .annotate(
                    catt_tests_positive=Count(
                        "id", filter=Q(type=CATT) & Q(result__gte=RES_POSITIVE)
                    )
                )
                .annotate(rdt_tests=Count("id", filter=Q(type=RDT)))
                .annotate(
                    rdt_tests_positive=Count(
                        "id", filter=Q(type=RDT) & Q(result__gte=RES_POSITIVE)
                    )
                )
                .annotate(pg_tests=Count("id", filter=Q(type=PG)))
                .annotate(ctc_tests=Count("id", filter=Q(type=CTCWOO)))
                .annotate(maect_tests=Count("id", filter=Q(type=MAECT)))
                .annotate(pl_tests=Count("id", filter=Q(type=PL)))
                .annotate(
                    pl_stage1=Count(
                        "id", filter=Q(type=PL) & Q(form__test_pl_result="stage1")
                    )
                )
                .annotate(
                    pl_stage2=Count(
                        "id", filter=Q(type=PL) & Q(form__test_pl_result="stage2")
                    )
                )
            )

            total_queryset = case_queryset.aggregate(
                total_count=Count("*"),
                total_confirmation_tests=Count(
                    "id", filter=Q(type__in=TYPES_CONFIRMATION)
                ),
                total_confirmation_tests_positive=Count(
                    "confirmation_tests_positive",
                    filter=Q(confirmation_tests_positive__gt=0),
                ),
                total_catt=Count("catt_tests", filter=Q(catt_tests__gt=0)),
                total_catt_positive=Count(
                    "catt_tests", filter=Q(catt_tests_positive__gt=0)
                ),
                total_rdt=Count("rdt_tests", filter=Q(rdt_tests__gt=0)),
                total_rdt_positive=Count(
                    "rdt_tests", filter=Q(rdt_tests_positive__gt=0)
                ),
                total_pg=Count("pg_tests", filter=Q(pg_tests__gt=0)),
                total_ctc=Count("ctc_tests", filter=Q(ctc_tests__gt=0)),
                total_maect=Count("maect_tests", filter=Q(maect_tests__gt=0)),
                total_pl=Count("pl_tests", filter=Q(pl_tests__gt=0)),
                total_pl_stage1=Count("pl_tests", filter=Q(pl_stage1__gt=0)),
                total_pl_stage2=Count("pl_tests", filter=Q(pl_stage2__gt=0)),
            )
            result = {"result": grouped_queryset, "total": total_queryset}
            cache.set(absolute_url, result, 30 * 60)
        # end of data fetch if not in cache

        if xlsx_format is not None:
            response = HttpResponse(
                generate_report(grouping, result["result"], result["total"]),
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            filename = f"TrypelimStats_{grouping}_{from_date}-{to_date}_{str(datetime.today())[:10]}.xlsx"
            response['Content-Disposition'] = f"attachment; filename={filename}"
            return response
        else:
            return Response(result)
