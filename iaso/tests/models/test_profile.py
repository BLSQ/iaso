from django.contrib.auth.models import Group

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
        org_unit_type_district = m.OrgUnitType.objects.create(name="District")
        org_unit_type_town = m.OrgUnitType.objects.create(name="Town")

        group_1 = Group.objects.create(name="Group 1")
        user_role_1 = m.UserRole.objects.create(group=group_1, account=self.account)
        user_role_1.editable_org_unit_types.set([org_unit_type_district])

        group_2 = Group.objects.create(name="Group 2")
        user_role_2 = m.UserRole.objects.create(group=group_2, account=self.account)
        user_role_2.editable_org_unit_types.set([org_unit_type_town, org_unit_type_region])

        with self.assertNumQueries(2):
            self.assertTrue(self.profile1.has_org_unit_write_permission(org_unit_type_country.pk))

        self.profile1.editable_org_unit_types.set([org_unit_type_country])
        with self.assertNumQueries(2):
            self.assertFalse(self.profile1.has_org_unit_write_permission(org_unit_type_region.pk))
        with self.assertNumQueries(2):
            self.assertTrue(self.profile1.has_org_unit_write_permission(org_unit_type_country.pk))
        self.profile1.editable_org_unit_types.clear()

        self.profile1.editable_org_unit_types.set([org_unit_type_region])
        with self.assertNumQueries(2):
            self.assertTrue(self.profile1.has_org_unit_write_permission(org_unit_type_region.pk))
        self.profile1.editable_org_unit_types.clear()

        self.profile1.user_roles.set([user_role_1, user_role_2])
        with self.assertNumQueries(2):
            editable_org_unit_type_ids = self.profile1.get_editable_org_unit_type_ids()
        with self.assertNumQueries(0):
            self.assertTrue(
                self.profile1.has_org_unit_write_permission(
                    org_unit_type_district.pk, prefetched_editable_org_unit_type_ids=editable_org_unit_type_ids
                )
            )
            self.assertTrue(
                self.profile1.has_org_unit_write_permission(
                    org_unit_type_town.pk, prefetched_editable_org_unit_type_ids=editable_org_unit_type_ids
                )
            )
            self.assertTrue(
                self.profile1.has_org_unit_write_permission(
                    org_unit_type_region.pk, prefetched_editable_org_unit_type_ids=editable_org_unit_type_ids
                )
            )
        self.profile1.user_roles.clear()

    def test_with_editable_org_unit_types(self):
        self.assertEqual(self.profile1.get_editable_org_unit_type_ids(), set())

        org_unit_type_country = m.OrgUnitType.objects.create(name="Country")
        org_unit_type_region = m.OrgUnitType.objects.create(name="Region")
        org_unit_type_district = m.OrgUnitType.objects.create(name="District")

        group_1 = Group.objects.create(name="Group 1")
        user_role_1 = m.UserRole.objects.create(group=group_1, account=self.account)
        user_role_1.editable_org_unit_types.set([org_unit_type_country])

        group_2 = Group.objects.create(name="Group 2")
        user_role_2 = m.UserRole.objects.create(group=group_2, account=self.account)
        user_role_2.editable_org_unit_types.set([org_unit_type_region])

        self.profile1.user_roles.set([user_role_1, user_role_2])
        self.profile1.editable_org_unit_types.set([org_unit_type_district])

        profile = m.Profile.objects.filter(id=self.profile1.pk).with_editable_org_unit_types().first()

        self.assertEqual(profile.annotated_editable_org_unit_types_ids, [org_unit_type_district.pk])
        self.assertCountEqual(
            profile.annotated_user_roles_editable_org_unit_type_ids, [org_unit_type_country.pk, org_unit_type_region.pk]
        )
