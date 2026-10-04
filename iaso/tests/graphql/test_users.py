from iaso import models as m
from iaso.permissions.core_permissions import CORE_USERS_ADMIN_PERMISSION, CORE_USERS_MANAGED_PERMISSION
from iaso.tests.graphql.base import GraphQLTestCase


class UsersGraphQLTestCase(GraphQLTestCase):
    """The Ministry of Health's users: a national admin (users admin), a district supervisor (users managed, on Kanda),
    a health worker (assigned to the North Region, in Kanda, restricted to the census), a nurse (no restriction), an
    inactive viewer (no permission); and the Partner NGO's admin."""

    @classmethod
    def setUpTestData(cls):
        moh = m.Account.objects.create(name="Ministry of Health")
        partner_ngo = m.Account.objects.create(name="Partner NGO")
        cls.census = m.Project.objects.create(name="Census", app_id="census", account=moh)
        cls.vaccination = m.Project.objects.create(name="Vaccination", app_id="vaccination", account=moh)
        cls.kanda = m.OrgUnit.objects.create(name="Kanda")
        cls.north_region = m.OrgUnit.objects.create(name="North Region", parent=cls.kanda)
        cls.moyo = m.OrgUnit.objects.create(name="Moyo")

        cls.national_admin = cls.create_user_with_profile(
            username="national_admin", account=moh, permissions=[CORE_USERS_ADMIN_PERMISSION]
        )
        cls.district_supervisor = cls.create_user_with_profile(
            username="district_supervisor",
            account=moh,
            permissions=[CORE_USERS_MANAGED_PERMISSION],
            org_units=[cls.kanda],
        )
        cls.health_worker = cls.create_user_with_profile(
            username="health_worker",
            account=moh,
            org_units=[cls.north_region],
            projects=[cls.census],
            language="fr",
            first_name="Aminata",
            last_name="Conteh",
            email="aconteh@moh.example.org",
        )
        cls.health_worker.iaso_profile.phone_number = "+32475123456"
        cls.health_worker.iaso_profile.organization = "District Health Office"
        cls.health_worker.iaso_profile.save()
        cls.nurse = cls.create_user_with_profile(username="nurse", account=moh, org_units=[cls.moyo])
        cls.viewer = cls.create_user_with_profile(username="viewer", account=moh, is_active=False)
        cls.partner_admin = cls.create_user_with_profile(
            username="partner_admin", account=partner_ngo, permissions=[CORE_USERS_ADMIN_PERMISSION]
        )

    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.national_admin)

    def users(self, selection="username", **arguments):
        return self.items("users", selection, **arguments)

    def usernames(self, **arguments):
        return [row["username"] for row in self.users(**arguments)]

    def test_the_accounts_users(self):
        self.assertEqual(
            self.usernames(), ["national_admin", "district_supervisor", "health_worker", "nurse", "viewer"]
        )
        self.assertEqual(
            self.usernames(order=["USERNAME"]),
            ["district_supervisor", "health_worker", "national_admin", "nurse", "viewer"],
        )

    def test_fields_projects_and_org_units(self):
        selection = (
            "id profileId username firstName lastName email isActive language phoneNumber organization dhis2Id "
            "projects { name } orgUnits { name parentId }"
        )
        profiler, users = self.profiled(lambda: self.users(selection))
        rows = {row["username"]: row for row in users}
        self.assertEqual(
            rows["health_worker"],
            {
                "id": self.health_worker.id,
                "profileId": self.health_worker.iaso_profile.id,
                "username": "health_worker",
                "firstName": "Aminata",
                "lastName": "Conteh",
                "email": "aconteh@moh.example.org",
                "isActive": True,
                "language": "fr",
                "phoneNumber": "+32475123456",
                "organization": "District Health Office",
                "dhis2Id": None,
                "projects": [{"name": "Census"}],
                "orgUnits": [{"name": "North Region", "parentId": self.kanda.id}],
            },
        )
        # no restriction: empty lists
        self.assertEqual((rows["national_admin"]["projects"], rows["national_admin"]["orgUnits"]), ([], []))
        # the users with their profile, then one query per list for the whole page
        with profiler.report_on_failure():
            # `auth_user`: the users, their profile joined
            profiler.assertLessEqualQueryCount({"auth_user": 1, "iaso_project": 1, "iaso_orgunit": 1})

    def test_filters(self):
        for filters, expected in [
            ({"search": "conteh"}, ["health_worker"]),
            ({"search": "MOH.EXAMPLE.org"}, ["health_worker"]),
            ({"projectId": self.census.id}, ["health_worker"]),
            ({"orgUnitId": self.moyo.id}, ["nurse"]),
            ({"isActive": False}, ["viewer"]),
            ({"idIn": [self.nurse.id, self.partner_admin.id]}, ["nurse"]),
        ]:
            with self.subTest(filters=filters):
                self.assertEqual(self.usernames(filters=filters), expected)

    def test_managed_only(self):
        # a users admin manages everyone
        self.assertEqual(len(self.usernames(filters={"managedOnly": True})), 5)
        # with "users managed": those assigned below their org units (the North Region is in Kanda), not themselves
        self.client.force_authenticate(self.district_supervisor)
        self.assertEqual(self.usernames(filters={"managedOnly": True}), ["health_worker"])
        self.assertEqual(len(self.usernames()), 5)

    def test_one_user(self):
        selection = "username orgUnits { name }"
        self.assertEqual(
            self.row("user", self.health_worker.id, selection),
            {"username": "health_worker", "orgUnits": [{"name": "North Region"}]},
        )
        self.assertIsNone(self.row("user", self.partner_admin.id, selection))

    def test_permission_and_me(self):
        self.client.force_authenticate(self.health_worker)
        (error,) = self.execute("{ users { items { id } } }")["errors"]
        self.assertEqual(error["extensions"]["code"], "FORBIDDEN")
        # but themselves, always
        self.assertEqual(
            self.data("{ me { username projects { name } } }")["me"],
            {"username": "health_worker", "projects": [{"name": "Census"}]},
        )

    def test_lists_lower_the_limit(self):
        body = self.execute("{ users(limit: 500) { items { orgUnits { id } } } }")
        self.assertIn("limit must be between 1 and 100 when selecting orgUnits", body["errors"][0]["message"])

    def test_no_query_per_user(self):
        selection = "username language phoneNumber profileId projects { name } orgUnits { name }"

        before, _users = self.profiled(lambda: self.users(selection))
        self.create_user_with_profile(
            username="data_manager",
            account=self.national_admin.iaso_profile.account,
            org_units=[self.north_region],
            projects=[self.census],
        )
        after, _users = self.profiled(lambda: self.users(selection))
        after.assertSameQueryCounts(before)
