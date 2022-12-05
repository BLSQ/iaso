import jsonschema

from django.utils.timezone import now
from django.contrib.auth.models import AnonymousUser

from iaso import models as m
from iaso.models import Form, Workflow, WorkflowVersion, WorkflowFollowup, WorkflowChange
from iaso.test import APITestCase

post_answer_schema = {
    "type": "object",
    "properties": {
        "created_at": {"type": "string"},
        "updated_at": {"type": "string"},
        "name": {"type": "string"},
        "status": {"type": "string"},
        "version_id": {"type": "number"},
    },
    "required": ["created_at", "updated_at", "name", "status", "version_id"],
}


class WorkflowsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.now = now()

        blue_adults = m.Account.objects.create(name="Blue Adults")
        blue_children = m.Account.objects.create(name="Blue Children")
        red_adults = m.Account.objects.create(name="Red Adults")
        red_children = m.Account.objects.create(name="Red Children")

        cls.anon = AnonymousUser()
        cls.blue_adult_1 = cls.create_user_with_profile(
            username="blue_adult_1", account=blue_adults, permissions=["iaso_workflows"]
        )

        cls.blue_child_1 = cls.create_user_with_profile(
            username="blue_child_1", account=blue_children, permissions=["iaso_workflows"]
        )

        # He doesn't have permissions
        cls.blue_adult_np = cls.create_user_with_profile(username="blue_adult_np", account=blue_adults)

        cls.red_adult_1 = cls.create_user_with_profile(
            username="red_adult_1", account=red_adults, permissions=["iaso_workflows"]
        )

        cls.project_blue_adults = m.Project.objects.create(
            name="Blue Adults Project", app_id="blue.adults.project", account=blue_adults
        )

        cls.project_blue_children = m.Project.objects.create(
            name="Blue Children Project", app_id="blue.children.project", account=blue_children
        )

        cls.project_red_adults = m.Project.objects.create(
            name="Red Adult Project", app_id="red.adults.project", account=red_adults
        )

        cls.form_children_blue = m.Form.objects.create(
            name="Blue Children Form", form_id="children_form_blue", created_at=cls.now
        )
        cls.form_adults_blue = m.Form.objects.create(
            name="Blue Adults Form", form_id="adults_form_blue", created_at=cls.now
        )

        cls.form_children_red = m.Form.objects.create(
            name="Red Children Form", form_id="children_form_red", created_at=cls.now
        )
        cls.form_adults_red = m.Form.objects.create(
            name="Red Adults Form", form_id="adults_form_red", created_at=cls.now
        )

        cls.project_blue_adults.forms.add(cls.form_adults_blue)
        cls.project_blue_adults.save()

        cls.project_blue_children.forms.add(cls.form_children_blue)
        cls.project_blue_children.save()

        cls.project_red_adults.forms.add(cls.form_children_red)
        cls.project_red_adults.forms.add(cls.form_adults_red)
        cls.project_red_adults.save()

        cls.et_children_blue = m.EntityType.objects.create(
            name="Children of Blue",
            created_at=cls.now,
            account=blue_children,
            reference_form=cls.form_children_blue,
        )

        cls.et_children_blue2 = m.EntityType.objects.create(
            name="Children of Blue 2",
            created_at=cls.now,
            account=blue_children,
            reference_form=cls.form_children_blue,
        )

        cls.et_children_blue3 = m.EntityType.objects.create(
            name="Children of Blur 3",
            created_at=cls.now,
            account=blue_children,
            reference_form=cls.form_children_blue,
        )

        cls.et_children_blue = m.EntityType.objects.create(
            name="Children of Blur Inaccessible Reference Form",
            created_at=cls.now,
            account=blue_children,  # <--- Entity inaccessible if you are only blue or red
            reference_form=cls.form_adults_red,  # <---
        )
        cls.workflow_et_children_blue = Workflow.objects.create(entity_type=cls.et_children_blue)
        cls.workflow_et_children_blue2 = Workflow.objects.create(entity_type=cls.et_children_blue2)
        cls.workflow_et_children_blue3 = Workflow.objects.create(entity_type=cls.et_children_blue3)

        cls.et_adults_blue = m.EntityType.objects.create(
            name="Adults of Blue",
            created_at=cls.now,
            account=blue_adults,
            reference_form=cls.form_adults_blue,
        )
        cls.workflow_et_adults_blue = Workflow.objects.create(entity_type=cls.et_adults_blue)

        cls.et_children_red = m.EntityType.objects.create(
            name="Children of Red", created_at=cls.now, account=red_children, reference_form=cls.form_children_red
        )
        cls.workflow_et_children_red = Workflow.objects.create(entity_type=cls.et_children_red)

        cls.et_adults_red = m.EntityType.objects.create(
            name="Adults of Red", created_at=cls.now, account=red_adults, reference_form=cls.form_adults_red
        )

        cls.workflow_et_adults_red = Workflow.objects.create(entity_type=cls.et_adults_red)

        # This is not accessible, because Project, Entity Type, Workflow and Workflow version are accessible
        # by Blue Children But the reference_form is only accessible By Blue Adults so ... Nobody is both
        cls.workflow_version_et_children_blue_inaccessible_reference_form = WorkflowVersion.objects.create(
            workflow=cls.workflow_et_children_blue,
            name="workflow_version_et_children_blue V1",
            reference_form=cls.form_adults_blue,
        )

        cls.workflow_version_et_children_blue2_inaccessible_followup_form = WorkflowVersion.objects.create(
            workflow=cls.workflow_et_children_blue2,
            name="workflow_version_et_children_blue2 V1",
            reference_form=cls.form_children_blue,
        )

        cls.workflow_version_et_children_blue3_inaccessible_changes = WorkflowVersion.objects.create(
            workflow=cls.workflow_et_children_blue3,
            name="workflow_version_et_children_blue3 V1",
            reference_form=cls.form_children_blue,
        )

        cls.inaccessible_follow_up = WorkflowFollowup.objects.create(
            order=1, condition="true", workflow=cls.workflow_version_et_children_blue2_inaccessible_followup_form
        )

        cls.inaccessible_follow_up.forms.add(cls.form_adults_blue)
        cls.inaccessible_follow_up.save()

        cls.inaccessible_change = WorkflowChange.objects.create(
            form=cls.form_adults_blue, workflow=cls.workflow_version_et_children_blue3_inaccessible_changes
        )

        cls.workflow_version_et_adults_blue = WorkflowVersion.objects.create(
            workflow=cls.workflow_et_adults_blue,
            name="workflow_version_et_adults_blue V1",
            reference_form=cls.form_adults_blue,
        )

    def test_user_without_auth(self):
        response = self.client.get(f"/api/workflow/{self.et_adults_red.pk}/")

        self.assertJSONResponse(response, 403)
        self.assertEqual(response.data["detail"].code, "not_authenticated")
        self.assertEqual(response.data["detail"], "Authentication credentials were not provided.")

    def test_user_anonymous(self):
        self.client.force_authenticate(self.anon)
        response = self.client.get(f"/api/workflow/{self.et_adults_red.pk}/")

        self.assertJSONResponse(response, 403)
        self.assertEqual(response.data["detail"].code, "permission_denied")
        self.assertEqual(response.data["detail"], "You do not have permission to perform this action.")

    def test_user_with_auth_no_permissions(self):
        self.client.force_authenticate(self.blue_adult_np)

        response = self.client.get(f"/api/workflow/{self.et_children_blue.pk}/")

        self.assertJSONResponse(response, 403)
        self.assertEqual(response.data["detail"].code, "permission_denied")
        self.assertEqual(response.data["detail"], "You do not have permission to perform this action.")

    def test_user_with_auth_no_access_to_entity_type(self):
        self.client.force_authenticate(self.blue_adult_1)

        response = self.client.get(f"/api/workflow/{self.et_adults_red.pk}/")

        self.assertJSONResponse(response, 404)
        assert "User profile account != entity_type account" in response.data

    def test_user_with_auth_access_entity_ok_no_access_to_reference_form(self):
        self.client.force_authenticate(self.blue_child_1)

        response = self.client.get(
            f"/api/workflow/{self.et_children_blue.pk}/?version_id={self.workflow_version_et_children_blue_inaccessible_reference_form.pk}"
        )

        self.assertJSONResponse(response, 404)
        assert "Cannot Access Reference Form for Workflow Version" in response.data

    def test_user_with_auth_access_entity_ok_no_access_to_follow_ups_form(self):
        self.client.force_authenticate(self.blue_child_1)

        response = self.client.get(
            f"/api/workflow/{self.et_children_blue2.pk}/?version_id={self.workflow_version_et_children_blue2_inaccessible_followup_form.pk}"
        )

        self.assertJSONResponse(response, 404)
        assert "Cannot Access FollowUps Form for Workflow" in response.data

    def test_user_with_auth_access_entity_ok_no_access_to_changes_forms(self):
        self.client.force_authenticate(self.blue_child_1)

        response = self.client.get(
            f"/api/workflow/{self.et_children_blue3.pk}/?version_id={self.workflow_version_et_children_blue3_inaccessible_changes.pk}"
        )

        self.assertJSONResponse(response, 404)
        assert "Cannot Access Changes Form for Workflow" in response.data

    def test_user_all_access_ok(self):
        self.client.force_authenticate(self.blue_adult_1)

        set_tl_schema = {
            "type": "object",
            "properties": {
                "count": {"type": "number"},
                "has_next": {"type": "boolean"},
                "has_previous": {"type": "boolean"},
                "limit": {"type": "number"},
                "page": {"type": "number"},
                "pages": {"type": "number"},
                "results": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "status": {"type": "string"},
                            "created_at": {"type": "string"},
                            "updated_at": {"type": "string"},
                            "version_id": {"type": "number"},
                            "name": {"type": "string"},
                        },
                    },
                },
            },
            "required": ["count", "has_next", "has_previous", "limit", "page", "pages", "results"],
        }

        response = self.client.get(f"/api/workflow/{self.et_adults_blue.pk}/")

        self.assertJSONResponse(response, 200)
        self.assertEqual(response.json()["count"], 1)  # 1 version available

        try:
            jsonschema.validate(instance=response.data, schema=set_tl_schema)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

    def test_view_specific_version(self):
        self.client.force_authenticate(self.blue_adult_1)

        set_tl_schema = {
            "type": "object",
            "properties": {
                "status": {"type": "string"},
                "name": {"type": "string"},
                "updated_at": {"type": "string"},
                "reference_form": {"type": "object"},
                "entity_type": {
                    "type": "object",
                    "properties": {"account": {"type": "number"}, "id": {"type": "number"}, "name": {"type": "string"}},
                },
                "follow_ups": {"type": "array"},
                "version_id": {"type": "number"},
            },
            "required": ["status", "name", "updated_at", "reference_form", "entity_type", "follow_ups", "version_id"],
        }

        response = self.client.get(
            f"/api/workflow/{self.et_adults_blue.pk}/?version_id={self.workflow_version_et_adults_blue.pk}"
        )

        self.assertJSONResponse(response, 200)

        try:
            jsonschema.validate(instance=response.data, schema=set_tl_schema)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

    def test_new_version_empty(self):
        self.client.force_authenticate(self.blue_adult_1)

        response = self.client.post(f"/api/workflow/{self.et_adults_blue.pk}/new/")

        self.assertJSONResponse(response, 200)

        try:
            jsonschema.validate(instance=response.data, schema=post_answer_schema)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        try:
            w_version = WorkflowVersion.objects.get(pk=response.data["version_id"])

            assert w_version.pk == response.data["version_id"]
            assert w_version.name == response.data["name"]

        except WorkflowVersion.DoesNotExist as ex:
            self.fail(msg=str(ex))

    def test_new_version_from_copy(self):
        self.client.force_authenticate(self.blue_adult_1)

        response = self.client.post(
            f"/api/workflow/{self.et_adults_blue.pk}/new/?version_id={self.workflow_version_et_adults_blue.pk}"
        )

        self.assertJSONResponse(response, 200)

        try:
            jsonschema.validate(instance=response.data, schema=post_answer_schema)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        try:
            w_version = WorkflowVersion.objects.get(pk=response.data["version_id"])

            assert w_version.pk == response.data["version_id"]
            assert w_version.name == str("Copy of " + self.workflow_version_et_adults_blue.name)

        except WorkflowVersion.DoesNotExist as ex:
            self.fail(msg=str(ex))

    def test_mobile_api_without_app_id(self):
        self.client.force_authenticate(self.blue_adult_1)

        response = self.client.get("/api/mobile/workflow/")

        self.assertJSONResponse(response, 404)

        assert response.data == "No app_id provided"

    def test_mobile_api_with_nonexisting_app_id(self):
        self.client.force_authenticate(self.blue_adult_1)

        response = self.client.get("/api/mobile/workflow/?app_id=wrong_app_id")

        self.assertJSONResponse(response, 404)

        assert response.data == "User not found in Projects for this app id or project not found"

    def test_mobile_api_with_nonaccessible_app_id(self):
        self.client.force_authenticate(self.blue_adult_1)

        response = self.client.get("/api/mobile/workflow/?app_id=red.adults.project")

        self.assertJSONResponse(response, 404)

        assert response.data == "User not found in Projects for this app id or project not found"

    def test_mobile_api_ok(self):
        self.client.force_authenticate(self.blue_adult_1)

        set_tl_schema = {
            "type": "object",
            "properties": {
                "workflows": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "status": {"type": "string"},
                            "created_at": {"type": "number"},
                            "updated_at": {"type": "number"},
                            "version_id": {"type": "number"},
                            "entity_type_id": {"type": "number"},
                            "name": {"type": "string"},
                            "changes": {"type": "array"},
                            "follow_ups": {"type": "array"},
                        },
                    },
                }
            },
            "required": ["workflows"],
        }

        response = self.client.get("/api/mobile/workflow/?app_id=blue.adults.project")

        self.assertJSONResponse(response, 200)

        try:
            jsonschema.validate(instance=response.data, schema=set_tl_schema)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        assert len(response.data["workflows"]) == 1
