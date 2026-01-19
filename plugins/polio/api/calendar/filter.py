import datetime

from logging import getLogger

from django.db.models import Q
from rest_framework import filters

from plugins.polio.api.campaigns.filters.filters import CampaignFilterV2


logger = getLogger(__name__)

QUARTER_DELTA = datetime.timedelta(weeks=8)  # (3*4)/2)+2
SEMESTER_DELTA = datetime.timedelta(weeks=14)  # ((6*4)/2)+2
YEAR_DELTA = datetime.timedelta(weeks=26)  # ((12*4)/2)+2

QUARTER = "quarter"
SEMESTER = "semester"
YEAR = "year"


class CalendarPeriodFilterBackend(filters.BaseFilterBackend):
    @staticmethod
    def get_reference_dates(reference_date, period_type):
        # calculate the timeframe to use to filter the campaigns.
        # reference date is "in the middle", so we use period_type/2 (in weeks) + 2 weeks margin of error to make sure the calendar has all data
        delta = QUARTER_DELTA
        if period_type == SEMESTER:
            delta = SEMESTER_DELTA
        if period_type == YEAR:
            delta = YEAR_DELTA
        ref_start_date = reference_date - delta
        ref_end_date = reference_date + delta
        return ref_start_date, ref_end_date

    def filter_queryset(self, request, queryset, view):
        reference_date = request.query_params.get("reference_date", None)
        period_type = request.query_params.get("period_type", QUARTER)

        try:
            reference_date = (
                datetime.datetime.strptime(reference_date, "%Y-%m-%d").date()
                if reference_date
                else datetime.datetime.now().date()
            )
        except Exception:
            logger.warning("Error parsing reference date, defaulting to current date")
            reference_date = datetime.datetime.now()
        if period_type not in [QUARTER, SEMESTER, YEAR]:
            logger.warning(f"Invalid period type: {period_type}, defaulting to {QUARTER}")
            period_type = QUARTER

        ref_start_date, ref_end_date = self.get_reference_dates(reference_date, period_type)
        queryset = queryset.filter(
            Q(rounds__started_at__gte=ref_start_date, rounds__started_at__lte=ref_end_date)
            | Q(rounds__ended_at__gte=ref_start_date, rounds__ended_at__lte=ref_end_date)
        ).distinct()
        return queryset


class CalendarFilter(CampaignFilterV2):
    pass
