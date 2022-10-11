import logging
from typing import Union

from django.conf import settings
from django.contrib.auth.models import User, AnonymousUser
from django.contrib.sites.shortcuts import get_current_site
from django.core.exceptions import ValidationError
from django.core.mail import EmailMultiAlternatives
from django.db import models
from django.template import Engine, TemplateSyntaxError, Context
from django.utils.translation import ugettext_lazy as _

from hat.api.token_authentication import generate_auto_authentication_link
from iaso.models.microplanning import Team
from iaso.utils.models.soft_deletable import SoftDeletableModel
from plugins.polio.budget.workflow import next_transitions, get_workflow, can_user_transition


class BudgetStepQuerySet(models.QuerySet):
    def filter_for_user(self, user: Union[User, AnonymousUser]):
        from plugins.polio.models import Campaign

        campaigns = Campaign.objects.filter_for_user(user)  # type: ignore
        return self.filter(campaign__in=campaigns)


# workaround for MyPy
BudgetManager = models.Manager.from_queryset(BudgetStepQuerySet)


class BudgetStep(SoftDeletableModel):
    class Meta:
        ordering = ["updated_at"]

    objects = BudgetManager()
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

    def __str__(self):
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


DEFAUL_MAIL_TEMPLATE = """{% extends "base_budget_email.html" %}
{% block text %}
{{ block.super }} 
{% endblock %}"""


class MailTemplate(models.Model):
    slug = models.SlugField(unique=True)
    subject_template = models.TextField(
        validators=[validator_template],
        help_text="Template for the Email subject, use the Django Template language, "
        "see https://docs.djangoproject.com/en/4.1/ref/templates/language/ for reference. Please keep it as one line.",
        default="{{author_name}} updated the the budget  for campaign {{campaign.obr_name}}",
    )
    html_template = models.TextField(
        validators=[validator_template],
        help_text="HTML Template for the Email body, use the Django Template language, "
        "see https://docs.djangoproject.com/en/4.1/ref/templates/language/ for reference",
    )
    text_template = models.TextField(
        validators=[validator_template],
        help_text="Plain text Template for the Email body, use the Django Template language, "
        "see https://docs.djangoproject.com/en/4.1/ref/templates/language/ for reference",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return str(self.slug)

    def render_for_step(self, step: BudgetStep, receiver: User, request=None) -> EmailMultiAlternatives:
        site = get_current_site(request)
        base_url = "https://" if settings.SSL_ON else "http://"
        base_url += site.domain

        campaign = step.campaign
        campaign_url = (
            f"{base_url}/dashboard/polio/budget/details/campaignId/{campaign.id}/campaignName/{campaign.obr_name}"
        )

        workflow = get_workflow()
        transitions = next_transitions(workflow.transitions, campaign.budget_current_state_key)

        buttons = []
        for transition in transitions:
            transition_url_template = "/quickTransition/{transition_key}/previousStep/{step_id}"
            button_url = campaign_url + transition_url_template.format(transition_key=transition.key, step_id=step.id)
            # link that will auto auth

            buttons.append(
                {
                    "base_url": button_url,
                    "url": generate_auto_authentication_link(button_url, receiver),
                    "label": transition.label,
                    "color": transition.color,
                    "allowed": can_user_transition(transition, receiver),
                }
            )
        transition = workflow.get_transition_by_key(step.transition_key)
        context = Context(
            {
                "author": step.created_by,
                "author_name": step.created_by.get_full_name() or step.created_by.username,
                "buttons": buttons,
                "transition": transition,
                "team": step.created_by_team,
                "step": step,
                "campaign": campaign,
                "budget_link": campaign_url,
                "site_url": base_url,
                "site_name": site.name,
                "comment": step.comment,
                "amount": step.amount,
                "files": step.files.all(),
                "links": step.links.all(),
            }
        )
        DEFAULT_HTML_TEMPLATE = '{% extends "base_budget_email.html" %}'
        DEFAULT_TEXT_TEMPLATE = '{% extends "base_budget_email.html" %}'
        html_template = Engine.get_default().from_string(self.html_template or DEFAULT_HTML_TEMPLATE)
        html_content = html_template.render(context)
        text_template = Engine.get_default().from_string(self.text_template or DEFAULT_TEXT_TEMPLATE)
        text_content = text_template.render(context).strip()
        subject_template = Engine.get_default().from_string(self.subject_template)
        subject_content = subject_template.render(context)

        msg = EmailMultiAlternatives(subject_content, text_content, settings.DEFAULT_FROM_EMAIL, [receiver.email])
        msg.attach_alternative(html_content, "text/html")
        return msg


logger = logging.getLogger(__name__)


def send_budget_mails(step: BudgetStep, transition, request) -> None:
    for email_to_send in transition.emails_to_send:
        template_id, team_ids = email_to_send
        try:
            mt = MailTemplate.objects.get(template_id)
        except MailTemplate.DoesNotExist as e:
            logger.exception(e)
            continue

        teams = Team.objects(ids_in=team_ids)
        # Ensure we don't send an email twice to the same user
        users = User.objects.filter(teams__in=teams).distinct()
        for user in users:
            if not user.email:
                logger.info(f"skip sending email for {step}, user {user} doesn't have an email address configured")
                continue

            msg = mt.render_for_step(step, user, request)
            logger.debug("sending", msg)
            msg.send(fail_silently=False)
