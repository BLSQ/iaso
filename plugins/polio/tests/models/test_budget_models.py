from unittest import mock

from django.template import Context

from iaso import models as m
from iaso.test import TestCase
from plugins.polio.budget.models import BudgetProcess, BudgetStep, MailTemplate
from plugins.polio.budget.workflow import Node
from plugins.polio.models import Campaign, Round
from plugins.polio.tests.utils.budget import get_mocked_workflow


BUDGET_SUBJECT_TEMPLATE = "Budget for campaign {{campaign.obr_name}} updated to {{node.label}}"

BUDGET_HTML_TEMPLATE = """{% extends "base_budget_email.html" %}
{% block text %}
{{ block.super }} 
{% endblock %}"""

BUDGET_TEXT_TEMPLATE = """{% extends "base_budget_email.txt" %}
{% block text %}
{{ block.super }} 
{% endblock %}"""


SUBMITTER_SUBJECT_TEMPLATE = "Budget for campaign {{campaign.obr_name}} updated to {{node.label}}"

SUBMITTER_HTML_TEMPLATE = """{% extends "submitter_email.html" %}
{% block text %}
{{ block.super }} 
{% endblock %}"""

SUBMITTER_TEXT_TEMPLATE = """{% extends "submitter_email.txt" %}
{% block text %}
{{ block.super }} 
{% endblock %}"""


@mock.patch("plugins.polio.budget.models.get_workflow", get_mocked_workflow)
class MailTemplateTestCase(TestCase):
    """
    Test MailTemplate model.
    """

    @classmethod
    def setUpTestData(cls):
        # User.
        cls.data_source = m.DataSource.objects.create(name="Data Source")
        cls.source_version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = m.Account.objects.create(name="Account", default_version=cls.source_version)
        cls.user = cls.create_user_with_profile(
            email="john@polio.org",
            username="test",
            first_name="John",
            last_name="Doe",
            account=cls.account,
            permissions=["iaso_polio_budget"],
        )

        # Campaign.
        cls.campaign = Campaign.objects.create(obr_name="obr_name", account=cls.user.iaso_profile.account)

        # Budget Process.
        cls.budget_process = BudgetProcess.objects.create(created_by=cls.user, current_state_key="budget_submitted")

        # Rounds.
        cls.round_1 = Round.objects.create(number=1, campaign=cls.campaign, budget_process=cls.budget_process)
        cls.round_2 = Round.objects.create(number=2, campaign=cls.campaign, budget_process=cls.budget_process)

        # Budget Steps.
        cls.budget_step_1 = BudgetStep.objects.create(
            budget_process=cls.budget_process,
            campaign=cls.campaign,
            created_by=cls.user,
            transition_key="budget_submitted",
        )
        cls.budget_step_2 = BudgetStep.objects.create(
            budget_process=cls.budget_process,
            campaign=cls.campaign,
            created_by=cls.user,
            transition_key="accept_budget",
            comment="I accept this budget.",
            amount=10000.0,
        )

        # Budget Mail Templates.
        cls.budget_base_mail_template = MailTemplate(
            slug="base_email",
            subject_template=BUDGET_SUBJECT_TEMPLATE,
            html_template=BUDGET_HTML_TEMPLATE,
            text_template=BUDGET_TEXT_TEMPLATE,
        )
        cls.budget_submitter_mail_template = MailTemplate(
            slug="submitter_email",
            subject_template=SUBMITTER_SUBJECT_TEMPLATE,
            html_template=SUBMITTER_HTML_TEMPLATE,
            text_template=SUBMITTER_TEXT_TEMPLATE,
        )

    def test_model_str(self):
        self.assertEqual(str(self.budget_base_mail_template), "base_email")

    def test_render_for_step_context(self):
        context, _ = self.budget_base_mail_template.render_for_step(self.budget_step_2, self.user, request=None)

        self.assertIsInstance(context, Context)
        mail_context = context.pop()

        expected_url = f"/dashboard/polio/budget/details/campaignName/obr_name/budgetProcessId/{self.budget_process.id}"
        expected_quick_url = f"{expected_url}/quickTransition/accept_budget/previousStep/{self.budget_step_2.id}"
        expected_node = Node(
            label="Budget accepted",
            key="accepted",
            mark_nodes_as_completed=[],
            category_key="category_2",
            order=0,
            mandatory=False,
        )

        self.assertEqual(mail_context["amount"], 10000.0)
        self.assertEqual(mail_context["attachments"], [])
        self.assertEqual(mail_context["author"], self.user)
        self.assertEqual(mail_context["author_name"], "John Doe")

        self.assertIn("api/token_auth/?token", mail_context["budget_url"])
        self.assertIn(expected_url, mail_context["budget_url"])

        self.assertIn(expected_url, mail_context["buttons"][0]["base_url"])
        self.assertIn("api/token_auth/?token", mail_context["buttons"][0]["url"])
        self.assertIn(expected_quick_url, mail_context["buttons"][0]["url"])

        self.assertEqual(mail_context["campaign"], self.campaign)
        self.assertEqual(mail_context["comment"], "I accept this budget.")
        self.assertEqual(mail_context["files"].count(), 0)
        self.assertEqual(mail_context["links"].count(), 0)
        self.assertEqual(mail_context["node"], expected_node)
        self.assertEqual(mail_context["override"], False)
        self.assertEqual(mail_context["rounds"].count(), 2)
        self.assertIn("site_name", mail_context)
        self.assertIn("site_url", mail_context)
        self.assertEqual(mail_context["skipped_attachments"], 0)
        self.assertEqual(mail_context["step"], self.budget_step_2)
        self.assertEqual(mail_context["team"], None)

        self.assertEqual(mail_context["transition"].label, "Accept budget")
        self.assertEqual(mail_context["transition"].key, "accept_budget")

    def test_render_for_step_msg_of_base_mail(self):
        """
        Test content of `budget_base_mail_template`.
        """
        _, msg = self.budget_base_mail_template.render_for_step(self.budget_step_2, self.user, request=None)
        email_html_body = msg.alternatives[0][0]
        email_text_body = msg.body

        # Test headers.
        self.assertEqual(msg.to, ["john@polio.org"])

        # Test HTML content.
        self.assertIn("The status of polio campaign obr_name for Round 1, Round 2 has been updated.", email_html_body)
        self.assertIn("budget page", email_html_body)

        # Test TEXT content.
        self.assertIn(
            "A new budget update has been done on the polio campaign obr_name for Round 1, Round 2 by John Doe: Accept budget.",
            email_text_body,
        )
        self.assertIn("budget page", email_text_body)

    def test_render_for_step_msg_of_submitter_mail(self):
        """
        Test content of `budget_submitter_mail_template`.
        """
        _, msg = self.budget_submitter_mail_template.render_for_step(self.budget_step_2, self.user, request=None)
        email_html_body = msg.alternatives[0][0]
        email_text_body = msg.body

        # Test headers.
        self.assertEqual(msg.to, ["john@polio.org"])

        # Test HTML content.
        self.assertIn(
            "The NEW status of the POLIO campaign <strong>obr_name</strong> for Round 1, Round 2 has been updated to: <strong>Budget accepted</strong>",
            email_html_body,
        )
        self.assertIn("budget page", email_html_body)

        # Test TEXT content.
        self.assertIn(
            "The NEW status of the POLIO campaign obr_name for Round 1, Round 2 has been updated to: Budget accepted",
            email_text_body,
        )
        self.assertIn("budget page", email_text_body)
