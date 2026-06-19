from iaso.models.account_usage.base import AccountUsage, MetricTypeChoices, PeriodTypeChoices
from iaso.models.account_usage.manager import ProxyAccountUsageManager


class SubmissionAccountUsage(AccountUsage):
    """
    Model that's just there for dev purpose, to make it easier to query / increment
    """

    metric_type = MetricTypeChoices.SUBMISSION
    objects = ProxyAccountUsageManager()

    class Meta:
        proxy = True


class ProjectAccountUsage(AccountUsage):
    """
    Model that's just there for dev purpose, to make it easier to query / increment
    """

    default_period_type = PeriodTypeChoices.ALL_TIME
    metric_type = MetricTypeChoices.PROJECT
    objects = ProxyAccountUsageManager()

    class Meta:
        proxy = True

    def save(self, *args, **kwargs):
        from iaso.models import Project

        self.usage = Project.objects.filter(account=self.account).count()
        super().save(*args, **kwargs)


class UserAccountUsage(AccountUsage):
    """
    Model that's just there for dev purpose, to make it easier to query / increment
    """

    default_period_type = PeriodTypeChoices.ALL_TIME
    metric_type = MetricTypeChoices.USER
    objects = ProxyAccountUsageManager()

    class Meta:
        proxy = True

    def save(self, *args, **kwargs):
        from iaso.models import Profile

        self.usage = Profile.objects.filter(account=self.account).count()
        super().save(*args, **kwargs)
