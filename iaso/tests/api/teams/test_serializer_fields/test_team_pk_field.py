from django.test import TestCase
from rest_framework.exceptions import ValidationError

from iaso.api.teams.serializer_fields import TeamPrimaryKeyRelatedField
from iaso.models import Account, Team
from iaso.models.team import TeamType
from iaso.test import IasoTestCaseMixin


class TeamPrimaryKeyRelatedFieldTestCase(IasoTestCaseMixin, TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = account = Account.objects.create(name="test")

        cls.user_no_perm = cls.create_user_with_profile(
            username="user_no_perm", account=account, permissions=[], first_name="user", last_name="no_perm"
        )
        cls.project1 = account.project_set.create(name="project1")

        cls.team_of_teams = Team.objects.create(
            name="Team of teams", type=TeamType.TEAM_OF_TEAMS, manager=cls.user_no_perm, project=cls.project1
        )
        cls.team_of_users = Team.objects.create(
            name="Team of users", type=TeamType.TEAM_OF_USERS, manager=cls.user_no_perm, project=cls.project1
        )

    def test_to_internal_value_returns_team_of_expected_type(self):
        field = TeamPrimaryKeyRelatedField(
            team_type=TeamType.TEAM_OF_TEAMS,
            queryset=Team.objects.all(),
        )

        result = field.to_internal_value(self.team_of_teams.pk)

        self.assertEqual(result, self.team_of_teams)

    def test_to_internal_value_rejects_wrong_team_type(self):
        field = TeamPrimaryKeyRelatedField(
            team_type=TeamType.TEAM_OF_TEAMS,
            queryset=Team.objects.all(),
        )

        with self.assertRaises(ValidationError) as context:
            field.to_internal_value(self.team_of_users.pk)

        self.assertEqual(
            context.exception.detail,
            ["Invalid team type, expected TEAM_OF_TEAMS."],
        )

    def test_to_internal_value_rejects_nonexistent_team(self):
        field = TeamPrimaryKeyRelatedField(
            team_type=TeamType.TEAM_OF_TEAMS,
            queryset=Team.objects.all(),
        )

        with self.assertRaises(ValidationError):
            field.to_internal_value(999999)

    def test_init_requires_team_type(self):
        with self.assertRaisesMessage(
            ValueError,
            "You must provide a team type",
        ):
            TeamPrimaryKeyRelatedField(
                team_type=None,
                queryset=Team.objects.all(),
            )
