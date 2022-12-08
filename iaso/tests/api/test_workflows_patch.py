import jsonschema

from django.utils.timezone import now
from django.contrib.auth.models import AnonymousUser

from iaso import models as m
from iaso.models import Workflow, WorkflowVersion
from iaso.test import APITestCase

from iaso.tests.api.test_workflows import var_dump


class WorkflowsPatchAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.now = now()

        blue_adults = m.Account.objects.create(name="Blue Adults")

        cls.blue_adult_1 = cls.create_user_with_profile(
            username="blue_adult_1", account=blue_adults, permissions=["iaso_workflows"]
        )

        cls.project_blue_adults = m.Project.objects.create(
            name="Blue Adults Project", app_id="blue.adults.project", account=blue_adults
        )

        cls.form_adults_blue = m.Form.objects.create(
            name="Blue Adults Form", form_id="adults_form_blue", created_at=cls.now
        )

        cls.project_blue_adults.forms.add(cls.form_adults_blue)
        cls.project_blue_adults.save()

        cls.et_adults_blue = m.EntityType.objects.create(
            name="Adults of Blue",
            created_at=cls.now,
            account=blue_adults,
            reference_form=cls.form_adults_blue,
        )
        cls.workflow_et_adults_blue = Workflow.objects.create(entity_type=cls.et_adults_blue)

        cls.workflow_version_et_adults_blue = WorkflowVersion.objects.create(
            workflow=cls.workflow_et_adults_blue,
            name="workflow_version_et_adults_blue V1",
            reference_form=cls.form_adults_blue,
        )

    def test_patch_nonexisting_fails(self):
        self.client.force_authenticate(self.blue_adult_1)

        response = self.client.patch(f"/api/workflowversion/1000/", data={"status": "PUBLISHED"})

        var_dump(response)

        self.assertJSONResponse(response, 400)

    def test_patch_transition_forbidden(self):
        pass

    def test_patch_transition_ok(self):
        self.client.force_authenticate(self.blue_adult_1)

        response = self.client.patch(
            f"/api/workflowversion/{self.workflow_version_et_adults_blue.pk}/", data={"status": "PUBLISHED"}
        )

        var_dump(response)
        #
        # 'data': {'created_at': '2022-12-08T15:49:35.770681Z',
        #          iaso - iaso - 1 | 'name': 'workflow_version_et_adults_blue V1',
        #          iaso - iaso - 1 | 'status': 'PUBLISHED',
        #          iaso - iaso - 1 | 'updated_at': '2022-12-08T15:49:35.942069Z',
        #          iaso - iaso - 1 | 'version_id': 1},

        self.assertJSONResponse(response, 200)

    def test_patch_change_name_only(self):
        pass
