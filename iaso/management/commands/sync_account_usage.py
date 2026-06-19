import datetime

from dateutil.rrule import DAILY, MONTHLY, WEEKLY, YEARLY, rrule
from django.core.management import BaseCommand
from django.utils.timezone import now

from iaso.models import Account, Instance
from iaso.models.account_usage import MetricTypeChoices, PeriodTypeChoices
from iaso.models.account_usage.disk_usage import DiskSpaceAccountUsage
from iaso.models.account_usage.misc import ProjectAccountUsage, SubmissionAccountUsage, UserAccountUsage
from iaso.services.account_usage import AccountUsageService


BATCH_SIZE = 500

METRIC_TYPES_CHOICE_MAPPING = {
    MetricTypeChoices.SUBMISSION: SubmissionAccountUsage,
    MetricTypeChoices.DISK_SPACE: DiskSpaceAccountUsage,
    MetricTypeChoices.PROJECT: ProjectAccountUsage,
    MetricTypeChoices.USER: UserAccountUsage,
}


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("-ac", "--accounts", type=int, nargs="+", default=None, required=False)
        parser.add_argument(
            "-f",
            "--from",
            type=str,
            default=now().strftime("%Y-%m-d"),
            help="The from date to synchronize - format YYYY-MM-DD",
            required=False,
        )
        parser.add_argument("-m", "--metric_types", nargs="+", choices=MetricTypeChoices.values, required=False)

    def handle(self, *args, **options):
        queryset = Account.objects.all()

        account_ids = options["accounts"]
        metric_types = options["metric_types"] or list(METRIC_TYPES_CHOICE_MAPPING.keys())
        from_date = datetime.datetime.strptime(options["from"], "%Y-%m-%d")
        if account_ids:
            queryset = queryset.filter(id__in=account_ids)

        iterator = queryset.iterator(chunk_size=BATCH_SIZE)
        for obj in iterator:
            for metric_type in metric_types:
                metric_model = METRIC_TYPES_CHOICE_MAPPING[metric_type]
                if metric_model.default_period_type == PeriodTypeChoices.ALL_TIME:
                    AccountUsageService.increment(metric_model, obj)
                else:
                    date_range = []
                    # we need to go through all the dates and sync
                    if metric_model.default_period_type == PeriodTypeChoices.YEAR:
                        date_range = map(
                            datetime.datetime, rrule(YEARLY, dtstart=from_date, until=datetime.datetime.now())
                        )
                    elif metric_model.default_period_type == PeriodTypeChoices.MONTH:
                        date_range = rrule(MONTHLY, dtstart=from_date, until=datetime.datetime.now())

                    elif metric_model.default_period_type == PeriodTypeChoices.WEEK:
                        date_range = map(
                            datetime.datetime, rrule(WEEKLY, dtstart=from_date, until=datetime.datetime.now())
                        )
                    elif metric_model.default_period_type == PeriodTypeChoices.DAY:
                        date_range = map(
                            datetime.datetime, rrule(DAILY, dtstart=from_date, until=datetime.datetime.now())
                        )

                    if metric_type == MetricTypeChoices.SUBMISSION:
                        print(list(date_range))
                        for d in date_range:
                            AccountUsageService.increment(
                                metric_model,
                                obj,
                                0,
                                initial_queryset=Instance.objects.filter(project__account=obj),
                                now=d,
                            )
