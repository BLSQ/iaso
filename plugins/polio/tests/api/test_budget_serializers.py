import datetime

from collections import OrderedDict
from unittest import mock

import time_machine

from django.db.models import F
from rest_framework.test import APIRequestFactory

from iaso import models as m
from iaso.test import TestCase
from plugins.polio.budget.models import BudgetProcess
from plugins.polio.budget.serializers import BudgetProcessSerializer, BudgetProcessWriteSerializer
from plugins.polio.models import Campaign, Round
from plugins.polio.tests.utils.budget import get_mocked_workflow


DT = datetime.datetime(2024, 2, 7, 11, 0, 0, 0, tzinfo=datetime.timezone.utc)


@time_machine.travel(DT, tick=False)
class BudgetProcessWriteSerializerTestCase(TestCase):
    """
    Test BudgetProcessWriteSerializer.
    """

    @classmethod
    def setUpTestData(cls):
        # User.
        cls.account = m.Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(username="username", account=cls.account)
        # Request.
        cls.request = APIRequestFactory().get("/")
        cls.request.user = cls.user
        # Campaign.
        cls.campaign = Campaign.objects.create(
            obr_name="Test Campaign",
            account=cls.user.iaso_profile.account,
            country=m.OrgUnit.objects.create(name="ANGOLA"),
        )
        # Budget process.
        cls.budget_process = BudgetProcess.objects.create(
            created_by=cls.user,
            ra_completed_at_WFEDITABLE=DT.date(),
            who_sent_budget_at_WFEDITABLE=DT.date(),
            unicef_sent_budget_at_WFEDITABLE=DT.date(),
            gpei_consolidated_budgets_at_WFEDITABLE=DT.date(),
            submitted_to_rrt_at_WFEDITABLE=DT.date(),
            feedback_sent_to_gpei_at_WFEDITABLE=DT.date(),
            re_submitted_to_rrt_at_WFEDITABLE=DT.date(),
            submitted_to_orpg_operations1_at_WFEDITABLE=DT.date(),
            feedback_sent_to_rrt1_at_WFEDITABLE=DT.date(),
            re_submitted_to_orpg_operations1_at_WFEDITABLE=DT.date(),
            submitted_to_orpg_wider_at_WFEDITABLE=DT.date(),
            submitted_to_orpg_operations2_at_WFEDITABLE=DT.date(),
            feedback_sent_to_rrt2_at_WFEDITABLE=DT.date(),
            re_submitted_to_orpg_operations2_at_WFEDITABLE=DT.date(),
            submitted_for_approval_at_WFEDITABLE=DT.date(),
            feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE=DT.date(),
            feedback_sent_to_orpg_operations_who_at_WFEDITABLE=DT.date(),
            approved_by_who_at_WFEDITABLE=DT.date(),
            approved_by_unicef_at_WFEDITABLE=DT.date(),
            approved_at_WFEDITABLE=DT.date(),
            approval_confirmed_at_WFEDITABLE=DT.date(),
            payment_mode="DIRECT",
            district_count=3,
            who_disbursed_to_co_at=DT.date(),
            who_disbursed_to_moh_at=DT.date(),
            unicef_disbursed_to_co_at=DT.date(),
            unicef_disbursed_to_moh_at=DT.date(),
            no_regret_fund_amount=100.0,
        )
        # Rounds.
        cls.round_1 = Round.objects.create(number=1, campaign=cls.campaign, budget_process=None)
        cls.round_2 = Round.objects.create(number=2, campaign=cls.campaign, budget_process=None)
        cls.round_3 = Round.objects.create(number=3, campaign=cls.campaign, budget_process=None)

    def test_serialize(self):
        """
        Test BudgetProcess instance -> JSON.
        """
        serializer = BudgetProcessWriteSerializer(instance=self.budget_process)
        self.assertEqual(
            serializer.data,
            {
                "id": self.budget_process.pk,
                "created_by": {
                    "first_name": "",
                    "full_name": "",
                    "id": self.user.pk,
                    "last_name": "",
                    "username": "username",
                },
                "created_at": "2024-02-07T11:00:00Z",
                "rounds": [],
                "ra_completed_at_WFEDITABLE": "2024-02-07",
                "who_sent_budget_at_WFEDITABLE": "2024-02-07",
                "unicef_sent_budget_at_WFEDITABLE": "2024-02-07",
                "gpei_consolidated_budgets_at_WFEDITABLE": "2024-02-07",
                "submitted_to_rrt_at_WFEDITABLE": "2024-02-07",
                "feedback_sent_to_gpei_at_WFEDITABLE": "2024-02-07",
                "re_submitted_to_rrt_at_WFEDITABLE": "2024-02-07",
                "submitted_to_orpg_operations1_at_WFEDITABLE": "2024-02-07",
                "feedback_sent_to_rrt1_at_WFEDITABLE": "2024-02-07",
                "re_submitted_to_orpg_operations1_at_WFEDITABLE": "2024-02-07",
                "submitted_to_orpg_wider_at_WFEDITABLE": "2024-02-07",
                "submitted_to_orpg_operations2_at_WFEDITABLE": "2024-02-07",
                "feedback_sent_to_rrt2_at_WFEDITABLE": "2024-02-07",
                "re_submitted_to_orpg_operations2_at_WFEDITABLE": "2024-02-07",
                "submitted_for_approval_at_WFEDITABLE": "2024-02-07",
                "feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE": "2024-02-07",
                "feedback_sent_to_orpg_operations_who_at_WFEDITABLE": "2024-02-07",
                "approved_by_who_at_WFEDITABLE": "2024-02-07",
                "approved_by_unicef_at_WFEDITABLE": "2024-02-07",
                "approved_at_WFEDITABLE": "2024-02-07",
                "approval_confirmed_at_WFEDITABLE": "2024-02-07",
                "payment_mode": "DIRECT",
                "district_count": 3,
                "who_disbursed_to_co_at": "2024-02-07",
                "who_disbursed_to_moh_at": "2024-02-07",
                "unicef_disbursed_to_co_at": "2024-02-07",
                "unicef_disbursed_to_moh_at": "2024-02-07",
                "no_regret_fund_amount": "100.00",
            },
        )

    def test_deserialize_and_create(self):
        """
        Test JSON -> BudgetProcess instance.
        """
        data = {
            "rounds": [{"id": self.round_1.pk}, {"id": self.round_2.pk}],
            "ra_completed_at_WFEDITABLE": DT.date(),
            "who_sent_budget_at_WFEDITABLE": DT.date(),
            "unicef_sent_budget_at_WFEDITABLE": DT.date(),
            "gpei_consolidated_budgets_at_WFEDITABLE": DT.date(),
            "submitted_to_rrt_at_WFEDITABLE": DT.date(),
            "feedback_sent_to_gpei_at_WFEDITABLE": DT.date(),
            "re_submitted_to_rrt_at_WFEDITABLE": DT.date(),
            "submitted_to_orpg_operations1_at_WFEDITABLE": DT.date(),
            "feedback_sent_to_rrt1_at_WFEDITABLE": DT.date(),
            "re_submitted_to_orpg_operations1_at_WFEDITABLE": DT.date(),
            "submitted_to_orpg_wider_at_WFEDITABLE": DT.date(),
            "submitted_to_orpg_operations2_at_WFEDITABLE": DT.date(),
            "feedback_sent_to_rrt2_at_WFEDITABLE": DT.date(),
            "re_submitted_to_orpg_operations2_at_WFEDITABLE": DT.date(),
            "submitted_for_approval_at_WFEDITABLE": DT.date(),
            "feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE": DT.date(),
            "feedback_sent_to_orpg_operations_who_at_WFEDITABLE": DT.date(),
            "approved_by_who_at_WFEDITABLE": DT.date(),
            "approved_by_unicef_at_WFEDITABLE": DT.date(),
            "approved_at_WFEDITABLE": DT.date(),
            "approval_confirmed_at_WFEDITABLE": DT.date(),
            "payment_mode": "DIRECT",
            "district_count": 3,
            "who_disbursed_to_co_at": DT.date(),
            "who_disbursed_to_moh_at": DT.date(),
            "unicef_disbursed_to_co_at": DT.date(),
            "unicef_disbursed_to_moh_at": DT.date(),
            "no_regret_fund_amount": 100.0,
        }
        serializer = BudgetProcessWriteSerializer(data=data, context={"request": self.request})
        self.assertTrue(serializer.is_valid())

        budget_process = serializer.save()
        self.assertEqual(budget_process.created_by, self.user)
        self.assertEqual(budget_process.created_at, DT)
        rounds = budget_process.rounds.all()
        self.assertEqual(2, len(rounds))
        self.assertIn(self.round_1, rounds)
        self.assertIn(self.round_2, rounds)

        self.assertEqual(budget_process.ra_completed_at_WFEDITABLE, DT.date())
        self.assertEqual(budget_process.who_sent_budget_at_WFEDITABLE, DT.date())
        self.assertEqual(budget_process.unicef_sent_budget_at_WFEDITABLE, DT.date())
        self.assertEqual(budget_process.gpei_consolidated_budgets_at_WFEDITABLE, DT.date())
        self.assertEqual(budget_process.submitted_to_rrt_at_WFEDITABLE, DT.date())
        self.assertEqual(budget_process.feedback_sent_to_gpei_at_WFEDITABLE, DT.date())
        self.assertEqual(budget_process.re_submitted_to_rrt_at_WFEDITABLE, DT.date())
        self.assertEqual(budget_process.submitted_to_orpg_operations1_at_WFEDITABLE, DT.date())
        self.assertEqual(budget_process.feedback_sent_to_rrt1_at_WFEDITABLE, DT.date())
        self.assertEqual(budget_process.re_submitted_to_orpg_operations1_at_WFEDITABLE, DT.date())
        self.assertEqual(budget_process.submitted_to_orpg_wider_at_WFEDITABLE, DT.date())
        self.assertEqual(budget_process.submitted_to_orpg_operations2_at_WFEDITABLE, DT.date())
        self.assertEqual(budget_process.feedback_sent_to_rrt2_at_WFEDITABLE, DT.date())
        self.assertEqual(budget_process.re_submitted_to_orpg_operations2_at_WFEDITABLE, DT.date())
        self.assertEqual(budget_process.submitted_for_approval_at_WFEDITABLE, DT.date())
        self.assertEqual(budget_process.feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE, DT.date())
        self.assertEqual(budget_process.feedback_sent_to_orpg_operations_who_at_WFEDITABLE, DT.date())
        self.assertEqual(budget_process.approved_by_who_at_WFEDITABLE, DT.date())
        self.assertEqual(budget_process.approved_by_unicef_at_WFEDITABLE, DT.date())
        self.assertEqual(budget_process.approved_at_WFEDITABLE, DT.date())
        self.assertEqual(budget_process.approval_confirmed_at_WFEDITABLE, DT.date())
        self.assertEqual(budget_process.payment_mode, "DIRECT")
        self.assertEqual(budget_process.district_count, 3)
        self.assertEqual(budget_process.who_disbursed_to_co_at, DT.date())
        self.assertEqual(budget_process.who_disbursed_to_moh_at, DT.date())
        self.assertEqual(budget_process.unicef_disbursed_to_co_at, DT.date())
        self.assertEqual(budget_process.unicef_disbursed_to_moh_at, DT.date())
        self.assertEqual(budget_process.no_regret_fund_amount, 100.0)

    def test_deserialize_and_update(self):
        """
        Test BudgetProcess instance update.
        """
        self.round_1.budget_process = self.budget_process
        self.round_1.save()
        self.round_2.budget_process = self.budget_process
        self.round_2.save()

        data = {
            "rounds": [{"id": self.round_3.pk}],
            "no_regret_fund_amount": 50.0,
        }
        context = {"request": self.request}
        serializer = BudgetProcessWriteSerializer(self.budget_process, data=data, partial=True, context=context)
        self.assertTrue(serializer.is_valid())

        budget_process = serializer.save()
        rounds = budget_process.rounds.all()
        self.assertEqual(1, len(rounds))
        self.assertIn(self.round_3, rounds)
        self.assertEqual(budget_process.no_regret_fund_amount, 50.0)

    def test_validate_raises_for_invalid_rounds(self):
        invalid_round = Round.objects.create(number=1)
        data = {
            "rounds": [{"id": invalid_round.id}],
        }
        serializer = BudgetProcessWriteSerializer(data=data, context={"request": self.request})
        self.assertFalse(serializer.is_valid())
        expected_error_msg = "The user does not have the permissions for rounds:"
        self.assertIn(expected_error_msg, str(serializer.errors["rounds"][0]))

    def test_validate_raises_for_already_linked_rounds(self):
        budget_process = BudgetProcess.objects.create(created_by=self.user)
        linked_round = Round.objects.create(number=1, campaign=self.campaign, budget_process=budget_process)
        data = {
            "rounds": [{"id": linked_round.id}],
        }
        serializer = BudgetProcessWriteSerializer(data=data, context={"request": self.request})
        self.assertFalse(serializer.is_valid())
        expected_error_msg = "A BudgetProcess already exists for rounds:"
        self.assertIn(expected_error_msg, str(serializer.errors["rounds"][0]))

    def test_validate_raises_for_rounds_of_different_campaigns(self):
        other_campaign = Campaign.objects.create(
            obr_name="Test Other Campaign",
            account=self.user.iaso_profile.account,
        )
        other_campaign_round = Round.objects.create(number=1, campaign=other_campaign, budget_process=None)
        data = {
            "rounds": [{"id": self.round_1.pk}, {"id": other_campaign_round.pk}],
        }
        serializer = BudgetProcessWriteSerializer(data=data, context={"request": self.request})
        self.assertFalse(serializer.is_valid())
        expected_error_msg = "Rounds must be from the same campaign."
        self.assertIn(expected_error_msg, str(serializer.errors["rounds"][0]))


@time_machine.travel(DT, tick=False)
@mock.patch("plugins.polio.budget.serializers.get_workflow", get_mocked_workflow)
class BudgetProcessSerializerTestCase(TestCase):
    """
    Test BudgetProcessSerializer (read only).
    """

    @classmethod
    def setUpTestData(cls):
        # User.
        cls.account = m.Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(username="username", account=cls.account)
        # Request.
        cls.request = APIRequestFactory().get("/")
        cls.request.user = cls.user
        cls.request.query_params = {}
        # Campaign.
        cls.campaign = Campaign.objects.create(
            obr_name="Test Campaign",
            account=cls.user.iaso_profile.account,
            country=m.OrgUnit.objects.create(name="ANGOLA"),
        )
        # Budget process.
        cls.budget_process = BudgetProcess.objects.create(
            created_by=cls.user,
            ra_completed_at_WFEDITABLE=DT.date(),
            who_sent_budget_at_WFEDITABLE=DT.date(),
            unicef_sent_budget_at_WFEDITABLE=DT.date(),
            gpei_consolidated_budgets_at_WFEDITABLE=DT.date(),
            submitted_to_rrt_at_WFEDITABLE=DT.date(),
            feedback_sent_to_gpei_at_WFEDITABLE=DT.date(),
            re_submitted_to_rrt_at_WFEDITABLE=DT.date(),
            submitted_to_orpg_operations1_at_WFEDITABLE=DT.date(),
            feedback_sent_to_rrt1_at_WFEDITABLE=DT.date(),
            re_submitted_to_orpg_operations1_at_WFEDITABLE=DT.date(),
            submitted_to_orpg_wider_at_WFEDITABLE=DT.date(),
            submitted_to_orpg_operations2_at_WFEDITABLE=DT.date(),
            feedback_sent_to_rrt2_at_WFEDITABLE=DT.date(),
            re_submitted_to_orpg_operations2_at_WFEDITABLE=DT.date(),
            submitted_for_approval_at_WFEDITABLE=DT.date(),
            feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE=DT.date(),
            feedback_sent_to_orpg_operations_who_at_WFEDITABLE=DT.date(),
            approved_by_who_at_WFEDITABLE=DT.date(),
            approved_by_unicef_at_WFEDITABLE=DT.date(),
            approved_at_WFEDITABLE=DT.date(),
            approval_confirmed_at_WFEDITABLE=DT.date(),
            payment_mode="DIRECT",
            district_count=3,
            who_disbursed_to_co_at=DT.date(),
            who_disbursed_to_moh_at=DT.date(),
            unicef_disbursed_to_co_at=DT.date(),
            unicef_disbursed_to_moh_at=DT.date(),
            no_regret_fund_amount=100.0,
        )
        # Rounds.
        cls.round_1 = Round.objects.create(number=1, campaign=cls.campaign, budget_process=cls.budget_process)
        cls.round_2 = Round.objects.create(number=2, campaign=cls.campaign, budget_process=cls.budget_process)
        cls.round_3 = Round.objects.create(number=3, campaign=cls.campaign, budget_process=cls.budget_process)

    def test_serialize(self):
        """
        Test BudgetProcess instance -> JSON.
        """

        expected_rounds = [
            OrderedDict({"id": self.round_1.pk, "number": 1, "cost": "0.00", "target_population": None}),
            OrderedDict({"id": self.round_2.pk, "number": 2, "cost": "0.00", "target_population": None}),
            OrderedDict({"id": self.round_3.pk, "number": 3, "cost": "0.00", "target_population": None}),
        ]
        expected_possible_states = [
            OrderedDict({"key": None, "label": "No budget"}),
            OrderedDict({"key": "budget_submitted", "label": "Budget submitted"}),
            OrderedDict({"key": "accepted", "label": "Budget accepted"}),
            OrderedDict({"key": "rejected", "label": "Budget rejected"}),
        ]
        expected_next_transitions = [
            OrderedDict(
                {
                    "key": "submit_budget",
                    "label": "Submit budget",
                    "help_text": "",
                    "allowed": True,
                    "reason_not_allowed": None,
                    "required_fields": [],
                    "displayed_fields": ["comment"],
                    "color": None,
                    "emails_destination_team_ids": [],
                }
            ),
        ]
        expected_possible_transitions = [
            OrderedDict(
                {
                    "key": "submit_budget",
                    "label": "Submit budget",
                    "help_text": "",
                    "allowed": None,
                    "reason_not_allowed": None,
                    "required_fields": [],
                    "displayed_fields": ["comment"],
                    "color": None,
                }
            ),
            OrderedDict(
                {
                    "key": "accept_budget",
                    "label": "Accept budget",
                    "help_text": "",
                    "allowed": None,
                    "reason_not_allowed": None,
                    "required_fields": [],
                    "displayed_fields": ["comment"],
                    "color": "green",
                }
            ),
            OrderedDict(
                {
                    "key": "reject_budget",
                    "label": "Provide feedback",
                    "help_text": "",
                    "allowed": None,
                    "reason_not_allowed": None,
                    "required_fields": [],
                    "displayed_fields": ["comment"],
                    "color": "primary",
                }
            ),
            OrderedDict(
                {
                    "key": "override",
                    "label": "Override",
                    "help_text": "",
                    "allowed": None,
                    "reason_not_allowed": None,
                    "required_fields": [],
                    "displayed_fields": [],
                    "color": "red",
                }
            ),
        ]
        expected_timeline = {
            "categories": [
                OrderedDict(
                    {
                        "key": "category_1",
                        "label": "Category 1",
                        "color": "green",
                        "items": [],
                        "completed": True,
                        "active": False,
                    }
                ),
                OrderedDict(
                    {
                        "key": "category_2",
                        "label": "Category 2",
                        "color": "green",
                        "items": [],
                        "completed": True,
                        "active": False,
                    }
                ),
            ]
        }

        # Fetch required annotated fields.
        budget_process = (
            BudgetProcess.objects.filter(pk=self.budget_process.pk)
            .annotate(
                campaign_id=F("rounds__campaign_id"),
                obr_name=F("rounds__campaign__obr_name"),
                country_name=F("rounds__campaign__country__name"),
            )
            .prefetch_related("rounds")[0]
        )

        # Ask for default fields (this is done via `DynamicFieldsModelSerializer`).
        serializer = BudgetProcessSerializer(instance=budget_process, context={"request": self.request})
        self.assertEqual(
            serializer.data,
            {
                "created_at": "2024-02-07T11:00:00Z",
                "id": self.budget_process.pk,
                "campaign_id": str(self.campaign.pk),
                "obr_name": "Test Campaign",
                "country_name": "ANGOLA",
                "rounds": expected_rounds,
                "current_state": {"key": "-", "label": "-"},
                "updated_at": "2024-02-07T11:00:00Z",
            },
        )

        # Ask for a set of fields (this is done via `DynamicFieldsModelSerializer`).
        self.request.query_params["fields"] = "id,who_sent_budget_at_WFEDITABLE,payment_mode,district_count"
        serializer = BudgetProcessSerializer(instance=budget_process, context={"request": self.request})
        self.assertEqual(
            serializer.data,
            {
                "id": self.budget_process.pk,
                "who_sent_budget_at_WFEDITABLE": "2024-02-07",
                "payment_mode": "DIRECT",
                "district_count": 3,
            },
        )

        # Ask for all fields (this is done via `DynamicFieldsModelSerializer`).
        self.request.query_params["fields"] = ":all"
        serializer = BudgetProcessSerializer(instance=budget_process, context={"request": self.request})

        expected = {
            "created_at": "2024-02-07T11:00:00Z",
            "id": self.budget_process.pk,
            "campaign_id": str(self.campaign.pk),
            "obr_name": "Test Campaign",
            "country_name": "ANGOLA",
            "rounds": expected_rounds,
            "current_state": {"key": "-", "label": "-"},
            "updated_at": "2024-02-07T11:00:00Z",
            "possible_states": expected_possible_states,
            "next_transitions": expected_next_transitions,
            "possible_transitions": expected_possible_transitions,
            "timeline": expected_timeline,
            "ra_completed_at_WFEDITABLE": "2024-02-07",
            "who_sent_budget_at_WFEDITABLE": "2024-02-07",
            "unicef_sent_budget_at_WFEDITABLE": "2024-02-07",
            "gpei_consolidated_budgets_at_WFEDITABLE": "2024-02-07",
            "submitted_to_rrt_at_WFEDITABLE": "2024-02-07",
            "feedback_sent_to_gpei_at_WFEDITABLE": "2024-02-07",
            "re_submitted_to_rrt_at_WFEDITABLE": "2024-02-07",
            "submitted_to_orpg_operations1_at_WFEDITABLE": "2024-02-07",
            "feedback_sent_to_rrt1_at_WFEDITABLE": "2024-02-07",
            "re_submitted_to_orpg_operations1_at_WFEDITABLE": "2024-02-07",
            "submitted_to_orpg_wider_at_WFEDITABLE": "2024-02-07",
            "submitted_to_orpg_operations2_at_WFEDITABLE": "2024-02-07",
            "feedback_sent_to_rrt2_at_WFEDITABLE": "2024-02-07",
            "re_submitted_to_orpg_operations2_at_WFEDITABLE": "2024-02-07",
            "submitted_for_approval_at_WFEDITABLE": "2024-02-07",
            "feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE": "2024-02-07",
            "feedback_sent_to_orpg_operations_who_at_WFEDITABLE": "2024-02-07",
            "approved_by_who_at_WFEDITABLE": "2024-02-07",
            "approved_by_unicef_at_WFEDITABLE": "2024-02-07",
            "approved_at_WFEDITABLE": "2024-02-07",
            "approval_confirmed_at_WFEDITABLE": "2024-02-07",
            "payment_mode": "DIRECT",
            "district_count": 3,
            "who_disbursed_to_co_at": "2024-02-07",
            "who_disbursed_to_moh_at": "2024-02-07",
            "unicef_disbursed_to_co_at": "2024-02-07",
            "unicef_disbursed_to_moh_at": "2024-02-07",
            "no_regret_fund_amount": "100.00",
            "has_data_in_budget_tool": False,
        }
        self.assertEqual(
            serializer.data,
            expected,
        )
