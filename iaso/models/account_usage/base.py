from dateutil.relativedelta import relativedelta
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from iaso.models import Account
from iaso.models.common import CreatedAndUpdatedModel


class PeriodTypeChoices(models.TextChoices):
    DAY = "DAY", _("Day")
    WEEK = "WEEK", _("Week")
    MONTH = "MONTH", _("Month")
    YEAR = "YEAR", _("Year")
    ALL_TIME = "ALL_TIME", _("All Time")


class MetricTypeChoices(models.TextChoices):
    SUBMISSION = "SUBMISSION", _("Submission")
    DISK_SPACE = "DISK_SPACE", _("Disk Space")
    PROJECT = "PROJECT", _("Project")
    USER = "USER", _("User")


class AccountUsage(CreatedAndUpdatedModel):
    metric_type = None

    default_period_type = PeriodTypeChoices.MONTH

    period_type = models.CharField(choices=PeriodTypeChoices.choices)

    period_starts_at = models.DateTimeField(null=True, blank=True)

    account = models.ForeignKey(Account, on_delete=models.CASCADE)

    metric = models.CharField(choices=MetricTypeChoices.choices, null=False, blank=False)
    usage = models.PositiveBigIntegerField(default=0)

    class Meta:
        unique_together = ("account", "metric", "period_type", "period_starts_at")

    @classmethod
    def get_period_ends_at(cls, period_starts_at, period_type=None):
        if not period_type:
            period_type = cls.default_period_type

        return cls(period_type=period_type, period_starts_at=period_starts_at).period_ends_at

    @property
    def period_ends_at(self):
        if self.period_type == PeriodTypeChoices.ALL_TIME:
            return None

        if self.period_type == PeriodTypeChoices.YEAR:
            return self.period_starts_at + relativedelta(years=1)

        if self.period_type == PeriodTypeChoices.MONTH:
            return self.period_starts_at + relativedelta(months=1)

        if self.period_type == PeriodTypeChoices.WEEK:
            return self.period_starts_at + relativedelta(weeks=1)

        if self.period_type == PeriodTypeChoices.DAY:
            return self.period_starts_at + relativedelta(days=1)

        raise NotImplementedError

    def clean(self):
        if self.period_type != PeriodTypeChoices.ALL_TIME and not self.period_starts_at:
            raise ValidationError(_("A start period date must be provided in case of %s quota") % (self.period_type))

    def save(self, *args, **kwargs):
        if self.metric != self.metric_type and self.metric_type:
            self.metric = self.metric_type
        if not self.period_type and self.default_period_type:
            self.period_type = self.default_period_type
        super().save(*args, **kwargs)
