import csv
import datetime
import io
import uuid
from http.client import responses

from rest_framework import status

from iaso.api.org_unit_change_requests.views import OrgUnitChangeRequestViewSet
from iaso.utils.models.common import get_creator_name
import time_machine

from django.contrib.auth.models import Group

from iaso.test import APITestCase
from django.contrib.gis.geos import Point
from iaso import models as m


class OrgUnitChangeRequestAPITestCase(APITestCase):
    """
    Test actions on the ViewSet.
    """

    DT = datetime.datetime(2023, 10, 17, 17, 0, 0, 0, tzinfo=datetime.timezone.utc)

    @classmethod
    def setUpTestData(cls):
        cls.account_pokemon = m.Account.objects.create(name="Pokemon")
        cls.project_johto = m.Project.objects.create(
            name="Project Johto", account=cls.account_pokemon, app_id="pokemon"
        )

        cls.user_ash_ketchum = cls.create_user_with_profile(username="Ash Ketchum", account=cls.account_pokemon)
        cls.user_misty = cls.create_user_with_profile(username="Misty", account=cls.account_pokemon)
        cls.user_brock = cls.create_user_with_profile(username="Brock", account=cls.account_pokemon)

        cls.ou_type_fire_pokemons = m.OrgUnitType.objects.create(name="Fire Pokemons")
        cls.ou_type_rock_pokemons = m.OrgUnitType.objects.create(name="Rock Pokemons")
        cls.ou_type_water_pokemons = m.OrgUnitType.objects.create(name="Water Pokemons")

        cls.group_set_ash_pokemons = m.GroupSet.objects.create(name="Ash's Pokemons")
        cls.group_set_misty_pokemons = m.GroupSet.objects.create(name="Misty's Pokemons")
        cls.group_set_brock_pokemons = m.GroupSet.objects.create(name="Brock's Pokemons")

        cls.group_season_1 = m.Group.objects.create(name="Season 1")
        cls.group_season_2 = m.Group.objects.create(name="Season 2")
        cls.group_season_3 = m.Group.objects.create(name="Season 3")

        cls.org_unit_charizard = m.OrgUnit.objects.create(
            name="Charizard",
            org_unit_type=cls.ou_type_fire_pokemons,
        )
        cls.org_unit_starmie = m.OrgUnit.objects.create(
            name="Starmie",
            org_unit_type=cls.ou_type_water_pokemons,
        )
        cls.org_unit_onix = m.OrgUnit.objects.create(
            name="Onix",
            org_unit_type=cls.ou_type_rock_pokemons,
        )

        cls.form_ember = m.Form.objects.create(name="Form Ember")
        cls.form_water_gun = m.Form.objects.create(name="Form Water Gun")
        cls.form_rock_throw = m.Form.objects.create(name="Form Rock Throw")

        cls.org_unit_charizard.groups.set([cls.group_season_1])
        cls.org_unit_onix.groups.set([cls.group_season_2])
        cls.org_unit_starmie.groups.set([cls.group_season_3])

        cls.group_set_brock_pokemons.groups.set([cls.group_season_1, cls.group_season_2])
        cls.group_set_ash_pokemons.groups.set([cls.group_season_2, cls.group_season_3])
        cls.group_set_misty_pokemons.groups.set([cls.group_season_1, cls.group_season_3])

        cls.oucrc_type_fire = m.OrgUnitChangeRequestConfiguration.objects.create(
            org_unit_type=cls.ou_type_fire_pokemons,
            project=cls.project_johto,
            created_by=cls.user_ash_ketchum,
            editable_fields=["name", "aliases", "location", "opening_date", "closing_date"],
        )
        cls.oucrc_type_water = m.OrgUnitChangeRequestConfiguration.objects.create(
            org_unit_type=cls.ou_type_water_pokemons,
            project=cls.project_johto,
            created_by=cls.user_misty,
            org_units_editable=False,
        )
        cls.oucrc_type_rock = m.OrgUnitChangeRequestConfiguration.objects.create(
            org_unit_type=cls.ou_type_rock_pokemons,
            project=cls.project_johto,
            created_by=cls.user_brock,
            editable_fields=["org_unit_type", "parent_type", "group_sets", "reference_forms", "other_groups"],
        )

        cls.other_group_1 = m.Group.objects.create(name="Other group 1")
        cls.other_group_2 = m.Group.objects.create(name="Other group 2")
        cls.other_group_3 = m.Group.objects.create(name="Other group 3")

        cls.oucrc_type_water.possible_types.set([cls.ou_type_water_pokemons, cls.ou_type_fire_pokemons])
        cls.oucrc_type_water.possible_parent_types.set([cls.ou_type_water_pokemons, cls.ou_type_rock_pokemons])
        cls.oucrc_type_water.group_sets.set([cls.group_set_misty_pokemons])
        cls.oucrc_type_water.editable_reference_forms.set([cls.form_water_gun])
        cls.oucrc_type_water.other_groups.set([cls.other_group_1, cls.other_group_3])

    def test_list_ok(self):
        self.client.force_authenticate(self.user_ash_ketchum)

        # with self.assertNumQueries(12):
        # filter_for_user_and_app_id
        #   1. SELECT OrgUnit
        # get_queryset
        #   2. COUNT(*)
        #   3. SELECT OrgUnitChangeRequest
        # prefetch
        #   4. PREFETCH OrgUnit.groups
        #   5. PREFETCH OrgUnit.reference_instances
        #   6. PREFETCH OrgUnit.reference_instances__form
        #   7. PREFETCH OrgUnitChangeRequest.new_groups
        #   8. PREFETCH OrgUnitChangeRequest.old_groups
        #   9. PREFETCH OrgUnitChangeRequest.new_reference_instances
        #  10. PREFETCH OrgUnitChangeRequest.old_reference_instances
        #  11. PREFETCH OrgUnitChangeRequest.{new/old}_reference_instances__form
        #  12. PREFETCH OrgUnitChangeRequest.org_unit_type.projects
        response = self.client.get("/api/orgunits/changes/configs/")
        self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(3, len(response.data["results"]))

    def test_list_without_auth(self):
        response = self.client.get("/api/orgunits/changes/configs/")
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_ok(self):
        self.client.force_authenticate(self.user_misty)
        response = self.client.get(f"/api/orgunits/changes/configs/{self.oucrc_type_water.id}/")
        self.assertJSONResponse(response, status.HTTP_200_OK)

        result = response.data
        self.assertEqual(self.oucrc_type_water.id, result["id"])
        self.assertEqual(str(self.oucrc_type_water.uuid), result["uuid"])
        self.assertEqual(self.oucrc_type_water.project_id, result["project"]["id"])
        self.assertEqual(self.oucrc_type_water.project.name, result["project"]["name"])
        self.assertEqual(self.oucrc_type_water.org_unit_type_id, result["org_unit_type"]["id"])
        self.assertEqual(self.oucrc_type_water.org_unit_type.name, result["org_unit_type"]["name"])
        self.assertEqual(self.oucrc_type_water.org_units_editable, result["org_units_editable"])
        self.assertCountEqual(self.oucrc_type_water.editable_fields, result["editable_fields"])
        self.assertEqual(len(self.oucrc_type_water.possible_types.all()), len(result["possible_types"]))
        self.assertEqual(len(self.oucrc_type_water.possible_parent_types.all()), len(result["possible_parent_types"]))
        self.assertEqual(len(self.oucrc_type_water.group_sets.all()), len(result["group_sets"]))
        self.assertEqual(
            len(self.oucrc_type_water.editable_reference_forms.all()), len(result["editable_reference_forms"])
        )
        self.assertEqual(len(self.oucrc_type_water.group_sets.all()), len(result["group_sets"]))
        self.assertEqual(self.oucrc_type_water.created_by_id, result["created_by"]["id"])
        self.assertIsNone(self.oucrc_type_water.updated_by)
        self.assertEqual(self.oucrc_type_water.created_at.timestamp(), result["created_at"])
        self.assertEqual(self.oucrc_type_water.updated_at.timestamp(), result["updated_at"])

    def test_retrieve_without_auth(self):
        response = self.client.get(f"/api/orgunits/changes/configs/{self.oucrc_type_fire.id}/")
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    @time_machine.travel(DT, tick=False)
    def test_create_happy_path(self):
        self.client.force_authenticate(self.user_brock)
        random_uuid = uuid.uuid4()
        new_ou_type = m.OrgUnitType.objects.create(name="new ou type")
        data = {
            "uuid": random_uuid,
            "project_id": self.project_johto.id,
            "org_unit_type_id": new_ou_type.id,
            "org_units_editable": False,
            "editable_fields": m.OrgUnitChangeRequestConfiguration.LIST_OF_POSSIBLE_EDITABLE_FIELDS,
            "possible_type_ids": [self.ou_type_rock_pokemons.id, self.ou_type_fire_pokemons.id],
            "possible_parent_type_ids": [self.ou_type_rock_pokemons.id, self.ou_type_water_pokemons.id],
            "group_set_ids": [self.group_set_brock_pokemons.id],
            "editable_reference_form_ids": [self.form_rock_throw.id],
            "other_group_ids": [self.other_group_1.id],
        }
        response = self.client.post("/api/orgunits/changes/configs/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        oucrc = m.OrgUnitChangeRequestConfiguration.objects.get(uuid=random_uuid)
        self.assertEqual(oucrc.uuid, random_uuid)
        self.assertEqual(oucrc.project.id, self.project_johto.id)
        self.assertEqual(oucrc.org_unit_type_id, new_ou_type.id)
        self.assertEqual(oucrc.org_units_editable, False)
        self.assertCountEqual(oucrc.editable_fields, data["editable_fields"])
        self.assertCountEqual(oucrc.possible_types.values_list("id", flat=True), data["possible_type_ids"])
        self.assertCountEqual(
            oucrc.possible_parent_types.values_list("id", flat=True), data["possible_parent_type_ids"]
        )
        self.assertCountEqual(oucrc.group_sets.values_list("id", flat=True), data["group_set_ids"])
        self.assertCountEqual(
            oucrc.editable_reference_forms.values_list("id", flat=True), data["editable_reference_form_ids"]
        )
        self.assertCountEqual(oucrc.other_groups.values_list("id", flat=True), data["other_group_ids"])
        self.assertEqual(oucrc.created_by_id, self.user_brock.id)
        self.assertEqual(oucrc.created_at, self.DT)
        self.assertIsNone(oucrc.updated_by)
        self.assertEqual(oucrc.updated_at, self.DT)

    # @time_machine.travel(DT, tick=False)
    # def test_create_ok_using_uuid_for_project_id(self):
    #     self.client.force_authenticate(self.user)
    #     data = {
    #         "org_unit_id": self.org_unit.uuid,
    #         "new_name": "I want this new name",
    #         "new_org_unit_type_id": self.org_unit_type.pk,
    #     }
    #     with self.assertNumQueries(11):
    #         response = self.client.post("/api/orgunits/changes/", data=data, format="json")
    #     self.assertEqual(response.status_code, 201)
    #     change_request = m.OrgUnitChangeRequest.objects.get(new_name=data["new_name"])
    #     self.assertEqual(change_request.new_name, data["new_name"])
    #     self.assertEqual(change_request.new_org_unit_type, self.org_unit_type)
    #     self.assertEqual(change_request.created_at, self.DT)
    #     self.assertEqual(change_request.created_by, self.user)
    #     self.assertEqual(change_request.updated_at, self.DT)
    #     self.assertEqual(change_request.requested_fields, ["new_name", "new_org_unit_type"])
    #
    def test_create_without_auth(self):
        random_uuid = uuid.uuid4()
        new_ou_type = m.OrgUnitType.objects.create(name="new ou type")
        data = {
            "uuid": random_uuid,
            "project_id": self.project_johto.id,
            "org_unit_type_id": new_ou_type.id,
            "org_units_editable": False,
        }
        response = self.client.post("/api/orgunits/changes/configs/", data=data, format="json")
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    #
    # def test_create_without_perm(self):
    #     self.client.force_authenticate(self.user)
    #
    #     unauthorized_org_unit = m.OrgUnit.objects.create()
    #     data = {
    #         "org_unit_id": unauthorized_org_unit.id,
    #         "new_name": "I want this new name",
    #     }
    #     response = self.client.post("/api/orgunits/changes/", data=data, format="json")
    #     self.assertEqual(response.status_code, 403)

    def test_create_existing_invalid_oug_unit_type_and_project(self):
        # an OUCRC already exists with this combination of OUType & Project
        self.client.force_authenticate(self.user_ash_ketchum)
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": self.ou_type_fire_pokemons.id,
            "org_units_editable": False,
        }
        response = self.client.post("/api/orgunits/changes/configs/", data=data, format="json")
        self.assertContains(
            response,
            "The fields project_id, org_unit_type_id must make a unique set.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    def test_create_missing_project_id(self):
        self.client.force_authenticate(self.user_misty)
        data = {
            "org_unit_type_id": self.ou_type_water_pokemons.id,
            "org_units_editable": False,
        }
        response = self.client.post("/api/orgunits/changes/configs/", data=data, format="json")
        self.assertContains(response, "This field is required.", status_code=status.HTTP_400_BAD_REQUEST)
        self.assertIn("project_id", response.data)
        self.assertEqual("required", response.data["project_id"][0].code)

    def test_create_missing_org_unit_type_id(self):
        self.client.force_authenticate(self.user_brock)
        data = {
            "project_id": self.project_johto.id,
            "org_units_editable": False,
        }
        response = self.client.post("/api/orgunits/changes/configs/", data=data, format="json")
        self.assertContains(response, "This field is required.", status_code=status.HTTP_400_BAD_REQUEST)
        self.assertIn("org_unit_type_id", response.data)
        self.assertEqual("required", response.data["org_unit_type_id"][0].code)

    def test_create_invalid_org_unit_type_id(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        probably_not_a_valid_id = 1234567890
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": probably_not_a_valid_id,
            "org_units_editable": False,
        }
        response = self.client.post("/api/orgunits/changes/configs/", data=data, format="json")
        self.assertContains(response, f"Invalid pk", status_code=status.HTTP_400_BAD_REQUEST)
        self.assertIn("org_unit_type_id", response.data)
        self.assertEqual("does_not_exist", response.data["org_unit_type_id"][0].code)

    def test_create_invalid_editable_fields(self):
        self.client.force_authenticate(self.user_misty)
        pikachu = "PIKACHU"
        new_ou_type = m.OrgUnitType.objects.create(name="new ou type")
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": new_ou_type.id,
            "org_units_editable": False,
            "editable_fields": ["aliases", "name", pikachu],
        }
        response = self.client.post("/api/orgunits/changes/configs/", data=data, format="json")
        self.assertContains(
            response, f"The field '{pikachu}' is not a valid editable field.", status_code=status.HTTP_400_BAD_REQUEST
        )

    def test_create_invalid_possible_type_ids(self):
        self.client.force_authenticate(self.user_brock)
        new_ou_type = m.OrgUnitType.objects.create(name="new ou type")
        probably_not_a_valid_id = 1234567890
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": new_ou_type.id,
            "org_units_editable": False,
            "possible_type_ids": [probably_not_a_valid_id],
        }
        response = self.client.post("/api/orgunits/changes/configs/", data=data, format="json")
        self.assertContains(response, f"Invalid pk", status_code=status.HTTP_400_BAD_REQUEST)
        self.assertIn("possible_type_ids", response.data)
        self.assertEqual("does_not_exist", response.data["possible_type_ids"][0].code)

    def test_create_invalid_possible_parent_type_ids(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        new_ou_type = m.OrgUnitType.objects.create(name="new ou type")
        probably_not_a_valid_id = 1234567890
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": new_ou_type.id,
            "org_units_editable": False,
            "possible_parent_type_ids": [probably_not_a_valid_id],
        }
        response = self.client.post("/api/orgunits/changes/configs/", data=data, format="json")
        self.assertContains(response, f"Invalid pk", status_code=status.HTTP_400_BAD_REQUEST)
        self.assertIn("possible_parent_type_ids", response.data)
        self.assertEqual("does_not_exist", response.data["possible_parent_type_ids"][0].code)

    def test_create_invalid_group_set_ids(self):
        self.client.force_authenticate(self.user_misty)
        new_ou_type = m.OrgUnitType.objects.create(name="new ou type")
        probably_not_a_valid_id = 1234567890
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": new_ou_type.id,
            "org_units_editable": False,
            "group_set_ids": [probably_not_a_valid_id],
        }
        response = self.client.post("/api/orgunits/changes/configs/", data=data, format="json")
        self.assertContains(response, f"Invalid pk", status_code=status.HTTP_400_BAD_REQUEST)
        self.assertIn("group_set_ids", response.data)
        self.assertEqual("does_not_exist", response.data["group_set_ids"][0].code)

    def test_create_invalid_editable_reference_form_ids(self):
        self.client.force_authenticate(self.user_brock)
        new_ou_type = m.OrgUnitType.objects.create(name="new ou type")
        probably_not_a_valid_id = 1234567890
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": new_ou_type.id,
            "org_units_editable": False,
            "editable_reference_form_ids": [probably_not_a_valid_id],
        }
        response = self.client.post("/api/orgunits/changes/configs/", data=data, format="json")
        self.assertContains(response, f"Invalid pk", status_code=status.HTTP_400_BAD_REQUEST)
        self.assertIn("editable_reference_form_ids", response.data)
        self.assertEqual("does_not_exist", response.data["editable_reference_form_ids"][0].code)

    def test_create_invalid_other_group_ids(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        new_ou_type = m.OrgUnitType.objects.create(name="new ou type")
        probably_not_a_valid_id = 1234567890
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": new_ou_type.id,
            "org_units_editable": False,
            "other_group_ids": [probably_not_a_valid_id],
        }
        response = self.client.post("/api/orgunits/changes/configs/", data=data, format="json")
        self.assertContains(response, f"Invalid pk", status_code=status.HTTP_400_BAD_REQUEST)
        self.assertIn("other_group_ids", response.data)
        self.assertEqual("does_not_exist", response.data["other_group_ids"][0].code)

    # def test_partial_update_without_perm(self):
    #     self.client.force_authenticate(self.user)
    #
    #     kwargs = {
    #         "status": m.OrgUnitChangeRequest.Statuses.NEW,
    #         "org_unit": self.org_unit,
    #         "new_name": "Foo",
    #     }
    #     change_request = m.OrgUnitChangeRequest.objects.create(**kwargs)
    #
    #     data = {
    #         "status": change_request.Statuses.REJECTED,
    #         "rejection_comment": "Not good enough.",
    #     }
    #     response = self.client.patch(f"/api/orgunits/changes/{change_request.pk}/", data=data, format="json")
    #     self.assertEqual(response.status_code, 403)
    #
    # def test_update_should_be_forbidden(self):
    #     self.client.force_authenticate(self.user_with_review_perm)
    #     change_request = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Foo")
    #     data = {"new_name": "Baz"}
    #     response = self.client.put(f"/api/orgunits/changes/{change_request.pk}/", data=data, format="json")
    #     self.assertEqual(response.status_code, 405)
    #
    # def test_delete_should_be_forbidden(self):
    #     self.client.force_authenticate(self.user_with_review_perm)
    #     change_request = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Foo")
    #     response = self.client.delete(f"/api/orgunits/changes/{change_request.pk}/", format="json")
    #     self.assertEqual(response.status_code, 405)