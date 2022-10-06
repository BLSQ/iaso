from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models
from django.template import Engine, TemplateSyntaxError
from django.template.backends import django
from django.utils.translation import ugettext_lazy as _

from iaso.utils.models.soft_deletable import SoftDeletableModel


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
        return f"{self.step}, {self.filename}"


class BudgetStepLink(SoftDeletableModel):
    step = models.ForeignKey(BudgetStep, on_delete=models.PROTECT, related_name="links")
    # to keep original file name
    url = models.CharField(max_length=500)
    alias = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Budget Step Link"
        verbose_name_plural = "Budget Step Link"

    def __repr__(self):
        return f"{self.step}, {self.alias}"


# this validator is here to show a proper error in the Django admin if the template is invalid
def validator_template(value: str):

    try:
        # this will raise an error if the template cannot be parsed
        template = Engine.get_default().from_string(value)
    except TemplateSyntaxError as e:
        raise ValidationError(_("Error in template: %(error)s"), code="invalid_template", params={"error": str(e)})


class MailTemplate(models.Model):
    slug = models.SlugField(unique=True)
    template_subject = models.TextField(
        validators=[validator_template],
        help_text="Template for the Email subject, use the Django Template language, "
        "see https://docs.djangoproject.com/en/4.1/ref/templates/language/ for reference. Please keep it as one line.",
    )
    template = models.TextField(
        validators=[validator_template],
        help_text="Template for the Email body, use the Django Template language, "
        "see https://docs.djangoproject.com/en/4.1/ref/templates/language/ for reference",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return str(self.slug)
