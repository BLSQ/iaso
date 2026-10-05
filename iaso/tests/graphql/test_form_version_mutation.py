import io
import json

import openpyxl

from django.core.files.uploadedfile import SimpleUploadedFile

from iaso import models as m
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.tests.graphql.base import URL, GraphQLTestCase


FIXTURES = "iaso/tests/fixtures"

CREATE = """
mutation ($formId: Int!, $xlsFile: Upload!, $startPeriod: String, $endPeriod: String, $force: Boolean) {
  createFormVersion(
    formId: $formId, xlsFile: $xlsFile, startPeriod: $startPeriod, endPeriod: $endPeriod, force: $force
  ) {
    formVersion { versionId formId startPeriod endPeriod fileUrl xlsFileUrl form { odkFormId } }
    errors { code message field question }
    warnings { code message question }
  }
}
"""


class FormVersionMutationSetUp(GraphQLTestCase):
    """A monthly form of the Ministry of Health, given a version by the national admin."""

    @classmethod
    def setUpTestData(cls):
        account = m.Account.objects.create(name="Ministry of Health")
        cls.project = m.Project.objects.create(name="Census", app_id="census", account=account)
        cls.form = m.Form.objects.create(name="Census", period_type="MONTH")  # no form_id yet: no version
        cls.form.projects.add(cls.project)
        cls.national_admin = cls.create_user_with_profile(
            username="national_admin", account=account, permissions=[CORE_FORMS_PERMISSION]
        )
        cls.viewer = cls.create_user_with_profile(username="viewer", account=account, permissions=[])
        partner_ngo = m.Account.objects.create(name="Partner NGO")
        cls.partner_form = m.Form.objects.create(name="Partner household census")
        cls.partner_form.projects.add(
            m.Project.objects.create(name="Partner outreach", app_id="partner.outreach", account=partner_ngo)
        )

    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.national_admin)

    # -- helpers --

    def upload(self, fixture="odk_form_valid_sample1_2020022401.xlsx", content=None, preflight=True, **variables):
        """The response to a multipart request: `fixture` (or `content`) as `$xlsFile`."""
        if content is None:
            with open(f"{FIXTURES}/{fixture}", "rb") as file:
                content = file.read()
        operations = {"query": CREATE, "variables": {"formId": self.form.id, "xlsFile": None, **variables}}
        headers = {"HTTP_GRAPHQL_PREFLIGHT": "1"} if preflight else {}
        return self.client.post(
            URL,
            {
                "operations": json.dumps(operations),
                "map": json.dumps({"0": ["variables.xlsFile"]}),
                "0": SimpleUploadedFile(fixture, content),
            },
            format="multipart",
            **headers,
        )

    def created(self, **kwargs):
        response = self.upload(**kwargs)
        self.assertEqual(response.status_code, 200, response.content)
        body = response.json()
        self.assertNotIn("errors", body, body.get("errors"))
        self.assertEqual(body["data"]["createFormVersion"]["errors"], [])
        return body["data"]["createFormVersion"]["formVersion"]

    def refused(self, **kwargs):
        """The payload's `errors`, as `(code, field, question)`, after checking nothing was created."""
        versions = m.FormVersion.objects.count()
        body = self.upload(**kwargs).json()
        self.assertNotIn("errors", body, body.get("errors"))
        payload = body["data"]["createFormVersion"]
        self.assertIsNone(payload["formVersion"])
        self.assertEqual(m.FormVersion.objects.count(), versions)
        return [(error["code"], error["field"], error["question"]) for error in payload["errors"]]


class CreateFormVersionTestCase(FormVersionMutationSetUp):
    # -- created --

    def test_created_from_the_xlsform(self):
        version = self.created(startPeriod="202401", endPeriod="202412")
        self.assertEqual(
            {key: version[key] for key in ("versionId", "formId", "startPeriod", "endPeriod", "form")},
            {
                "versionId": "2020022401",
                "formId": self.form.id,
                "startPeriod": "202401",
                "endPeriod": "202412",
                "form": {"odkFormId": "sample1"},
            },
        )
        self.assertTrue(version["fileUrl"] and version["xlsFileUrl"])
        created = m.FormVersion.objects.get()
        self.assertEqual((created.created_by, created.updated_by), (self.national_admin, self.national_admin))
        self.assertGreater(created.xls_file.size, 100)
        self.assertIn(b"<h:html", created.file.read())
        self.form.refresh_from_db()
        self.assertEqual(self.form.form_id, "sample1")

    def test_the_next_version(self):
        self.created()
        self.assertEqual(self.created(fixture="odk_form_valid_sample1_2020022402.xlsx")["versionId"], "2020022402")
        # not the same version again
        (refusal,) = self.refused(fixture="odk_form_valid_sample1_2020022402.xlsx")
        self.assertEqual(refusal, ("INVALID_XLSFORM", ["xlsFile"], None))

    # -- refused --

    def test_every_problem_of_the_xlsform_with_its_question(self):
        refusals = self.refused(fixture="odk_invalid_xlsform.xlsx")
        messages = self.upload(fixture="odk_invalid_xlsform.xlsx").json()["data"]["createFormVersion"]["errors"]
        self.assertIn(
            "survey sheet, row 44: duplicated question name 'date_test'", [error["message"] for error in messages]
        )
        self.assertEqual(len(refusals), 26)
        self.assertEqual({code for code, _field, _question in refusals}, {"INVALID_XLSFORM"})
        self.assertIn(("INVALID_XLSFORM", ["xlsFile"], "duplicate_name"), refusals)
        self.assertIn(("INVALID_XLSFORM", ["xlsFile"], "hidden_field"), refusals)

    def test_xlsform_pyxform_refuses(self):
        self.assertEqual(
            self.refused(fixture="odk_form_blatantly_invalid.xlsx"), [("INVALID_XLSFORM", ["xlsFile"], None)]
        )

    def test_not_an_xlsform(self):
        self.assertEqual(self.refused(fixture="notes.txt", content=b"hello"), [("INVALID", ["xlsFile"], None)])
        self.assertEqual(self.refused(fixture="fake.xlsx", content=b"hello"), [("INVALID_XLSFORM", ["xlsFile"], None)])

    def test_the_form_id_stays_and_isnt_another_forms(self):
        self.form.form_id = "census"
        self.form.save()
        self.assertEqual(self.refused(), [("INVALID_XLSFORM", ["xlsFile"], None)])
        self.form.form_id = None
        self.form.save()
        other = m.Form.objects.create(name="Other", form_id="sample1")
        other.projects.add(self.project)
        self.assertEqual(self.refused(), [("INVALID_XLSFORM", ["xlsFile"], None)])

    def test_the_xlsform_along_with_the_periods(self):
        refusals = self.refused(fixture="odk_invalid_xlsform.xlsx", startPeriod="202413")
        self.assertEqual(refusals[0], ("INVALID", ["startPeriod"], None))
        self.assertEqual(len(refusals), 1 + 26)

    def test_periods_all_at_once(self):
        self.assertEqual(
            self.refused(startPeriod="202413", endPeriod="2024Q1"),
            [("INVALID", ["startPeriod"], None), ("INVALID", ["endPeriod"], None)],
        )
        self.assertEqual(self.refused(startPeriod="202405", endPeriod="202401"), [("INVALID", ["endPeriod"], None)])

    def test_form_visible_to_the_user(self):
        self.assertEqual(self.refused(formId=self.partner_form.id), [("NOT_FOUND", ["formId"], None)])

    def test_permission(self):
        self.client.force_authenticate(self.viewer)
        (error,) = self.upload().json()["errors"]
        self.assertEqual(error["extensions"]["code"], "FORBIDDEN")
        self.assertFalse(m.FormVersion.objects.exists())

    # -- the multipart request --

    def test_needs_the_preflight_header(self):
        # a cross-site form can't send it: without it, a multipart request is refused
        response = self.upload(preflight=False)
        self.assertEqual(response.status_code, 400)
        self.assertIn("GraphQL-Preflight", response.json()["errors"][0]["message"])
        self.assertFalse(m.FormVersion.objects.exists())

    def test_malformed_multipart_requests(self):
        headers = {"HTTP_GRAPHQL_PREFLIGHT": "1"}
        response = self.client.post(URL, {"map": "{}"}, format="multipart", **headers)
        self.assertEqual(
            (response.status_code, response.json()["errors"][0]["message"]),
            (400, "The multipart request has no 'operations' part"),
        )
        response = self.client.post(URL, {"operations": "[]", "map": "{}"}, format="multipart", **headers)
        self.assertEqual(
            (response.status_code, response.json()["errors"][0]["message"]), (400, "One operation per request")
        )
        response = self.client.post(URL, {"operations": "{", "map": "{}"}, format="multipart", **headers)
        self.assertEqual(response.status_code, 400)


def xlsform(version: str, *questions: str) -> bytes:
    """A small XLSForm of the `census` form: `questions` as `"type name"`."""
    workbook = openpyxl.Workbook()
    survey = workbook.active
    survey.title = "survey"
    survey.append(["type", "name", "label"])
    for question in questions:
        kind, name = question.split()
        survey.append([kind, name, name.capitalize()])
    settings = workbook.create_sheet("settings")
    settings.append(["form_title", "form_id", "version"])
    settings.append(["Census", "census", version])
    content = io.BytesIO()
    workbook.save(content)
    return content.getvalue()


class StructuralChangesTestCase(FormVersionMutationSetUp):
    """A census of households - `age`, `name`, `size` - whose next version removes or retypes questions."""

    def setUp(self):
        super().setUp()
        self.created(fixture="census.xlsx", content=xlsform("2024010101", "integer age", "text name", "integer size"))

    def next_version(self, *questions, force=None):
        """The payload of the next version, of `questions`."""
        variables = {"force": force} if force is not None else {}
        body = self.upload(fixture="census.xlsx", content=xlsform("2024010102", *questions), **variables).json()
        self.assertNotIn("errors", body, body.get("errors"))
        return body["data"]["createFormVersion"]

    def codes(self, warnings):
        return [(warning["code"], warning["question"]) for warning in warnings]

    def test_added_questions_are_harmless(self):
        payload = self.next_version("integer age", "text name", "integer size", "text phone")
        self.assertEqual((payload["errors"], payload["warnings"]), ([], []))
        self.assertEqual(payload["formVersion"]["versionId"], "2024010102")

    def test_refused_without_force(self):
        payload = self.next_version("text age", "integer size")
        self.assertIsNone(payload["formVersion"])
        self.assertEqual(
            [(error["code"], error["field"]) for error in payload["errors"]], [("UNCONFIRMED_CHANGES", ["force"])]
        )
        self.assertEqual(
            self.codes(payload["warnings"]), [("QUESTION_REMOVED", "name"), ("QUESTION_TYPE_CHANGED", "age")]
        )
        self.assertIn("integer -> text", payload["warnings"][1]["message"])
        self.assertEqual(m.FormVersion.objects.count(), 1)

    def test_created_with_force_warnings_kept(self):
        payload = self.next_version("text age", "integer size", force=True)
        self.assertEqual(payload["errors"], [])
        self.assertEqual(payload["formVersion"]["versionId"], "2024010102")
        self.assertEqual(
            self.codes(payload["warnings"]), [("QUESTION_REMOVED", "name"), ("QUESTION_TYPE_CHANGED", "age")]
        )

    def test_with_other_errors(self):
        payload = self.upload(
            fixture="census.xlsx", content=xlsform("2024010102", "integer size"), startPeriod="2024Q1"
        ).json()["data"]["createFormVersion"]
        self.assertEqual({error["code"] for error in payload["errors"]}, {"INVALID", "UNCONFIRMED_CHANGES"})
        self.assertEqual(len(payload["warnings"]), 2)

    def test_what_the_entity_workflows_read(self):
        account = self.project.account
        people = m.EntityType.objects.create(name="Households", reference_form=self.form, account=account)
        version = m.WorkflowVersion.objects.create(
            workflow=m.Workflow.objects.create(entity_type=people), name="Visits", status="PUBLISHED"
        )
        m.WorkflowFollowup.objects.create(
            workflow_version=version, order=1, condition={"and": [{">": [{"var": "age"}, 60]}, {"var": ["size", 0]}]}
        )
        visit = m.Form.objects.create(name="Visit")
        # a change of a visit, writing the household's `name`
        m.WorkflowChange.objects.create(workflow_version=version, form=visit, mapping={"head": "name", "count": "size"})
        # this form as a change's own: its `name` written to another entity type's attribute
        other = m.EntityType.objects.create(
            name="People", reference_form=m.Form.objects.create(name="Person"), account=account
        )
        other_version = m.WorkflowVersion.objects.create(
            workflow=m.Workflow.objects.create(entity_type=other), name="Moves"
        )
        m.WorkflowChange.objects.create(workflow_version=other_version, form=self.form, mapping={"name": "household"})
        # deleted: ignored
        deleted = m.WorkflowVersion.objects.create(workflow=people.workflow, name="Old")
        m.WorkflowFollowup.objects.create(workflow_version=deleted, condition={"var": "name"})
        deleted.delete()

        warnings = self.next_version("text age", "integer size")["warnings"]
        self.assertEqual(
            self.codes(warnings),
            [
                ("QUESTION_REMOVED", "name"),
                ("QUESTION_TYPE_CHANGED", "age"),
                ("WORKFLOW_CONDITION", "age"),
                ("WORKFLOW_MAPPING", "name"),
                ("WORKFLOW_MAPPING", "name"),
            ],
        )
        self.assertEqual(
            warnings[2]["message"],
            "Question 'age' changes type, integer -> text, but the condition of follow-up 1 of workflow version "
            "'Visits' (PUBLISHED) of entity type 'Households' reads it",
        )
        self.assertIn("maps 'head' to 'name'", warnings[3]["message"])
        self.assertIn("maps 'name' to 'household'", warnings[4]["message"])
