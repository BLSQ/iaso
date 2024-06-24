import datetime

from django.contrib.auth.models import User
from django.db import models
from django.utils.functional import cached_property
from django.utils.translation import gettext as _

from iaso.models import Account
from iaso.utils.models.soft_deletable import SoftDeletableModel
from plugins.polio.models import Round


class Period(models.TextChoices):
    BEFORE = "BEFORE", _("Before")
    DURING = "DURING", _("During")
    AFTER = "AFTER", _("After")


class ChronogramQuerySet(models.QuerySet):
    def valid(self):
        return self.filter(deleted_at__isnull=True)  # Hide soft deleted items.


class Chronogram(SoftDeletableModel):
    """
    A chronogram can be thought as a to-do list.
    """

    round = models.OneToOneField(Round, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    created_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="created_chronograms"
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="updated_chronograms"
    )

    objects = models.Manager.from_queryset(ChronogramQuerySet)()

    class Meta:
        verbose_name = _("Chronogram")

    def __str__(self) -> str:
        return f"{self.id} - {self.round.campaign.obr_name} - Round {self.round.number}"


class ChronogramTaskQuerySet(models.QuerySet):
    def valid(self):
        return self.filter(deleted_at__isnull=True)  # Hide soft deleted items.


class ChronogramTask(SoftDeletableModel):
    """
    A chronogram task can be thought as a to-do list item.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", _("Pending")
        IN_PROGRESS = "IN_PROGRESS", _("In progress")
        DONE = "DONE", _("Done")
        NA = "N/A", _("N/A")

    chronogram = models.ForeignKey(Chronogram, on_delete=models.CASCADE, related_name="tasks")
    period = models.CharField(max_length=15, choices=Period.choices, default=Period.BEFORE)
    description = models.TextField(max_length=300)
    start_offset_in_days = models.IntegerField(default=0)
    deadline_date = models.DateField(db_index=True, null=True)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    user_in_charge = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="chronogram_tasks"
    )
    comment = models.TextField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    created_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="created_chronogram_tasks"
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="updated_chronogram_tasks"
    )

    objects = models.Manager.from_queryset(ChronogramTaskQuerySet)()

    class Meta:
        verbose_name = _("Chronogram Task")

    def __str__(self) -> str:
        return f"{self.id} - {self.status}"

    @cached_property
    def round_start_date(self) -> datetime.date:
        return self.chronogram.round.started_at

    @property
    def start_date(self) -> datetime.date:
        return (self.round_start_date + datetime.timedelta(days=self.start_offset_in_days)).date()

    @property
    def is_delayed(self) -> bool:
        if self.deadline_date:
            return datetime.date.today() > self.deadline_date and self.status != self.Status.DONE
        return False


class ChronogramTemplateQuerySet(models.QuerySet):
    def valid(self):
        return self.filter(deleted_at__isnull=True)  # Hide soft deleted items.


class ChronogramTemplateManager(models.Manager):
    def create_chronogram(self, round: Round, account: Account, created_by: User) -> Chronogram:
        chronogram_templates = self.model.objects.filter(account=account)

        if not chronogram_templates.exists():
            raise ValueError(f"No chronogram template for account #{account.id}")

        chronogram = Chronogram.objects.create(round=round, created_by=created_by)

        tasks = [
            ChronogramTask(
                chronogram=chronogram,
                created_by=created_by,
                description=template.description,
                period=template.period,
                start_offset_in_days=template.start_offset_in_days,
            )
            for template in chronogram_templates
        ]
        ChronogramTask.objects.bulk_create(tasks)

        return chronogram


class ChronogramTemplate(SoftDeletableModel):
    """
    Template tasks used by default to create a chronogram.
    """

    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    period = models.CharField(max_length=15, choices=Period.choices, default=Period.BEFORE)
    description = models.TextField(max_length=300)
    start_offset_in_days = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    created_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="created_chronogram_templates"
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="updated_chronogram_templates"
    )

    objects = ChronogramTemplateManager.from_queryset(ChronogramTemplateQuerySet)()

    class Meta:
        verbose_name = _("Chronogram Template")

    def __str__(self) -> str:
        return f"{self.id} - {self.account.name}"
