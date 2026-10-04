from django.utils import timezone

from iaso import models as m
from iaso.permissions.core_permissions import CORE_SUBMISSIONS_PERMISSION
from iaso.tests.graphql.base import GraphQLTestCase


DESCRIPTOR = {
    "name": "census",
    "type": "survey",
    "children": [{"name": "household", "type": "text", "label": "Household"}],
}


class FormGraphQLTestCase(GraphQLTestCase):
    """A census (two versions, monthly, single per period) and a survey (no version yet) of a Ministry of Health
    project, a deleted form, a form of a project the user isn't restricted to, and a Partner NGO form they must never
    see."""

    @classmethod
    def setUpTestData(cls):
        moh = m.Account.objects.create(name="Ministry of Health")
        cls.project = m.Project.objects.create(name="Health facility monitoring", app_id="hf.monitoring", account=moh)
        cls.other_project = m.Project.objects.create(
            name="Vaccination campaign", app_id="vaccination.campaign", account=moh
        )
        cls.country_type = m.OrgUnitType.objects.create(name="Country", short_name="CTY")

        cls.census = m.Form.objects.create(
            name="Census",
            form_id="census",
            period_type="MONTH",
            single_per_period=True,
            label_keys=["household"],
            possible_fields=[{"name": "household", "type": "text"}],
        )
        cls.census.projects.add(cls.project, cls.other_project)
        cls.census.org_unit_types.add(cls.country_type)
        cls.survey = m.Form.objects.create(name="Survey", form_id="survey", period_type="")
        cls.survey.projects.add(cls.project)
        cls.deleted = m.Form.objects.create(name="Old census", deleted_at=timezone.now())
        cls.deleted.projects.add(cls.project)
        cls.tally_form = m.Form.objects.create(name="Vaccination campaign tally")
        cls.tally_form.projects.add(cls.other_project)

        cls.user = cls.create_user_with_profile(username="data_manager", account=moh)
        cls.submitter = cls.create_user_with_profile(
            username="health_worker", account=moh, permissions=[CORE_SUBMISSIONS_PERMISSION]
        )
        cls.v1 = m.FormVersion.objects.create(
            form=cls.census, version_id="2024010101", file="forms/census_1.xml", created_by=cls.user
        )
        cls.v2 = m.FormVersion.objects.create(
            form=cls.census, version_id="2024020101", start_period="202402", form_descriptor=DESCRIPTOR
        )
        m.FormVersion.objects.create(form=cls.deleted, version_id="1")

        partner_ngo = m.Account.objects.create(name="Partner NGO")
        partner_project = m.Project.objects.create(
            name="Partner outreach", app_id="partner.outreach", account=partner_ngo
        )
        cls.partner_form = m.Form.objects.create(name="Partner household census")
        cls.partner_form.projects.add(partner_project)
        cls.partner_version = m.FormVersion.objects.create(form=cls.partner_form, version_id="1")

        form = m.Form.objects.create(name="Census submissions")
        form.projects.add(cls.project)
        cls.instance = m.Instance.objects.create(
            form=cls.census, form_version=cls.v2, project=cls.project, file="x.xml"
        )

    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.user)

    def forms(self, selection="name", filters=None):
        return self.items("forms", selection, filters=filters or {})

    def names(self, filters=None):
        return [row["name"] for row in self.forms("name", filters)]

    # -- scope --

    def test_only_the_accounts_forms_without_deleted_ones(self):
        self.assertEqual(self.names(), ["Census", "Survey", "Vaccination campaign tally", "Census submissions"])
        self.assertIsNone(self.row("form", self.partner_form.id, "name"))
        self.assertIsNone(self.row("form", self.deleted.id, "name"))

    def test_restricted_to_the_users_projects(self):
        self.user.iaso_profile.projects.set([self.other_project])
        self.client.force_authenticate(m.User.objects.get(pk=self.user.pk))  # a fresh profile, no cached projects
        self.assertEqual(self.names(), ["Census", "Vaccination campaign tally"])

    # -- fields --

    def test_fields(self):
        (census, survey) = self.forms(
            "name odkFormId periodType singlePerPeriod labelKeys possibleFields derived",
            {"idIn": [self.census.id, self.survey.id]},
        )
        self.assertEqual(
            census,
            {
                "name": "Census",
                "odkFormId": "census",
                "periodType": "MONTH",
                "singlePerPeriod": True,
                "labelKeys": ["household"],
                "possibleFields": [{"name": "household", "type": "text"}],
                "derived": False,
            },
        )
        # a blank period type is no period type
        self.assertIsNone(survey["periodType"])
        self.assertEqual(survey["labelKeys"], [])

    def test_lists_are_one_query_each_for_the_page(self):
        selection = (
            "name projects { name } orgUnitTypes { name } latestVersion { versionId } "
            "versions { versionId startPeriod createdBy { username } }"
        )
        profiler, forms = self.profiled(lambda: self.forms(selection))
        rows = {row["name"]: row for row in forms}
        census = rows["Census"]
        self.assertEqual(census["projects"], [{"name": "Health facility monitoring"}, {"name": "Vaccination campaign"}])
        self.assertEqual(census["orgUnitTypes"], [{"name": "Country"}])
        self.assertEqual(census["latestVersion"], {"versionId": "2024020101"})
        self.assertEqual(
            census["versions"],
            [
                {"versionId": "2024020101", "startPeriod": "202402", "createdBy": None},
                {"versionId": "2024010101", "startPeriod": None, "createdBy": {"username": "data_manager"}},
            ],
        )
        self.assertIsNone(rows["Survey"]["latestVersion"])
        self.assertEqual(rows["Survey"]["versions"], [])
        # the forms, then one query per list for the whole page
        with profiler.report_on_failure():
            profiler.assertLessEqualQueryCount(
                {
                    "iaso_form": 1,
                    "iaso_formversion": 2,  # `versions`, `latestVersion`
                    "iaso_orgunittype": 1,
                    "iaso_project": 2,  # the forms' account scoping, `projects`
                }
            )

    def test_versions_lower_the_limit(self):
        self.assertIn(
            "between 1 and 100 when selecting versions",
            self.error("{ forms(limit: 500) { items { versions { id } } } }"),
        )

    # -- filters --

    def test_filters(self):
        self.assertEqual(self.names({"nameIContains": "cens"}), ["Census", "Census submissions"])
        self.assertEqual(self.names({"odkFormIdIn": ["census", "survey"]}), ["Census", "Survey"])
        self.assertEqual(self.names({"periodType": "MONTH"}), ["Census"])
        self.assertEqual(self.names({"singlePerPeriod": True}), ["Census"])
        self.assertEqual(self.names({"orgUnitTypeId": self.country_type.id}), ["Census"])
        # linked to both projects, listed once
        self.assertEqual(
            self.names({"projectIdIn": [self.project.id, self.other_project.id]}),
            ["Census", "Survey", "Vaccination campaign tally", "Census submissions"],
        )
        self.assertEqual(self.names({"projectId": self.other_project.id}), ["Census", "Vaccination campaign tally"])

    # -- form versions --

    def test_form_versions(self):
        selection = "versionId form { name odkFormId } fileUrl"
        items = self.items("formVersions", selection, filters={})
        # newest first, nor the deleted form's version nor the other account's
        self.assertEqual([row["versionId"] for row in items], ["2024020101", "2024010101"])
        self.assertEqual(items[0]["form"], {"name": "Census", "odkFormId": "census"})
        self.assertIsNone(items[0]["fileUrl"])
        self.assertIn("census_1.xml", items[1]["fileUrl"])
        filtered = self.items("formVersions", selection, filters={"versionId": "2024010101"})
        self.assertEqual([row["versionId"] for row in filtered], ["2024010101"])
        self.assertEqual(
            self.row("formVersion", self.v2.id, "versionId formDescriptor"),
            {"versionId": "2024020101", "formDescriptor": DESCRIPTOR},
        )
        self.assertIsNone(self.row("formVersion", self.partner_version.id, "versionId formDescriptor"))

    def test_form_descriptor_lowers_the_limit(self):
        message = self.error("{ formVersions(limit: 500) { items { formDescriptor } } }")
        self.assertIn("between 1 and 100 when selecting formDescriptor", message)

    def test_instance_form_and_version(self):
        self.client.force_authenticate(self.submitter)
        self.assertEqual(
            self.row("submission", self.instance.id, "form { name periodType } formVersion { versionId startPeriod }"),
            {
                "form": {"name": "Census", "periodType": "MONTH"},
                "formVersion": {"versionId": "2024020101", "startPeriod": "202402"},
            },
        )

    def test_one_list_of_each_kind(self):
        self.assertIn(
            "At most 1 `forms` per operation", self.error("{ a: forms { totalCount } b: forms { totalCount } }")
        )
        data = self.data("{ forms { totalCount } formVersions { totalCount } }")
        self.assertEqual(data, {"forms": {"totalCount": 4}, "formVersions": {"totalCount": 2}})
