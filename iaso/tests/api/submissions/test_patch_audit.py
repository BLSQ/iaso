import json

from rest_framework import status

from hat.api_import.models import APIImport
from iaso import models as m
from iaso.tests.api.submissions.fixtures import URL, SubmissionsTestCase, requires_odk_cli


@requires_odk_cli
class SubmissionsPatchAuditTestCase(SubmissionsTestCase):
    """Every PATCH kept in an `APIImport` too, refused or not."""

    def setUp(self):
        super().setUp()
        self.instance = self.create()
        self.creation_import = self.instance.api_import

    def patch(self, body, instance_id=None, query=""):
        return self.client.patch(f"{URL}{instance_id or self.instance.id}/{query}", body, format="json")

    def assertAudit(self, data, *, has_problem, json_body, app_id=None):
        api_import = APIImport.objects.exclude(id=self.creation_import.id).get()
        self.assertEqual(data["import_id"], api_import.id)
        self.assertEqual(
            (api_import.user, api_import.import_type, api_import.has_problem, api_import.app_id, api_import.json_body),
            (self.user, "submissionsJson", has_problem, app_id or self.project.app_id, json_body),
        )
        return api_import

    def test_patched(self):
        body = {"content": {"population": 5}}

        data = self.assertJSONResponse(self.patch(body), status.HTTP_200_OK)

        self.assertResponseCompliantToSwagger(data, "SubmissionPatchResult")
        api_import = self.assertAudit(
            data, has_problem=False, json_body={"submission_id": str(self.instance.id), **body}
        )
        self.assertEqual(api_import.exception, "")
        self.instance.refresh_from_db()
        self.assertEqual(self.instance.api_import, self.creation_import, "still the import that created it")

    def test_refused_kept_with_its_errors(self):
        data = self.assertJSONResponse(self.patch({"content": {"population": -1}}), status.HTTP_400_BAD_REQUEST)

        self.assertResponseCompliantToSwagger(data, "SubmissionErrors")
        api_import = self.assertAudit(
            data, has_problem=True, json_body={"submission_id": str(self.instance.id), "content": {"population": -1}}
        )
        self.assertEqual(json.loads(api_import.exception), {"errors": data["errors"]})
        self.assertEqual(data["errors"][0]["code"], "CONSTRAINT")

    def test_malformed_kept(self):
        data = self.assertJSONResponse(self.patch({"content": "x"}), status.HTTP_400_BAD_REQUEST)

        self.assertAudit(data, has_problem=True, json_body={"submission_id": str(self.instance.id), "content": "x"})

    def test_dry_run_kept_without_problem(self):
        data = self.assertJSONResponse(self.patch({"period": "202612"}, query="?dry_run=true"), status.HTTP_200_OK)

        self.assertAudit(
            data, has_problem=False, json_body={"submission_id": str(self.instance.id), "period": "202612"}
        )

    def test_not_found_and_locked_kept(self):
        data = self.assertJSONResponse(self.patch({"period": "202612"}, instance_id=999999), status.HTTP_404_NOT_FOUND)
        self.assertAudit(data, has_problem=True, json_body={"submission_id": "999999", "period": "202612"})
        APIImport.objects.exclude(id=self.creation_import.id).delete()

        m.InstanceLock.objects.create(instance=self.instance, locked_by=self.user, top_org_unit=self.flanders)
        self.user.iaso_profile.org_units.set([self.antwerp])
        data = self.assertJSONResponse(self.patch({"period": "202612"}), status.HTTP_403_FORBIDDEN)
        self.assertAudit(data, has_problem=True, json_body={"submission_id": str(self.instance.id), "period": "202612"})

    def test_app_id_of_the_submissions_project(self):
        malaria = m.Project.objects.create(name="Belgium malaria", app_id="be.malaria", account=self.account)
        self.instance.project = malaria
        self.instance.save()
        self.form.projects.add(malaria)

        data = self.assertJSONResponse(self.patch({"period": "202612"}), status.HTTP_200_OK)

        self.assertAudit(
            data,
            has_problem=False,
            json_body={"submission_id": str(self.instance.id), "period": "202612"},
            app_id="be.malaria",
        )
