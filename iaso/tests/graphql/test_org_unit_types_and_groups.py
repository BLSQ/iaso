from iaso import models as m
from iaso.permissions.core_permissions import CORE_ORG_UNITS_READ_PERMISSION
from iaso.tests.graphql.base import GraphQLTestCase
from iaso.tests.graphql.fixtures import health_account


class OrgUnitTypesAndGroupsTestCase(GraphQLTestCase):
    """The Ministry of Health's pyramid - regions, then health facilities - and its groups, seen by a data manager;
    the partner NGO's left aside."""

    @classmethod
    def setUpTestData(cls):
        health = health_account(project="Census", app_id="census")
        moh = health.account
        partner_ngo = m.Account.objects.create(name="Partner NGO")
        cls.census = health.project
        cls.partner_project = m.Project.objects.create(
            name="Partner outreach", app_id="partner.outreach", account=partner_ngo
        )

        cls.region = m.OrgUnitType.objects.create(name="Region", short_name="REG", category="REGION", depth=0)
        cls.health_facility = m.OrgUnitType.objects.create(name="Health facility", short_name="HF", depth=1)
        cls.region.sub_unit_types.add(cls.health_facility)
        cls.region.allow_creating_sub_unit_types.add(cls.health_facility)
        cls.region.projects.add(cls.census, cls.partner_project)
        cls.health_facility.projects.add(cls.census)
        cls.mobile_clinic = m.OrgUnitType.objects.create(name="Mobile clinic", short_name="MC", depth=1)
        cls.mobile_clinic.projects.add(cls.partner_project)
        cls.region.sub_unit_types.add(cls.mobile_clinic)  # another account's: not shown

        cls.census_form = m.Form.objects.create(name="Household census")
        cls.census_form.projects.add(cls.census)
        cls.region.reference_forms.add(cls.census_form)

        cls.v1 = health.version
        cls.v2 = m.SourceVersion.objects.create(data_source=health.source, number=2)
        moh.default_version = cls.v2
        moh.save()
        cls.malaria_hotspots = m.Group.objects.create(
            name="Malaria hotspots", source_ref="GrpMal001", source_version=cls.v2
        )
        cls.campaign_sites = m.Group.objects.create(
            name="Campaign 2024 sites", source_version=cls.v2, block_of_countries=True
        )
        cls.archived = m.Group.objects.create(name="Archived sites", source_version=cls.v1)
        partner_source = m.DataSource.objects.create(name="Partner registry")
        partner_source.projects.add(cls.partner_project)
        cls.partner_group = m.Group.objects.create(
            name="Coastal malaria hotspots",
            source_version=m.SourceVersion.objects.create(data_source=partner_source, number=1),
        )

        cls.data_manager = cls.create_user_with_profile(
            username="data_manager", account=moh, permissions=[CORE_ORG_UNITS_READ_PERMISSION]
        )
        cls.viewer = cls.create_user_with_profile(username="viewer", account=moh, permissions=[])

    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.data_manager)

    def types(self, selection="name", **arguments):
        return self.items("orgUnitTypes", selection, **arguments)

    def groups(self, selection="name", **arguments):
        return self.items("groups", selection, **arguments)

    # -- orgUnitTypes --

    def test_the_accounts_types_by_depth_then_name(self):
        self.assertEqual(self.types(), [{"name": "Region"}, {"name": "Health facility"}])
        self.assertEqual(self.types(order=["NAME"]), [{"name": "Health facility"}, {"name": "Region"}])

    def test_type_fields_and_lists_limited_to_the_account(self):
        selection = (
            "name shortName category depth subUnitTypes { name depth } allowCreatingSubUnitTypes { name } "
            "referenceForms { name } projects { name }"
        )
        profiler, types = self.profiled(lambda: self.types(selection, filters={"id": self.region.id}))
        region = types[0]
        self.assertEqual(
            region,
            {
                "name": "Region",
                "shortName": "REG",
                "category": "REGION",
                "depth": 0,
                "subUnitTypes": [{"name": "Health facility", "depth": 1}],
                "allowCreatingSubUnitTypes": [{"name": "Health facility"}],
                "referenceForms": [{"name": "Household census"}],
                "projects": [{"name": "Census"}],
            },
        )
        # the types, then one query per list for the whole page
        with profiler.report_on_failure():
            profiler.assertLessEqualQueryCount(
                {
                    "iaso_orgunittype": 3,  # the types, `subUnitTypes`, `allowCreatingSubUnitTypes`
                    # the account scoping of these 3 (`EXISTS` on the types' projects)
                    "iaso_orgunittype_projects": 3,
                    "iaso_form": 1,  # `referenceForms`
                    "iaso_project_forms": 1,  # their account scoping
                    "iaso_project": 1,  # `projects`
                }
            )

    def test_type_filters(self):
        for filters, expected in [
            ({"search": "reg"}, ["Region"]),
            ({"search": "hf"}, ["Health facility"]),
            ({"category": "REGION"}, ["Region"]),
            ({"depth": 1}, ["Health facility"]),
            ({"projectIdIn": [self.partner_project.id]}, ["Region"]),
        ]:
            with self.subTest(filters=filters):
                self.assertEqual([row["name"] for row in self.types(filters=filters)], expected)

    def test_one_type(self):
        self.assertEqual(self.row("orgUnitType", self.health_facility.id, "name"), {"name": "Health facility"})
        self.assertIsNone(self.row("orgUnitType", self.mobile_clinic.id, "name"))

    def test_org_units_type_is_a_summary(self):
        org_unit = m.OrgUnit.objects.create(name="North Region", org_unit_type=self.region, version=self.v2)
        org_unit.groups.add(self.malaria_hotspots)
        self.assertEqual(
            self.row("orgUnit", org_unit.id, "orgUnitType { name depth } groups { name sourceRef }"),
            {
                "orgUnitType": {"name": "Region", "depth": 0},
                "groups": [{"name": "Malaria hotspots", "sourceRef": "GrpMal001"}],
            },
        )

    # -- groups --

    def test_the_accounts_groups_by_name(self):
        self.assertEqual(
            self.groups(), [{"name": "Archived sites"}, {"name": "Campaign 2024 sites"}, {"name": "Malaria hotspots"}]
        )

    def test_group_fields(self):
        selection = "name sourceRef blockOfCountries sourceVersionId sourceVersion { number dataSource { name } }"
        self.assertEqual(
            self.groups(selection, filters={"id": self.malaria_hotspots.id}),
            [
                {
                    "name": "Malaria hotspots",
                    "sourceRef": "GrpMal001",
                    "blockOfCountries": False,
                    "sourceVersionId": self.v2.id,
                    "sourceVersion": {"number": 2, "dataSource": {"name": "National health facility registry"}},
                }
            ],
        )

    def test_group_filters(self):
        for filters, expected in [
            ({"defaultVersion": True}, ["Campaign 2024 sites", "Malaria hotspots"]),
            ({"defaultVersion": False}, ["Archived sites", "Campaign 2024 sites", "Malaria hotspots"]),
            ({"sourceVersionId": self.v1.id}, ["Archived sites"]),
            ({"blockOfCountries": True}, ["Campaign 2024 sites"]),
            ({"nameIContains": "hotspots"}, ["Malaria hotspots"]),
            ({"sourceRef": "GrpMal001"}, ["Malaria hotspots"]),
        ]:
            with self.subTest(filters=filters):
                self.assertEqual([row["name"] for row in self.groups(filters=filters)], expected)

    def test_one_group(self):
        self.assertEqual(self.row("group", self.campaign_sites.id, "name"), {"name": "Campaign 2024 sites"})
        self.assertIsNone(self.row("group", self.partner_group.id, "name"))

    def test_groups_need_a_permission(self):
        self.client.force_authenticate(self.viewer)
        (error,) = self.execute("{ groups { items { id } } }")["errors"]
        self.assertEqual(error["extensions"]["code"], "FORBIDDEN")
        # the types don't, as `GET /api/v2/orgunittypes/`
        self.assertEqual(self.types(), [{"name": "Region"}, {"name": "Health facility"}])
