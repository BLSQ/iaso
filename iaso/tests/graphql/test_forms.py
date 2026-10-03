import re

from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone

from iaso import models as m
from iaso.permissions.core_permissions import CORE_SUBMISSIONS_PERMISSION
from iaso.test import APITestCase


URL = "/api/graphql/"

DESCRIPTOR = {
    "name": "census",
    "type": "survey",
    "children": [{"name": "household", "type": "text", "label": "Household"}],
}


class FormGraphQLTestCase(APITestCase):
    """A census (two versions, monthly, single per period) and a survey (no version yet) of a Star Wars project, a
    deleted form, a form of a project the user isn't restricted to, and a Marvel form they must never see."""

    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")
        cls.project = m.Project.objects.create(name="Hydroponic gardens", app_id="stars.hydroponics", account=star_wars)
        cls.other_project = m.Project.objects.create(name="Moisture farms", app_id="stars.moisture", account=star_wars)
        cls.country_type = m.OrgUnitType.objects.create(name="Country", short_name="Cnt")

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
        cls.farm_form = m.Form.objects.create(name="Farm inventory")
        cls.farm_form.projects.add(cls.other_project)

        cls.user = cls.create_user_with_profile(username="padme", account=star_wars)
        cls.submitter = cls.create_user_with_profile(
            username="anakin", account=star_wars, permissions=[CORE_SUBMISSIONS_PERMISSION]
        )
        cls.v1 = m.FormVersion.objects.create(
            form=cls.census, version_id="2024010101", file="forms/census_1.xml", created_by=cls.user
        )
        cls.v2 = m.FormVersion.objects.create(
            form=cls.census, version_id="2024020101", start_period="202402", form_descriptor=DESCRIPTOR
        )
        m.FormVersion.objects.create(form=cls.deleted, version_id="1")

        marvel = m.Account.objects.create(name="MCU")
        marvel_project = m.Project.objects.create(name="Wakanda outreach", app_id="marvel.app", account=marvel)
        cls.marvel_form = m.Form.objects.create(name="Vibranium census")
        cls.marvel_form.projects.add(marvel_project)
        cls.marvel_version = m.FormVersion.objects.create(form=cls.marvel_form, version_id="1")

        form = m.Form.objects.create(name="Census submissions")
        form.projects.add(cls.project)
        cls.instance = m.Instance.objects.create(
            form=cls.census, form_version=cls.v2, project=cls.project, file="x.xml"
        )

    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.user)

    def data(self, query, variables=None):
        response = self.client.post(URL, {"query": query, "variables": variables or {}}, format="json")
        body = response.json()
        self.assertNotIn("errors", body, body.get("errors"))
        return body["data"]

    def error(self, query, variables=None):
        body = self.client.post(URL, {"query": query, "variables": variables or {}}, format="json").json()
        self.assertIn("errors", body)
        return body["errors"][0]["message"]

    def forms(self, selection="name", filters=None, **arguments):
        query = (
            "query ($filters: FormFilter, $limit: Int!) "
            f"{{ forms(filters: $filters, limit: $limit) {{ items {{ {selection} }} }} }}"
        )
        return self.data(query, {"filters": filters or {}, "limit": arguments.get("limit", 100)})["forms"]["items"]

    def names(self, filters=None):
        return [row["name"] for row in self.forms("name", filters)]

    # -- scope --

    def test_only_the_accounts_forms_without_deleted_ones(self):
        self.assertEqual(self.names(), ["Census", "Survey", "Farm inventory", "Census submissions"])
        query = "query ($id: Int!) { form(id: $id) { name } }"
        self.assertIsNone(self.data(query, {"id": self.marvel_form.id})["form"])
        self.assertIsNone(self.data(query, {"id": self.deleted.id})["form"])

    def test_restricted_to_the_users_projects(self):
        self.user.iaso_profile.projects.set([self.other_project])
        self.client.force_authenticate(m.User.objects.get(pk=self.user.pk))  # a fresh profile, no cached projects
        self.assertEqual(self.names(), ["Census", "Farm inventory"])

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
        with CaptureQueriesContext(connection) as context:
            rows = {row["name"]: row for row in self.forms(selection)}
        census = rows["Census"]
        self.assertEqual(census["projects"], [{"name": "Hydroponic gardens"}, {"name": "Moisture farms"}])
        self.assertEqual(census["orgUnitTypes"], [{"name": "Country"}])
        self.assertEqual(census["latestVersion"], {"versionId": "2024020101"})
        self.assertEqual(
            census["versions"],
            [
                {"versionId": "2024020101", "startPeriod": "202402", "createdBy": None},
                {"versionId": "2024010101", "startPeriod": None, "createdBy": {"username": "padme"}},
            ],
        )
        self.assertIsNone(rows["Survey"]["latestVersion"])
        self.assertEqual(rows["Survey"]["versions"], [])
        # the forms, then one query per list for the whole page
        form_queries = [
            q["sql"] for q in context.captured_queries if re.search(r"iaso_form|iaso_project_forms", q["sql"])
        ]
        self.assertEqual(len(form_queries), 5, form_queries)

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
            ["Census", "Survey", "Farm inventory", "Census submissions"],
        )
        self.assertEqual(self.names({"projectId": self.other_project.id}), ["Census", "Farm inventory"])

    # -- form versions --

    def test_form_versions(self):
        query = "query ($filters: FormVersionFilter) { formVersions(filters: $filters) { items { versionId form { name odkFormId } fileUrl } } }"
        items = self.data(query, {"filters": {}})["formVersions"]["items"]
        # newest first, nor the deleted form's version nor the other account's
        self.assertEqual([row["versionId"] for row in items], ["2024020101", "2024010101"])
        self.assertEqual(items[0]["form"], {"name": "Census", "odkFormId": "census"})
        self.assertIsNone(items[0]["fileUrl"])
        self.assertIn("census_1.xml", items[1]["fileUrl"])
        filtered = self.data(query, {"filters": {"versionId": "2024010101"}})["formVersions"]["items"]
        self.assertEqual([row["versionId"] for row in filtered], ["2024010101"])
        single = "query ($id: Int!) { formVersion(id: $id) { versionId formDescriptor } }"
        self.assertEqual(
            self.data(single, {"id": self.v2.id})["formVersion"],
            {"versionId": "2024020101", "formDescriptor": DESCRIPTOR},
        )
        self.assertIsNone(self.data(single, {"id": self.marvel_version.id})["formVersion"])

    def test_form_descriptor_lowers_the_limit(self):
        message = self.error("{ formVersions(limit: 500) { items { formDescriptor } } }")
        self.assertIn("between 1 and 100 when selecting formDescriptor", message)

    def test_instance_form_and_version(self):
        self.client.force_authenticate(self.submitter)
        query = (
            "query ($id: Int!) { instance(id: $id) { form { name periodType } formVersion { versionId startPeriod } } }"
        )
        self.assertEqual(
            self.data(query, {"id": self.instance.id})["instance"],
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
