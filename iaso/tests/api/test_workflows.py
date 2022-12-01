import typing

from django.utils.timezone import now
from django.contrib.auth.models import AnonymousUser

from pprint import pprint

from iaso import models as m
from iaso.models import Form, Workflow, WorkflowVersion, WorkflowFollowup, WorkflowChange
from iaso.test import APITestCase


def var_dump(what):
    if type(what) is dict:
        pprint(what)
    else:
        pprint(what.__dict__)


class WorkflowsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.now = now()

        star_wars_adults = m.Account.objects.create(name="Star Wars Adults")
        star_wars_children = m.Account.objects.create(name="Star Wars Children")
        marvel = m.Account.objects.create(name="Marvel")

        cls.anon = AnonymousUser()

        # Adult Starwarsian
        cls.yoda = cls.create_user_with_profile(
            username="yoda", account=star_wars_adults, permissions=["iaso_workflows"]
        )

        # Child Starwarsian
        cls.anakin = cls.create_user_with_profile(
            username="anakin", account=star_wars_children, permissions=["iaso_workflows"]
        )

        # He doesn't have permissions
        cls.darthvader = cls.create_user_with_profile(username="darthvader", account=star_wars_adults)

        cls.iron_man = cls.create_user_with_profile(username="iron_man", account=marvel, permissions=["iaso_workflows"])

        cls.project_starwars_adults = m.Project.objects.create(
            name="Hydroponic gardens Adults", app_id="stars.empire.agriculture", account=star_wars_adults
        )

        cls.project_starwars_children = m.Project.objects.create(
            name="Hydroponic gardens Children", app_id="stars.empire.agriculture", account=star_wars_children
        )

        cls.project_marvel = m.Project.objects.create(
            name="SHIELD helicarrier", app_id="marvel.shield.fleet", account=marvel
        )

        cls.form_children_starwars = m.Form.objects.create(
            name="Children Form", form_id="children_form_starwars", created_at=cls.now
        )
        cls.form_adults_starwars = m.Form.objects.create(
            name="Adults Form", form_id="adults_form_starwars", created_at=cls.now
        )

        cls.form_children_marvel = m.Form.objects.create(
            name="Children Form", form_id="children_form_marvel", created_at=cls.now
        )
        cls.form_adults_marvel = m.Form.objects.create(
            name="Adults Form", form_id="adults_form_marvel", created_at=cls.now
        )

        cls.project_starwars_adults.forms.add(cls.form_adults_starwars)
        cls.project_starwars_adults.save()

        cls.project_starwars_children.forms.add(cls.form_children_starwars)
        cls.project_starwars_children.save()

        cls.project_marvel.forms.add(cls.form_children_marvel)
        cls.project_marvel.forms.add(cls.form_adults_marvel)
        cls.project_marvel.save()

        cls.et_children_starwars = m.EntityType.objects.create(
            name="Children of Starwars",
            created_at=cls.now,
            account=star_wars_children,
            reference_form=cls.form_children_starwars,
        )

        cls.et_children_starwars2 = m.EntityType.objects.create(
            name="Children of Starwars 2",
            created_at=cls.now,
            account=star_wars_children,
            reference_form=cls.form_children_starwars,
        )

        cls.et_children_starwars3 = m.EntityType.objects.create(
            name="Children of Starwars 3",
            created_at=cls.now,
            account=star_wars_children,
            reference_form=cls.form_children_starwars,
        )

        cls.et_children_starwars = m.EntityType.objects.create(
            name="Children of Starwars Inaccessible Reference Form",
            created_at=cls.now,
            account=star_wars_children,
            reference_form=cls.form_adults_marvel,
        )
        cls.workflow_et_children_starwars = Workflow.objects.create(entity_type=cls.et_children_starwars)
        cls.workflow_et_children_starwars2 = Workflow.objects.create(entity_type=cls.et_children_starwars2)
        cls.workflow_et_children_starwars3 = Workflow.objects.create(entity_type=cls.et_children_starwars3)

        cls.et_children_marvel = m.EntityType.objects.create(
            name="Children of Marvel", created_at=cls.now, account=marvel, reference_form=cls.form_children_marvel
        )
        cls.workflow_et_children_marvel = Workflow.objects.create(entity_type=cls.et_children_marvel)

        cls.et_adults_starwars = m.EntityType.objects.create(
            name="Adults of Starwars",
            created_at=cls.now,
            account=star_wars_adults,
            reference_form=cls.form_adults_starwars,
        )
        cls.workflow_et_adults_starwars = Workflow.objects.create(entity_type=cls.et_adults_starwars)

        cls.et_adults_marvel = m.EntityType.objects.create(
            name="Adults of Marvel", created_at=cls.now, account=marvel, reference_form=cls.form_adults_marvel
        )

        cls.workflow_et_adults_marvel = Workflow.objects.create(entity_type=cls.et_adults_marvel)

        # This is not accessible, because Project, Entity Type, Workflow and Workflow version are accessible
        # by Star Wars Children But the reference_form is only accessible By Star Wars Adults so ... Nobody is both
        cls.workflow_version_et_children_starwars_inaccessible_reference_form = WorkflowVersion.objects.create(
            workflow=cls.workflow_et_children_starwars,
            name="workflow_version_et_children_starwars V1",
            reference_form=cls.form_adults_starwars,
        )

        cls.workflow_version_et_children_starwars2_inaccessible_followup_form = WorkflowVersion.objects.create(
            workflow=cls.workflow_et_children_starwars2,
            name="workflow_version_et_children_starwars2 V1",
            reference_form=cls.form_children_starwars,
        )

        cls.workflow_version_et_children_starwars3_inaccessible_changes = WorkflowVersion.objects.create(
            workflow=cls.workflow_et_children_starwars3,
            name="workflow_version_et_children_starwars3 V1",
            reference_form=cls.form_children_starwars,
        )

        cls.inaccessible_follow_up = WorkflowFollowup.objects.create(
            order=1, condition="true", workflow=cls.workflow_version_et_children_starwars2_inaccessible_followup_form
        )

        cls.inaccessible_follow_up.forms.add(cls.form_adults_starwars)
        cls.inaccessible_follow_up.save()

        cls.inaccessible_change = WorkflowChange.objects.create(
            form=cls.form_adults_starwars, workflow=cls.workflow_version_et_children_starwars3_inaccessible_changes
        )

        cls.workflow_version_et_adults_starwars = WorkflowVersion.objects.create(
            workflow=cls.workflow_et_adults_starwars,
            name="workflow_version_et_adults_starwars V1",
            reference_form=cls.form_adults_starwars,
        )

    def test_user_without_auth(self):
        response = self.client.get(f"/api/workflow/{self.et_adults_marvel.pk}/")

        var_dump(response)
        var_dump(response.data)

        print("response.data['detail']", response.data["detail"])
        print("type response.data['detail']", type(response.data["detail"]))

        self.assertJSONResponse(response, 403)
        self.assertEqual(response.data["detail"].code, "not_authenticated")
        self.assertEqual(response.data["detail"], "Authentication credentials were not provided.")

    def test_user_anonymous(self):
        self.client.force_authenticate(self.anon)
        response = self.client.get(f"/api/workflow/{self.et_adults_marvel.pk}/")

        var_dump(response)

        self.assertJSONResponse(response, 403)

    def test_user_with_auth_no_permissions(self):
        self.client.force_authenticate(self.darthvader)

        response = self.client.get(f"/api/workflow/{self.et_children_starwars.pk}/")

        var_dump(response)

        self.assertJSONResponse(response, 403)

    def test_user_with_auth_no_access_to_entity_type(self):
        self.client.force_authenticate(self.yoda)

        response = self.client.get(f"/api/workflow/{self.et_adults_marvel.pk}/")

        self.assertJSONResponse(response, 404)
        assert "User profile account != entity_type account" in response.data

    def test_user_with_auth_access_entity_ok_no_access_to_reference_form(self):
        self.client.force_authenticate(self.anakin)

        response = self.client.get(
            f"/api/workflow/{self.et_children_starwars.pk}/?version_id={self.workflow_version_et_children_starwars_inaccessible_reference_form.pk}"
        )

        self.assertJSONResponse(response, 404)
        assert "Cannot Access Reference Form for Workflow Version" in response.data

    def test_user_with_auth_access_entity_ok_no_access_to_follow_ups_form(self):
        self.client.force_authenticate(self.anakin)

        response = self.client.get(
            f"/api/workflow/{self.et_children_starwars2.pk}/?version_id={self.workflow_version_et_children_starwars2_inaccessible_followup_form.pk}"
        )

        self.assertJSONResponse(response, 404)
        assert "Cannot Access FollowUps Form for Workflow" in response.data

    def test_user_with_auth_access_entity_ok_no_access_to_changes_forms(self):
        self.client.force_authenticate(self.anakin)

        response = self.client.get(
            f"/api/workflow/{self.et_children_starwars3.pk}/?version_id={self.workflow_version_et_children_starwars3_inaccessible_changes.pk}"
        )

        self.assertJSONResponse(response, 404)
        assert "Cannot Access Changes Form for Workflow" in response.data

    def test_user_all_access_ok(self):
        self.client.force_authenticate(self.yoda)

        response = self.client.get(f"/api/workflow/{self.et_adults_starwars.pk}/")

        self.assertJSONResponse(response, 200)
        self.assertEqual(response.json()["count"], 1)  # 1 version available

    def test_view_all_versions(self):
        pass

    def test_view_specific_version(self):
        pass

    def test_new_version_empty(self):
        pass

    def test_new_version_from_copy(self):
        pass

    def test_mobile_api(self):
        pass
