from iaso import models as m
from iaso.models.project import DEFAULT_PROJECT_COLOR
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
        cls.project_3 = m.Project.objects.create(name="Project 3", app_id="org.ghi.p3", account=cls.account)

    def test_filter_on_user_projects(self):
        self.assertEqual(self.account.project_set.count(), 3)

        # No project restriction: the user should be able to see all projects.
        self.assertEqual(self.user.iaso_profile.projects_ids, [])
        filtered_projects = m.Project.objects.filter_on_user_projects(self.user)
        self.assertEqual(filtered_projects.count(), 3)

        # Restriction on `project_2`: the user should be able to see only `project_2`.
        self.user.iaso_profile.projects.set([self.project_2])
        del self.user.iaso_profile.projects_ids
        filtered_projects = m.Project.objects.filter_on_user_projects(self.user)
        self.assertEqual(filtered_projects.count(), 1)
        self.assertEqual(filtered_projects.first(), self.project_2)

        # Restriction on `project_1` and `project_2`: the user should be able to see only `project_1` and `project_2`.
        self.user.iaso_profile.projects.set([self.project_1, self.project_2])
        del self.user.iaso_profile.projects_ids
        filtered_projects = m.Project.objects.filter_on_user_projects(self.user)
        self.assertEqual(filtered_projects.count(), 2)

    def test_project_color(self):
        # Test creating project with color
        project_with_color = m.Project.objects.create(
            name="Project with color", app_id="org.ghi.p4", account=self.account, color="#FF5733"
        )
        self.assertEqual(project_with_color.color, "#FF5733")

        # Test creating project without color (should use default)
        project_without_color = m.Project.objects.create(
            name="Project without color", app_id="org.ghi.p5", account=self.account
        )
        self.assertEqual(project_without_color.color, DEFAULT_PROJECT_COLOR)

        # Test updating project color
        project_without_color.color = "#33FF57"
        project_without_color.save()
        project_without_color.refresh_from_db()
        self.assertEqual(project_without_color.color, "#33FF57")
