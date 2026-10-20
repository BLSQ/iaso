from iaso.models import Account, Project, Team
from iaso.test import TestCase


class TeamTestCase(TestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        cls.account = Account.objects.create(name="account")
        cls.other_account = Account.objects.create(name="other_account")

        cls.user = cls.create_user_with_profile(
            username="user",
            account=cls.account,
        )
        cls.user_other_account = cls.create_user_with_profile(
            username="user_other_account",
            account=cls.other_account,
        )
        cls.project = Project.objects.create(name="project", account=cls.account)
        cls.project_other_account = Project.objects.create(name="project_other_account", account=cls.other_account)

        cls.root_team = Team.objects.create(name="root_team", manager=cls.user, project=cls.project)
        cls.root_team_2 = Team.objects.create(name="root_team_2", manager=cls.user, project=cls.project)
        cls.sub_team_1 = Team.objects.create(
            name="sub_team_1", parent=cls.root_team, manager=cls.user, project=cls.project
        )
        cls.sub_team_2 = Team.objects.create(
            name="sub_team_2", parent=cls.root_team, manager=cls.user, project=cls.project
        )
        cls.sub_team_3 = Team.objects.create(
            name="sub_team_3", parent=cls.root_team_2, manager=cls.user, project=cls.project
        )
        cls.sub_team_4 = Team.objects.create(
            name="sub_team_4", parent=cls.root_team_2, manager=cls.user, project=cls.project
        )
        cls.sub_team_1_2 = Team.objects.create(
            name="sub_team_1_2", parent=cls.sub_team_1, manager=cls.user, project=cls.project
        )
        cls.sub_team_1_3 = Team.objects.create(
            name="sub_team_1_3", parent=cls.sub_team_1, manager=cls.user, project=cls.project
        )
        cls.sub_team_2_1 = Team.objects.create(
            name="sub_team_2_1", parent=cls.sub_team_2, manager=cls.user, project=cls.project
        )

        cls.team_other_account = Team.objects.create(
            name="team other account", manager=cls.user, project=cls.project_other_account
        )

    def test_annotate_with_depth(self):
        self.assertCountEqual(
            list(Team.objects.filter_for_user(self.user).annotate_with_depth().values_list("id", "depth")),
            [
                (self.root_team.pk, 1),
                (self.root_team_2.pk, 1),
                (self.sub_team_1.pk, 2),
                (self.sub_team_2.pk, 2),
                (self.sub_team_3.pk, 2),
                (self.sub_team_4.pk, 2),
                (self.sub_team_1_2.pk, 3),
                (self.sub_team_1_3.pk, 3),
                (self.sub_team_2_1.pk, 3),
            ],
        )

    def test_filter_for_user(self):
        teams = Team.objects.filter_for_user(self.user_other_account)
        self.assertQuerySetEqual(teams, [self.team_other_account])
