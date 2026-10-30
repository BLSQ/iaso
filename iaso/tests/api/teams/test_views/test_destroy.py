from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from rest_framework import status

from hat.audit.models import Modification
from iaso.models import Account, Team
from iaso.permissions.core_permissions import CORE_TEAMS_PERMISSION
from iaso.test import APITestCase


class TeamDestroyViewAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()
        cls.account = account = Account.objects.create(name="test")
        cls.other_account = other_account = Account.objects.create(name="other_account")

        cls.user_no_perm = cls.create_user_with_profile(
            username="user_no_perm", account=account, permissions=[], first_name="user", last_name="no_perm"
        )
        cls.user_with_perms = cls.create_user_with_profile(
            username="user_with_perms",
            account=cls.account,
            permissions=[CORE_TEAMS_PERMISSION],
            first_name="user",
            last_name="with_perms",
        )
        cls.user_with_perms.iaso_profile.color = "#00FFFF"
        cls.user_with_perms.iaso_profile.save()
        cls.superuser = cls.create_user_with_profile(
            username="superuser", account=cls.account, is_superuser=True, first_name="user", last_name="super"
        )
        cls.user_other_account = cls.create_user_with_profile(
            username="user_other_account", account=other_account, permissions=[CORE_TEAMS_PERMISSION]
        )

        cls.project1 = project1 = account.project_set.create(name="project1")
        cls.project2 = project2 = account.project_set.create(name="project2")
        cls.project_other_account = other_account.project_set.create(name="project3")

        cls.root_team = Team.objects.create(
            project=project1, name="root_team", manager=cls.user_with_perms, color="#0000FF"
        )
        cls.team = Team.objects.create(
            project=project1, name="team1", manager=cls.user_with_perms, color="#0000FF", parent=cls.root_team
        )
        cls.team.users.set(
            [
                cls.user_with_perms,
                cls.superuser,
            ]
        )

        cls.team_other_account = Team.objects.create(
            name="team other account", manager=cls.user_other_account, project=cls.project_other_account
        )

        cls.sub_team_1 = Team.objects.create(
            name="sub_team_1", parent=cls.team, manager=cls.user_with_perms, project=cls.project1
        )
        cls.sub_team_2 = Team.objects.create(
            name="sub_team_2", parent=cls.team, manager=cls.user_with_perms, project=cls.project1
        )

    def get_url(self, pk: int | None = None) -> str:
        if not pk:
            pk = self.team.pk
        return reverse("teams-detail", kwargs={"pk": pk})

    def test_num_queries(self):
        ContentType.objects.clear_cache()

        self.assertIsNone(self.team.deleted_at)

        self.client.force_authenticate(self.superuser)
        with self.assertNumQueries(13):
            # 1 SAVEPOINT
            # 2-4 SELECT + PREFETCH
            # 5 SAVEPOINT
            # 6 SET UPDATED_BY
            # 7 RELEASE SAVEPOINT
            # 8-10: UPDATE (soft delete)
            # 11-12: AUDIT
            # 13: RELEASE SAVEPOINT
            res = self.client.delete(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        self.team.refresh_from_db()
        self.assertIsNotNone(self.team.deleted_at)

    def test_destroy(self):
        self.assertIsNone(self.team.deleted_at)
        self.assertIsNone(self.team.updated_by)
        self.client.force_authenticate(self.superuser)
        res = self.client.delete(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        self.team.refresh_from_db()
        self.assertIsNotNone(self.team.deleted_at)
        self.assertEqual(self.team.updated_by, self.superuser)

        # check the modification
        self.assertTrue(
            Modification.objects.filter(
                user=self.superuser,
                source=f"API DELETE /api/teams/{self.team.pk}/",
            ).exists()
        )

    def test_permissions(self):
        res = self.client.delete(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.user_no_perm)
        res = self.client.delete(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_with_perms)
        res = self.client.delete(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        self.team.restore()

        self.client.force_authenticate(self.superuser)
        res = self.client.delete(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_cannot_destroy_soft_deleted_team(self):
        self.team.delete()
        self.team.refresh_from_db()
        self.assertIsNotNone(self.team.deleted_at)

        self.client.force_authenticate(self.superuser)
        res = self.client.delete(self.get_url(self.team.pk))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_destroy_team_from_other_account(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.delete(self.get_url(self.team_other_account.pk))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
