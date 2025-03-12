import logging

from functools import reduce
from typing import Union

from django.conf import settings
from django.contrib.auth.models import AnonymousUser, User
from django.contrib.sites.shortcuts import get_current_site
from django.core.exceptions import ValidationError
from django.core.mail import EmailMultiAlternatives
from django.db import models
from django.template import Context, Engine, TemplateSyntaxError
from django.urls import reverse
from django.utils.translation import gettext_lazy as _

from hat.api.token_authentication import generate_auto_authentication_link
from iaso.utils.models.soft_deletable import SoftDeletableModel
from plugins.polio.budget import workflow
from plugins.polio.budget.workflow import Category, Node, Transition, Workflow, can_user_transition, next_transitions
from plugins.polio.models import PAYMENT, Campaign
from plugins.polio.time_cache import time_cache


class BudgetStepQuerySet(models.QuerySet):
    def filter_for_user(self, user: Union[User, AnonymousUser]):
        campaigns = Campaign.objects.filter_for_user(user)  # type: ignore
        return self.filter(budget_process__rounds__campaign__in=campaigns).distinct()


# workaround for MyPy
# noinspection PyTypeChecker
BudgetManager = models.Manager.from_queryset(BudgetStepQuerySet)


# source : https://stackoverflow.com/questions/29034721/check-if-model-field-exists-in-django
def model_field_exists(campaign, field):
    campaign_fields = dir(campaign)
    return True if field in campaign_fields else False


class BudgetProcess(SoftDeletableModel):
    """
    A `Budget Process` for a `Round` of a `Campaign`.

    DB relationships:

    +---------------+      +---------------+      +----------+
    | BudgetStep(s) |  ->  | BudgetProcess |  <-  | Round(s) |
    +---------------+      +---------------+      +----------+
    """

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey("auth.User", on_delete=models.PROTECT)
    updated_at = models.DateTimeField(auto_now=True)

    status = models.CharField(max_length=100, null=True, blank=True)
    current_state_key = models.CharField(max_length=100, default="-")
    current_state_label = models.CharField(max_length=100, blank=True)

    # Budget tab.
    # These fields can be either filled manually or via the budget workflow when a step is done.
    ra_completed_at_WFEDITABLE = models.DateField(null=True, blank=True)
    who_sent_budget_at_WFEDITABLE = models.DateField(null=True, blank=True)
    unicef_sent_budget_at_WFEDITABLE = models.DateField(null=True, blank=True)
    gpei_consolidated_budgets_at_WFEDITABLE = models.DateField(null=True, blank=True)
    submitted_to_rrt_at_WFEDITABLE = models.DateField(null=True, blank=True)
    feedback_sent_to_gpei_at_WFEDITABLE = models.DateField(null=True, blank=True)
    re_submitted_to_rrt_at_WFEDITABLE = models.DateField(null=True, blank=True)
    submitted_to_orpg_operations1_at_WFEDITABLE = models.DateField(null=True, blank=True)
    feedback_sent_to_rrt1_at_WFEDITABLE = models.DateField(null=True, blank=True)
    re_submitted_to_orpg_operations1_at_WFEDITABLE = models.DateField(null=True, blank=True)
    submitted_to_orpg_wider_at_WFEDITABLE = models.DateField(null=True, blank=True)
    submitted_to_orpg_operations2_at_WFEDITABLE = models.DateField(null=True, blank=True)
    feedback_sent_to_rrt2_at_WFEDITABLE = models.DateField(null=True, blank=True)
    re_submitted_to_orpg_operations2_at_WFEDITABLE = models.DateField(null=True, blank=True)
    submitted_for_approval_at_WFEDITABLE = models.DateField(null=True, blank=True)
    feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE = models.DateField(null=True, blank=True)
    feedback_sent_to_orpg_operations_who_at_WFEDITABLE = models.DateField(null=True, blank=True)
    approved_by_who_at_WFEDITABLE = models.DateField(null=True, blank=True)
    approved_by_unicef_at_WFEDITABLE = models.DateField(null=True, blank=True)
    approved_at_WFEDITABLE = models.DateField(null=True, blank=True)
    approval_confirmed_at_WFEDITABLE = models.DateField(null=True, blank=True)
    payment_mode = models.CharField(max_length=30, choices=PAYMENT, blank=True)
    district_count = models.IntegerField(null=True, blank=True)

    # Fund release part of the budget form. Will be migrated to workflow fields later.
    who_disbursed_to_co_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Disbursed to CO (WHO)"),
    )
    who_disbursed_to_moh_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Disbursed to MOH (WHO)"),
    )
    unicef_disbursed_to_co_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Disbursed to CO (UNICEF)"),
    )
    unicef_disbursed_to_moh_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Disbursed to MOH (UNICEF)"),
    )

    no_regret_fund_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Budget Process"
        verbose_name_plural = "Budget Processes"

    def __str__(self):
        return f"{self.pk} - {self.status}"


class BudgetStep(SoftDeletableModel):
    class Meta:
        ordering = ["-updated_at"]

    objects = BudgetManager()
    # `campaign` could have been removed while implementing "Multi Rounds Budget"
    # because of the new models relationships, but it's heavily used and saves a lot of queries.
    campaign = models.ForeignKey("Campaign", on_delete=models.PROTECT, related_name="budget_steps", null=True)
    budget_process = models.ForeignKey(
        "BudgetProcess", on_delete=models.PROTECT, related_name="budget_steps", null=True
    )
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


# this validator is here to show a proper error in the Django admin if the template is invalid
def validator_template(value: str):
    try:
        # this will raise an error if the template cannot be parsed
        Engine.get_default().from_string(value)
    except TemplateSyntaxError as e:
        raise ValidationError(_("Error in template: %(error)s"), code="invalid_template", params={"error": str(e)})


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

    def render_for_step(self, budget_step: BudgetStep, receiver: User, request=None) -> EmailMultiAlternatives:
        site = get_current_site(request)
        protocol = "https://" if settings.SSL_ON else "http://"
        base_url = f"{protocol}{site.domain}"

        budget_process_url = (
            f"{base_url}/dashboard/polio/budget/details"
            f"/campaignName/{budget_step.campaign.obr_name}"
            f"/budgetProcessId/{budget_step.budget_process_id}"
        )
        self_auth_budget_process_url = generate_auto_authentication_link(budget_process_url, receiver)

        workflow = get_workflow()
        transitions = next_transitions(workflow.transitions, budget_step.budget_process.current_state_key)
        # filter out repeat steps. I do it here so it's easy to remove
        filtered_transitions = [transition for transition in transitions if "repeat" not in transition.key.split("_")]

        buttons = []
        for transition in filtered_transitions:
            transition_url_template = "/quickTransition/{transition_key}/previousStep/{step_id}"
            button_url = budget_process_url + transition_url_template.format(
                transition_key=transition.key, step_id=budget_step.id
            )
            # link that will auto auth

            buttons.append(
                {
                    "base_url": button_url,
                    "url": generate_auto_authentication_link(button_url, receiver),
                    "label": transition.label,
                    "color": transition.color if transition.color != "primary" else "black",
                    "allowed": can_user_transition(transition, receiver, budget_step.campaign),
                }
            )
        # buttons is never empty, so the text accompanying the buttons in the email would always show, even when no buttons are displayed
        # So we check if there are allowed buttons
        show_buttons = list(filter(lambda x: x["allowed"], buttons))
        transition = workflow.get_transition_by_key(budget_step.transition_key)
        if transition.key != "override":
            node = workflow.get_node_by_key(transition.to_node)
        else:
            node_key = request.data["new_state_key"].split(",")[0]
            node = workflow.get_node_by_key(node_key)

        attachments = []
        skipped_attachements = 0
        override = budget_step.transition_key == "override"
        total_file_size = 0
        if len(list(budget_step.files.all())) > 0:
            total_file_size = reduce(
                lambda file1, file2: file1 + file2, list(map(lambda f: f.file.size, list(budget_step.files.all())))
            )

        msg = EmailMultiAlternatives(from_email=settings.DEFAULT_FROM_EMAIL, to=[receiver.email])

        for f in budget_step.files.all():
            # only attach files if total is less than 5MB
            if total_file_size < 1024 * 5000:
                msg.attach(f.filename, f.file.read())
            else:
                skipped_attachements = len(list(budget_step.files.all()))
                file_url = base_url + f.get_absolute_url()
                attachments.append({"url": generate_auto_authentication_link(file_url, receiver), "name": f.filename})
        for l in budget_step.links.all():
            attachments.append({"url": l.url, "name": l.alias})

        context = Context(
            {
                "amount": budget_step.amount,
                "attachments": attachments,
                "author": budget_step.created_by,
                "author_name": budget_step.created_by.get_full_name() or budget_step.created_by.username,
                "budget_url": self_auth_budget_process_url,
                "buttons": buttons if show_buttons else None,
                "campaign": budget_step.campaign,
                "comment": budget_step.comment,
                "files": budget_step.files.all(),
                "links": budget_step.links.all(),
                "node": node,
                "override": override,
                "rounds": budget_step.budget_process.rounds.all(),
                "site_name": site.name,
                "site_url": base_url,
                "skipped_attachments": skipped_attachements,
                "step": budget_step,
                "team": budget_step.created_by_team,
                "transition": transition,
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

        # Context is returned for usage in tests.
        return (context, msg)


logger = logging.getLogger(__name__)


def send_budget_mails(budget_step: BudgetStep, transition, request) -> None:
    for email_to_send in transition.emails_to_send:
        template_slug, team_ids = email_to_send
        try:
            mt = MailTemplate.objects.get(slug=template_slug)
        except MailTemplate.DoesNotExist as e:
            logger.exception(e)
            continue
        teams = workflow.effective_teams(budget_step.campaign, team_ids)
        # Ensure we don't send an email twice to the same user
        users = User.objects.filter(teams__in=teams).distinct()
        for user in users:
            if not user.email:
                logger.info(
                    f"skip sending email for {budget_step}, user {user} doesn't have an email address configured"
                )
                continue

            _, msg = mt.render_for_step(budget_step, user, request)
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
