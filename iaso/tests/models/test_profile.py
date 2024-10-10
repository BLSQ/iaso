from iaso import models as m
from iaso.models.microplanning import Team
from iaso.test import TestCase


class ProfileModelTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="test")
        cls.team_user = m.User.objects.create(username="team_user")
        cls.solo_user = m.User.objects.create(username="solo_user")
        cls.profile1 = m.Profile.objects.create(account=cls.account, user=cls.team_user)
        cls.profile2 = m.Profile.objects.create(account=cls.account, user=cls.solo_user)
        cls.project1 = cls.account.project_set.create(name="project1")
        cls.team1 = Team.objects.create(project=cls.project1, name="team1", manager=cls.team_user)
        cls.team1.users.set([cls.team_user.iaso_profile.user.id])

    def test_user_has_team(self):
        self.assertTrue(self.profile1.has_a_team())
        self.assertFalse(self.profile2.has_a_team())

    def test_has_org_unit_write_permission(self):
        org_unit_type_country = m.OrgUnitType.objects.create(name="Country")
        org_unit_type_region = m.OrgUnitType.objects.create(name="Region")

        with self.assertNumQueries(1):
            self.assertTrue(self.profile1.has_org_unit_write_permission(org_unit_type_country.pk))

        self.profile1.editable_org_unit_types.set([org_unit_type_country])
        with self.assertNumQueries(2):
            self.assertFalse(self.profile1.has_org_unit_write_permission(org_unit_type_region.pk))
        self.profile1.editable_org_unit_types.clear()

        self.profile1.editable_org_unit_types.set([org_unit_type_region])
        with self.assertNumQueries(2):
            self.assertTrue(self.profile1.has_org_unit_write_permission(org_unit_type_region.pk))
        self.profile1.editable_org_unit_types.clear()
