from functools import reduce
import logging
from typing import Union

from django.conf import settings
from django.contrib.auth.models import User, AnonymousUser
from django.contrib.sites.shortcuts import get_current_site
from django.core.exceptions import ValidationError
from django.core.mail import EmailMultiAlternatives
from django.db import models
from django.template import Engine, TemplateSyntaxError, Context
from django.urls import reverse
from django.utils.translation import gettext_lazy as _

from hat.api.token_authentication import generate_auto_authentication_link
from iaso.models import Team
from iaso.utils.models.soft_deletable import SoftDeletableModel
from plugins.polio.budget import workflow
from plugins.polio.budget.workflow import next_transitions, can_user_transition, Transition, Node, Workflow, Category
from plugins.polio.models import Round, Campaign
from plugins.polio.time_cache import time_cache


class BudgetStepQuerySet(models.QuerySet):
    def filter_for_user(self, user: Union[User, AnonymousUser]):
        campaigns = Campaign.objects.filter_for_user(user)  # type: ignore
        return self.filter(campaign__in=campaigns)


# workaround for MyPy
# noinspection PyTypeChecker
BudgetManager = models.Manager.from_queryset(BudgetStepQuerySet)


# source : https://stackoverflow.com/questions/29034721/check-if-model-field-exists-in-django
def model_field_exists(campaign, field):
    campaign_fields = dir(campaign)
    return True if field in campaign_fields else False


class BudgetStep(SoftDeletableModel):
    class Meta:
        ordering = ["-updated_at"]

    objects = BudgetManager()
    campaign = models.ForeignKey("Campaign", on_delete=models.PROTECT, related_name="budget_steps")
    transition_key = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey("auth.User", on_delete=models.PROTECT)
    updated_at = models.DateTimeField(auto_now=True)
    # Keep trace of the Team the user was acting on behalf of in case they get remove from it.
    created_by_team = models.ForeignKey("iaso.Team", on_delete=models.PROTECT, blank=True, null=True)
    # file via Foreign keys
    comment = models.TextField(blank=True, null=True)

    amount = models.DecimalField(blank=True, null=True, decimal_places=2, max_digits=14)
    is_email_sent = models.BooleanField(default=False)
    node_key_from = models.CharField(max_length=100, blank=True, null=True)
    node_key_to = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.campaign}, {self.transition_key}"


class BudgetStepFile(models.Model):
    step = models.ForeignKey(BudgetStep, on_delete=models.PROTECT, related_name="files")
    file = models.FileField()
    # to keep original file name
    filename = models.CharField(blank=True, null=True, max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_absolute_url(self):
        return reverse("BudgetStep-files", kwargs={"pk": self.step_id, "file_pk": self.id})

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


class BudgetProcess(SoftDeletableModel):
    class Meta:
        ordering = ["-updated_at"]
        verbose_name_plural = "Budget Processes"

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey("auth.User", on_delete=models.PROTECT)
    updated_at = models.DateTimeField(auto_now=True)
    # Keep trace of the Team the user was acting on behalf of in case they get remove from it.
    created_by_team = models.ForeignKey("iaso.Team", on_delete=models.PROTECT, blank=True, null=True)
    rounds = models.ManyToManyField(Round, related_name="budget_process_rounds", blank=False)
    teams = models.ManyToManyField("iaso.Team", related_name="budget_process_teams", blank=True)

    def __str__(self):
        return f"{self.rounds}-{self.created_at}"


# this validator is here to show a proper error in the Django admin if the template is invalid
def validator_template(value: str):
    try:
        # this will raise an error if the template cannot be parsed
        Engine.get_default().from_string(value)
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
        default="Budget for campaign {{campaign.obr_name}} updated to {{node.label}}",
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
        msg = EmailMultiAlternatives(from_email=settings.DEFAULT_FROM_EMAIL, to=[receiver.email])
        site = get_current_site(request)
        base_url = "https://" if settings.SSL_ON else "http://"
        base_url += site.domain  # type: ignore

        campaign = step.campaign
        campaign_url = (
            f"{base_url}/dashboard/polio/budget/details/campaignName/{campaign.obr_name}/campaignId/{campaign.id}"
        )
        self_auth_campaign_url = generate_auto_authentication_link(campaign_url, receiver)

        workflow = get_workflow()
        transitions = next_transitions(workflow.transitions, campaign.budget_current_state_key)
        # filter out repeat steps. I do it here so it's easy to remove
        filtered_transitions = [transition for transition in transitions if "repeat" not in transition.key.split("_")]

        buttons = []
        for transition in filtered_transitions:
            transition_url_template = "/quickTransition/{transition_key}/previousStep/{step_id}"
            button_url = campaign_url + transition_url_template.format(transition_key=transition.key, step_id=step.id)
            # link that will auto auth

            buttons.append(
                {
                    "base_url": button_url,
                    "url": generate_auto_authentication_link(button_url, receiver),
                    "label": transition.label,
                    "color": transition.color if transition.color != "primary" else "black",
                    "allowed": can_user_transition(transition, receiver, campaign),
                }
            )
        # buttons is never empty, so the text accompanying the buttons in the email would always show, even when no buttons are displayed
        # So we check if there are allowed buttons
        show_buttons = list(filter(lambda x: x["allowed"], buttons))
        transition = workflow.get_transition_by_key(step.transition_key)
        if transition.key != "override":
            node = workflow.get_node_by_key(transition.to_node)
        else:
            node_key = request.data["new_state_key"].split(",")[0]
            node = workflow.get_node_by_key(node_key)

        attachments = []
        skipped_attachements = 0
        override = step.transition_key == "override"
        total_file_size = 0
        if len(list(step.files.all())) > 0:
            total_file_size = reduce(
                lambda file1, file2: file1 + file2, list(map(lambda f: f.file.size, list(step.files.all())))
            )

        for f in step.files.all():
            # only attach files if total is less than 5MB
            if total_file_size < 1024 * 5000:
                msg.attach(f.filename, f.file.read())
            else:
                skipped_attachements = len(list(step.files.all()))
                file_url = base_url + f.get_absolute_url()
                attachments.append({"url": generate_auto_authentication_link(file_url, receiver), "name": f.filename})
        for l in step.links.all():
            attachments.append({"url": l.url, "name": l.alias})

        context = Context(
            {
                "author": step.created_by,
                "author_name": step.created_by.get_full_name() or step.created_by.username,
                "buttons": buttons if show_buttons else None,
                "node": node,
                "team": step.created_by_team,
                "step": step,
                "campaign": campaign,
                "budget_url": self_auth_campaign_url,
                "site_url": base_url,
                "site_name": site.name,
                "comment": step.comment,
                "amount": step.amount,
                "attachments": attachments,
                "skipped_attachments": skipped_attachements,
                "files": step.files.all(),
                "links": step.links.all(),
                "override": override,
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

        msg.subject = subject_content
        msg.body = text_content

        msg.attach_alternative(html_content, "text/html")
        return msg


logger = logging.getLogger(__name__)


def send_budget_mails(step: BudgetStep, transition, request) -> None:
    for email_to_send in transition.emails_to_send:
        template_slug, team_ids = email_to_send
        try:
            mt = MailTemplate.objects.get(slug=template_slug)
        except MailTemplate.DoesNotExist as e:
            logger.exception(e)
            continue

        teams = workflow.effective_teams(step.campaign, team_ids)
        # Ensure we don't send an email twice to the same user
        users = User.objects.filter(teams__in=teams).distinct()
        for user in users:
            if not user.email:
                logger.info(f"skip sending email for {step}, user {user} doesn't have an email address configured")
                continue

            msg = mt.render_for_step(step, user, request)
            logger.debug("sending", msg)
            msg.send(fail_silently=False)


class WorkflowModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    definition = models.JSONField()


@time_cache(60)
def get_workflow():
    workflow_model = WorkflowModel.objects.last()
    if workflow_model is None:
        return None
    transition_defs = workflow_model.definition["transitions"]
    node_defs = workflow_model.definition["nodes"]
    categories_defs = workflow_model.definition.get("categories", [])
    if not any(n["key"] == "-" for n in node_defs):
        node_defs.insert(0, {"key": "-", "label": "No budget submitted"})
    transitions = [Transition(**transition_def) for transition_def in transition_defs]
    nodes = [Node(**node_def) for node_def in node_defs]
    categories = [Category(**categories_def) for categories_def in categories_defs]
    return Workflow(transitions, nodes, categories)
