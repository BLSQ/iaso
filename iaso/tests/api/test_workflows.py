import typing

from django.utils.timezone import now
from django.contrib.auth.models import AnonymousUser

from pprint import pprint

from iaso import models as m
from iaso.api.common import CONTENT_TYPE_XLSX
from iaso.models import Form
from iaso.test import APITestCase


def var_dump(what):
    pprint(what.__dict__)


class WorkflowsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.now = now()

        star_wars = m.Account.objects.create(name="Star Wars")
        marvel = m.Account.objects.create(name="Marvel")

        cls.anon = AnonymousUser()
        cls.yoda = cls.create_user_with_profile(
            username="yoda", account=star_wars, permissions=["menupermissions.iaso_workflows"]
        )
        cls.iron_man = cls.create_user_with_profile(username="iron_man", account=marvel)

        cls.project_starwars = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture", account=star_wars
        )

        cls.project_marvel = m.Project.objects.create(
            name="SHIELD helicarrier", app_id="marvel.shield.fleet", account=star_wars
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

        cls.project_starwars.forms.add(cls.form_children_starwars)
        cls.project_starwars.forms.add(cls.form_adults_starwars)
        cls.project_starwars.save()

        cls.project_marvel.forms.add(cls.form_children_marvel)
        cls.project_marvel.forms.add(cls.form_adults_marvel)
        cls.project_marvel.save()

        cls.et_children_starwars = m.EntityType.objects.create(
            name="Children of Starwars",
            created_at=cls.now,
            account=star_wars,
            reference_form=cls.form_children_starwars,
        )

        cls.et_children_marvel = m.EntityType.objects.create(
            name="Children of Marvel", created_at=cls.now, account=marvel, reference_form=cls.form_children_marvel
        )

        cls.et_adults_starwars = m.EntityType.objects.create(
            name="Adults of Starwars", created_at=cls.now, account=star_wars, reference_form=cls.form_adults_starwars
        )

        cls.et_adults_marvel = m.EntityType.objects.create(
            name="Adults of Marvel", created_at=cls.now, account=marvel, reference_form=cls.form_adults_marvel
        )

    def test_user_without_auth(self):
        response = self.client.get(f"/api/workflow/{self.et_adults_marvel.pk}/")

        var_dump(response)

        self.assertJSONResponse(response, 403)

    def test_user_anonymous(self):
        self.client.force_authenticate(self.anon)
        response = self.client.get(f"/api/workflow/{self.et_adults_marvel.pk}/")

        var_dump(response)

        self.assertJSONResponse(response, 403)

    def test_user_with_auth_no_access_to_entity_type(self):
        self.client.force_authenticate(self.yoda)

        response = self.client.get(f"/api/workflow/{self.et_adults_marvel.pk}/")

        var_dump(response)

        self.assertJSONResponse(response, 403)

    # def test_user_with_auth_access_entity_ok_no_access_to_reference_form(self):
    #     pass
    #
    # def test_user_with_auth_access_entity_ok_no_access_to_follow_ups_form(self):
    #     pass
    #
    # def test_user_with_auth_access_entity_ok_no_access_to_changes_forms(self):
    #     pass
    #
    # def test_user_all_access_ok(self):
    #     pass
    #
    # def test_view_all_versions(self):
    #     pass
    #
    # def test_view_specific_version(self):
    #     pass
    #
    # def test_new_version_empty(self):
    #     pass
    #
    # def test_new_version_from_copy(self):
    #     pass
    #
    # def test_mobile_api(self):
    #     pass
