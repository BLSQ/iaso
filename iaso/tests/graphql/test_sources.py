from iaso import models as m
from iaso.permissions.core_permissions import CORE_ORG_UNITS_READ_PERMISSION, CORE_SOURCE_PERMISSION
from iaso.tests.graphql.base import GraphQLTestCase


class SourcesGraphQLTestCase(GraphQLTestCase):
    """The Ministry of Health's sources - the national health facility registry (two versions) and a DHIS2 import
    shared with a partner NGO - seen by a data manager, with the "org units (read)" permission."""

    @classmethod
    def setUpTestData(cls):
        moh = m.Account.objects.create(name="Ministry of Health")
        partner_ngo = m.Account.objects.create(name="Partner NGO")
        cls.census = m.Project.objects.create(name="Census", app_id="census", account=moh)
        cls.partner_project = m.Project.objects.create(
            name="Partner outreach", app_id="partner.outreach", account=partner_ngo
        )

        cls.registry = m.DataSource.objects.create(
            name="National health facility registry",
            description="The reference",
            tree_config_status_fields=["VALID", "NEW"],
        )
        cls.registry.projects.add(cls.census)
        cls.v1 = m.SourceVersion.objects.create(data_source=cls.registry, number=1, description="First import")
        cls.v2 = m.SourceVersion.objects.create(data_source=cls.registry, number=2)
        cls.registry.default_version = cls.v2
        cls.registry.save()

        cls.dhis2 = m.DataSource.objects.create(name="DHIS2 import", read_only=True, public=True)
        cls.dhis2.projects.add(cls.census, cls.partner_project)
        cls.dhis2_v1 = m.SourceVersion.objects.create(data_source=cls.dhis2, number=1)

        cls.partner_registry = m.DataSource.objects.create(name="Partner registry")
        cls.partner_registry.projects.add(cls.partner_project)
        cls.partner_registry_v1 = m.SourceVersion.objects.create(data_source=cls.partner_registry, number=1)

        cls.data_manager = cls.create_user_with_profile(
            username="data_manager", account=moh, permissions=[CORE_ORG_UNITS_READ_PERMISSION]
        )
        cls.viewer = cls.create_user_with_profile(username="viewer", account=moh, permissions=[])
        cls.partner_admin = cls.create_user_with_profile(
            username="partner_admin", account=partner_ngo, permissions=[CORE_SOURCE_PERMISSION]
        )

    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.data_manager)

    # -- helpers --

    def sources(self, selection="name", **arguments):
        return self.items("dataSources", selection, **arguments)

    def versions(self, selection="id", **arguments):
        return self.items("sourceVersions", selection, **arguments)

    # -- dataSources --

    def test_the_accounts_sources_by_name(self):
        self.assertEqual(self.sources(), [{"name": "DHIS2 import"}, {"name": "National health facility registry"}])
        self.client.force_authenticate(self.partner_admin)
        self.assertEqual(self.sources(), [{"name": "DHIS2 import"}, {"name": "Partner registry"}])

    def test_fields_and_relations(self):
        selection = (
            "id name description readOnly public treeConfigStatusFields defaultVersionId "
            "defaultVersion { number } versions { number description } projects { name }"
        )
        profiler, sources = self.profiled(lambda: self.sources(selection))
        rows = {row["name"]: row for row in sources}
        self.assertEqual(
            rows["National health facility registry"],
            {
                "id": self.registry.id,
                "name": "National health facility registry",
                "description": "The reference",
                "readOnly": False,
                "public": False,
                "treeConfigStatusFields": ["VALID", "NEW"],
                "defaultVersionId": self.v2.id,
                "defaultVersion": {"number": 2},
                "versions": [{"number": 2, "description": None}, {"number": 1, "description": "First import"}],
                "projects": [{"name": "Census"}],
            },
        )
        # only the account's projects: not the partner NGO's
        dhis2 = rows["DHIS2 import"]
        self.assertEqual((dhis2["readOnly"], dhis2["public"], dhis2["projects"]), (True, True, [{"name": "Census"}]))
        self.assertEqual((dhis2["defaultVersion"], dhis2["treeConfigStatusFields"]), (None, []))
        # the sources (default version joined), then one query per list for the whole page
        with profiler.report_on_failure():
            profiler.assertLessEqualQueryCount(
                {
                    "iaso_datasource": 1,
                    "iaso_sourceversion": 1,  # `versions` (`defaultVersion` joined)
                    "iaso_project": 2,  # the sources' account scoping, `projects`
                }
            )

    def test_filters(self):
        for filters, expected in [
            ({"nameIContains": "registry"}, ["National health facility registry"]),
            ({"readOnly": True}, ["DHIS2 import"]),
            ({"public": False}, ["National health facility registry"]),
            ({"projectId": self.census.id}, ["DHIS2 import", "National health facility registry"]),
            ({"projectIdIn": [self.partner_project.id]}, ["DHIS2 import"]),
            ({"idIn": [self.registry.id, self.partner_registry.id]}, ["National health facility registry"]),
            ({"hasVersions": False}, []),
        ]:
            with self.subTest(filters=filters):
                self.assertEqual([row["name"] for row in self.sources(filters=filters)], expected)

    def test_order(self):
        self.assertEqual(
            self.sources(order=["NAME_DESC"]), [{"name": "National health facility registry"}, {"name": "DHIS2 import"}]
        )

    def test_one_source(self):
        selection = "name versions { number }"
        self.assertEqual(
            self.row("dataSource", self.registry.id, selection),
            {"name": "National health facility registry", "versions": [{"number": 2}, {"number": 1}]},
        )
        # another account's: absent
        self.assertIsNone(self.row("dataSource", self.partner_registry.id, selection))

    def test_versions_lower_the_limit(self):
        message = self.error("{ dataSources(limit: 500) { items { versions { id } } } }")
        self.assertIn("limit must be between 1 and 100 when selecting versions", message)

    # -- sourceVersions --

    def test_the_accounts_versions_newest_first(self):
        self.assertEqual(
            self.versions("id number dataSourceId dataSource { name readOnly }"),
            [
                {
                    "id": self.dhis2_v1.id,
                    "number": 1,
                    "dataSourceId": self.dhis2.id,
                    "dataSource": {"name": "DHIS2 import", "readOnly": True},
                },
                {
                    "id": self.v2.id,
                    "number": 2,
                    "dataSourceId": self.registry.id,
                    "dataSource": {"name": "National health facility registry", "readOnly": False},
                },
                {
                    "id": self.v1.id,
                    "number": 1,
                    "dataSourceId": self.registry.id,
                    "dataSource": {"name": "National health facility registry", "readOnly": False},
                },
            ],
        )

    def test_version_filters(self):
        for filters, expected in [
            ({"dataSourceId": self.registry.id}, [self.v2, self.v1]),
            ({"dataSourceIdIn": [self.dhis2.id, self.partner_registry.id]}, [self.dhis2_v1]),
            ({"number": 2}, [self.v2]),
            ({"isDefault": True}, [self.v2]),
            ({"isDefault": False}, [self.dhis2_v1, self.v1]),
        ]:
            with self.subTest(filters=filters):
                self.assertEqual(self.versions(filters=filters), [{"id": version.id} for version in expected])

    def test_one_version(self):
        selection = "number description dataSource { name }"
        self.assertEqual(
            self.row("sourceVersion", self.v1.id, selection),
            {"number": 1, "description": "First import", "dataSource": {"name": "National health facility registry"}},
        )
        self.assertIsNone(self.row("sourceVersion", self.partner_registry_v1.id, selection))

    # -- permissions --

    def test_needs_a_sources_permission(self):
        self.client.force_authenticate(self.viewer)
        for query in ("{ dataSources { items { id } } }", "{ sourceVersions { items { id } } }"):
            with self.subTest(query=query):
                (error,) = self.execute(query)["errors"]
                self.assertEqual(error["extensions"]["code"], "FORBIDDEN")

    def test_org_units_version_has_its_source_summary(self):
        org_unit = m.OrgUnit.objects.create(name="Kanda", version=self.v1)
        self.assertEqual(
            self.row("orgUnit", org_unit.id, "version { number description dataSource { name public } }"),
            {
                "version": {
                    "number": 1,
                    "description": "First import",
                    "dataSource": {"name": "National health facility registry", "public": False},
                }
            },
        )
