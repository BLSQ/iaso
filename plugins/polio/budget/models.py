from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField, CITextField
from django.db import models


class BudgetStepQuerySet(models.QuerySet):
    def filter_for_user(self, user: User):
        from plugins.polio.models import Campaign

        campaigns = Campaign.objects.filter_for_user(user)
        return self.filter(campaign__in=campaigns)


class BudgetStep(models.Model):
    objects = BudgetStepQuerySet.as_manager()
    campaign = models.ForeignKey("Campaign", on_delete=models.PROTECT, related_name="budget_steps")
    transition_key = models.CharField(max_length=30)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey("auth.User", on_delete=models.PROTECT)
    updated_at = models.DateTimeField(auto_now=True)
    # Keep trace of the Team the user was acting on behalf of in case they get remove from it.
    created_by_team = models.ForeignKey("iaso.Team", on_delete=models.PROTECT, blank=True, null=True)
    # file via Foreign keys
    comment = models.TextField(blank=True, null=True)
    links = ArrayField(CITextField(max_length=255, blank=True), size=100, null=True, blank=True)
    amount = models.DecimalField(blank=True, null=True, decimal_places=2, max_digits=14)
    is_email_sent = models.BooleanField(default=False)

    def __repr__(self):
        return f"{self.campaign}, {self.transition_key}"


class BudgetStepFile(models.Model):
    step = models.ForeignKey(BudgetStep, on_delete=models.PROTECT, related_name="files")
    file = models.FileField()
    # to keep original file name
    filename = models.CharField(blank=True, null=True, max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Budget Step File"
        verbose_name_plural = "Budget Step Files"

    def __repr__(self):
        return f"{self.step}, {self.file.name}"
