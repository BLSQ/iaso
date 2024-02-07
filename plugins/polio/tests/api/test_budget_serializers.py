import datetime

import time_machine
from rest_framework.test import APIRequestFactory

from iaso import models as m
from iaso.test import TestCase
from plugins.polio.budget.models import BudgetProcess
from plugins.polio.budget.serializers import BudgetProcessWriteSerializer
from plugins.polio.models import Campaign, Round


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
            obr_name="test campaign",
            account=cls.user.iaso_profile.account,
            country=m.OrgUnit.objects.create(name="ANGOLA"),
        )
        # Rounds.
        cls.round_1 = Round.objects.create(number=1, campaign=cls.campaign, budget_process=None)
        cls.round_2 = Round.objects.create(number=2, campaign=cls.campaign, budget_process=None)
        cls.round_3 = Round.objects.create(number=3, campaign=cls.campaign, budget_process=None)

    def test_deserialize_ok(self):
        """
        Test the validation of the incoming data and the creation of a BudgetProcess instance.
        """
        data = {
            "rounds": [self.round_1.pk, self.round_2.pk],
        }
        serializer = BudgetProcessWriteSerializer(data=data, context={"request": self.request})
        self.assertTrue(serializer.is_valid())

        budget_process = serializer.save()
        self.assertEqual(budget_process.created_by, self.user)
        self.assertEqual(budget_process.created_at, DT)
        rounds = budget_process.rounds.all()
        self.assertIn(self.round_1, rounds)
        self.assertIn(self.round_2, rounds)

    def test_validate_raises_for_invalid_rounds(self):
        invalid_round = Round.objects.create(number=1)
        data = {
            "rounds": [invalid_round.id],
        }
        serializer = BudgetProcessWriteSerializer(data=data, context={"request": self.request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("The user does not have the permissions for rounds:", serializer.errors["rounds"][0])

    def test_validate_raises_for_already_linked_rounds(self):
        budget_process = BudgetProcess.objects.create(created_by=self.user)
        linked_round = Round.objects.create(number=1, campaign=self.campaign, budget_process=budget_process)
        data = {
            "rounds": [linked_round.id],
        }
        serializer = BudgetProcessWriteSerializer(data=data, context={"request": self.request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("A BudgetProcess already exists for rounds:", serializer.errors["rounds"][0])
