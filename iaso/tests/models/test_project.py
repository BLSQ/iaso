from iaso import models as m
from iaso.test import TestCase


class ProjectModelTestCase(TestCase):
    """
    Test Project model.
    """

    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

        cls.project_1 = m.Project.objects.create(name="Project 1", app_id="org.ghi.p1", account=cls.account)
        cls.project_2 = m.Project.objects.create(name="Project 2", app_id="org.ghi.p2", account=cls.account)

    def test_filter_on_user_projects(self):
        self.assertEqual(self.account.project_set.count(), 2)

        # No project restriction: the user should be able to see all projects.
        self.assertEqual(self.user.iaso_profile.projects_ids, [])
        filtered_projects = m.Project.objects.filter_on_user_projects(self.user)
        self.assertEqual(filtered_projects.count(), 2)

        # Restriction on `project_2`: the user shouldn't be able to see `project_1`.
        self.user.iaso_profile.projects.set([self.project_2])
        del self.user.iaso_profile.projects_ids
        filtered_projects = m.Project.objects.filter_on_user_projects(self.user)
        self.assertEqual(filtered_projects.count(), 1)
        self.assertEqual(filtered_projects.first(), self.project_2)

        # Restriction on `project_1` and `project_2`: the user should be able to see all projects.
        self.user.iaso_profile.projects.set([self.project_1, self.project_2])
        del self.user.iaso_profile.projects_ids
        filtered_projects = m.Project.objects.filter_on_user_projects(self.user)
        self.assertEqual(filtered_projects.count(), 2)
