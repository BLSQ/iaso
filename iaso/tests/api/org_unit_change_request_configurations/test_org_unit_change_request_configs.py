import datetime

import time_machine

from rest_framework import status

from hat.audit.models import Modification
from iaso import models as m
from iaso.permissions.core_permissions import CORE_ORG_UNITS_CHANGE_REQUEST_CONFIGURATIONS_PERMISSION
from iaso.tests.api.org_unit_change_request_configurations.common_base_with_setup import OUCRCAPIBase


class OrgUnitChangeRequestConfigurationAPITestCase(OUCRCAPIBase):
    """
    Test actions on the OUCRCViewSet.
    """

    DT = datetime.datetime(2023, 10, 17, 17, 0, 0, 0, tzinfo=datetime.timezone.utc)

    # *** utility methods for testing ***
    def create_new_org_unit_type(self, name=None, project=None):
        """
        Creates a new OrgUnitType and returns it.
        If a Project is given, this method also links the new OrgUnitType to the Project.
        """
        new_org_unit = m.OrgUnitType.objects.create(name=name)
        if project:
            new_org_unit.projects.add(project)
        return new_org_unit

    def create_new_project_and_account(self, project_name=None, account_name=None):
        new_account = m.Account.objects.create(name=account_name)
        new_project = m.Project.objects.create(name=project_name, account=new_account)
        return new_project, new_account

    def make_patch_api_call_with_non_existing_id_in_attribute(self, attribute_name):
        self._make_api_call_with_non_existing_id_in_attribute(attribute_name, "patch")

    def make_post_api_call_with_non_existing_id_in_attribute(self, attribute_name, additional_data={}):
        self._make_api_call_with_non_existing_id_in_attribute(attribute_name, "post", additional_data)

    def _make_api_call_with_non_existing_id_in_attribute(self, attribute_name, method, additional_data={}):
        self.client.force_authenticate(self.user_ash_ketchum)
        probably_not_a_valid_id = 1234567890
        data = {
            **additional_data,
            attribute_name: [probably_not_a_valid_id],
        }

        if method == "post":
            response = self.client.post(f"{self.OUCRC_API_URL}", data=data, format="json")
        elif method == "patch":
            response = self.client.patch(f"{self.OUCRC_API_URL}{self.oucrc_type_fire.id}/", data=data, format="json")
        else:
            raise ValueError("Method must be either 'post' or 'patch'")

        self.assertContains(response, probably_not_a_valid_id, status_code=status.HTTP_400_BAD_REQUEST)

        result = response.json()
        self.assertIn(attribute_name, result)
        self.assertIn(str(probably_not_a_valid_id), result[attribute_name][0])

    # *** Testing list GET endpoint ***
    def test_list_ok(self):
        self.client.force_authenticate(self.user_ash_ketchum)

        with self.assertNumQueries(7):
            # get_queryset
            #   1. COUNT(*)
            #   2. SELECT OrgUnitChangeRequestConfiguration
            # prefetch
            #  3. PREFETCH OrgUnitChangeRequestConfiguration.possible_types
            #  4. PREFETCH OrgUnitChangeRequestConfiguration.possible_parent_types
            #  5. PREFETCH OrgUnitChangeRequestConfiguration.group_sets
            #  6. PREFETCH OrgUnitChangeRequestConfiguration.editable_reference_forms
            #  7. PREFETCH OrgUnitChangeRequestConfiguration.other_groups
            response = self.client.get(self.OUCRC_API_URL)
            self.assertJSONResponse(response, status.HTTP_200_OK)
            self.assertEqual(6, len(response.data["results"]))

    def test_list_without_auth(self):
        response = self.client.get(self.OUCRC_API_URL)
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_list_with_restricted_queryset(self):
        new_project, new_account = self.create_new_project_and_account(project_name="Palworld", account_name="Palworld")
        new_user = self.create_user_with_profile(
            username="Palworld guy",
            account=new_account,
            permissions=[CORE_ORG_UNITS_CHANGE_REQUEST_CONFIGURATIONS_PERMISSION],
        )
        new_oucrc = m.OrgUnitChangeRequestConfiguration.objects.create(
            org_unit_type=self.ou_type_water_pokemons,
            project=new_project,
            created_by=new_user,
            org_units_editable=False,
        )

        # There are now 4 OUCRCs, but the new_user should only see the new one, because he doesn't have access to self.account_pokemon
        self.client.force_authenticate(new_user)
        response = self.client.get(self.OUCRC_API_URL)
        self.assertJSONResponse(response, status.HTTP_200_OK)
        result = response.json()["results"]
        self.assertEqual(1, len(result))
        self.assertEqual(new_oucrc.id, result[0]["id"])

    # *** Testing retrieve GET endpoint ***
    def test_retrieve_ok(self):
        self.client.force_authenticate(self.user_misty)
        response = self.client.get(f"{self.OUCRC_API_URL}{self.oucrc_type_water.id}/")
        self.assertJSONResponse(response, status.HTTP_200_OK)

        result = response.data
        self.assertEqual(self.oucrc_type_water.id, result["id"])
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
        response = self.client.get(f"{self.OUCRC_API_URL}{self.oucrc_type_fire.id}/")
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_invalid_id(self):
        probably_not_a_valid_id = 1234567890
        self.client.force_authenticate(self.user_misty)
        response = self.client.get(f"{self.OUCRC_API_URL}{probably_not_a_valid_id}/")
        self.assertJSONResponse(response, status.HTTP_404_NOT_FOUND)

    # *** Testing create POST endpoint ***
    @time_machine.travel(DT, tick=False)
    def test_create_happy_path(self):
        self.client.force_authenticate(self.user_brock)
        new_ou_type = self.create_new_org_unit_type(name="new ou type", project=self.project_johto)
        data = {
            "project_id": self.project_johto.id,
            "type": m.OrgUnitChangeRequestConfiguration.Type.EDITION,
            "org_unit_type_id": new_ou_type.id,
            "org_units_editable": False,
            "editable_fields": m.OrgUnitChangeRequestConfiguration.LIST_OF_POSSIBLE_EDITABLE_FIELDS,
            "possible_type_ids": [self.ou_type_rock_pokemons.id, self.ou_type_fire_pokemons.id],
            "possible_parent_type_ids": [self.ou_type_rock_pokemons.id, self.ou_type_water_pokemons.id],
            "group_set_ids": [self.group_set_brock_pokemons.id],
            "editable_reference_form_ids": [self.form_rock_throw.id],
            "other_group_ids": [self.other_group_film_1.id],
        }
        response = self.client.post(self.OUCRC_API_URL, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        oucrc = m.OrgUnitChangeRequestConfiguration.objects.get(
            project_id=self.project_johto.id, org_unit_type_id=new_ou_type.id
        )
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

        # Checking if the creation was properly logged
        logs = Modification.objects.filter(object_id=oucrc.id)
        self.assertEqual(len(logs), 1)
        logged_oucrc = logs[0]
        self.assertEqual(logged_oucrc.past_value, [])
        self.assertEqual(logged_oucrc.created_at, self.DT)
        self.assertEqual(logged_oucrc.user, self.user_brock)

    def test_create_without_auth(self):
        new_ou_type = self.create_new_org_unit_type(name="new ou type", project=self.project_johto)
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": new_ou_type.id,
            "org_units_editable": False,
        }
        response = self.client.post(self.OUCRC_API_URL, data=data, format="json")
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_create_existing_invalid_org_unit_type_and_project(self):
        # an OUCRC already exists with this combination of OUType & Project
        self.client.force_authenticate(self.user_ash_ketchum)
        data = {
            "project_id": self.project_johto.id,
            "type": m.OrgUnitChangeRequestConfiguration.Type.EDITION,
            "org_unit_type_id": self.ou_type_fire_pokemons.id,
            "org_units_editable": False,
        }
        response = self.client.post(self.OUCRC_API_URL, data=data, format="json")
        self.assertContains(
            response,
            f"There is already a configuration for this project_id ({self.project_johto.id}), org_unit_type_id ({self.ou_type_fire_pokemons.id}) and type ({m.OrgUnitChangeRequestConfiguration.Type.EDITION}).",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    def test_create_missing_project_id(self):
        self.client.force_authenticate(self.user_misty)
        data = {
            "org_unit_type_id": self.ou_type_water_pokemons.id,
            "org_units_editable": False,
        }
        response = self.client.post(self.OUCRC_API_URL, data=data, format="json")
        self.assertContains(response, "This field is required.", status_code=status.HTTP_400_BAD_REQUEST)

        result = response.json()
        self.assertIn("project_id", result)
        self.assertIn("required", result["project_id"][0])

    def test_create_missing_org_unit_type_id(self):
        self.client.force_authenticate(self.user_brock)
        data = {
            "project_id": self.project_johto.id,
            "org_units_editable": False,
        }
        response = self.client.post(self.OUCRC_API_URL, data=data, format="json")
        self.assertContains(response, "This field is required.", status_code=status.HTTP_400_BAD_REQUEST)

        result = response.json()
        self.assertIn("org_unit_type_id", result)
        self.assertIn("required", result["org_unit_type_id"][0])

    def test_create_invalid_org_unit_type_id(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        probably_not_a_valid_id = 1234567890
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": probably_not_a_valid_id,
            "org_units_editable": False,
        }
        response = self.client.post(self.OUCRC_API_URL, data=data, format="json")
        self.assertContains(response, "Invalid pk", status_code=status.HTTP_400_BAD_REQUEST)

        result = response.json()
        self.assertIn("org_unit_type_id", result)
        self.assertIn(str(probably_not_a_valid_id), result["org_unit_type_id"][0])

    def test_create_invalid_editable_fields(self):
        self.client.force_authenticate(self.user_misty)
        pikachu = "PIKACHU"
        new_ou_type = self.create_new_org_unit_type("new ou type")
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": new_ou_type.id,
            "org_units_editable": False,
            "editable_fields": ["aliases", "name", pikachu],
        }
        response = self.client.post(self.OUCRC_API_URL, data=data, format="json")
        self.assertContains(
            response, f"Value '{pikachu}' is not a valid choice.", status_code=status.HTTP_400_BAD_REQUEST
        )
        self.assertIn("editable_fields", response.json())

    def test_create_invalid_possible_type_ids(self):
        new_org_unit_type = self.create_new_org_unit_type(name="new org unit type", project=self.project_johto)
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": new_org_unit_type.id,
        }
        self.make_post_api_call_with_non_existing_id_in_attribute(
            attribute_name="possible_type_ids", additional_data=data
        )

    def test_create_invalid_possible_parent_type_ids(self):
        new_org_unit_type = self.create_new_org_unit_type(name="new org unit type", project=self.project_johto)
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": new_org_unit_type.id,
        }
        self.make_post_api_call_with_non_existing_id_in_attribute(
            attribute_name="possible_parent_type_ids", additional_data=data
        )

    def test_create_invalid_group_set_ids(self):
        new_org_unit_type = self.create_new_org_unit_type(name="new org unit type", project=self.project_johto)
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": new_org_unit_type.id,
        }
        self.make_post_api_call_with_non_existing_id_in_attribute(attribute_name="group_set_ids", additional_data=data)

    def test_create_invalid_editable_reference_form_ids(self):
        new_org_unit_type = self.create_new_org_unit_type(name="new org unit type", project=self.project_johto)
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": new_org_unit_type.id,
        }
        self.make_post_api_call_with_non_existing_id_in_attribute(
            attribute_name="editable_reference_form_ids", additional_data=data
        )

    def test_create_invalid_other_group_ids(self):
        new_org_unit_type = self.create_new_org_unit_type(name="new org unit type", project=self.project_johto)
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": new_org_unit_type.id,
        }
        self.make_post_api_call_with_non_existing_id_in_attribute(
            attribute_name="other_group_ids", additional_data=data
        )

    def test_create_with_org_unit_type_id_not_accessible_to_user(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        new_org_unit_type = self.create_new_org_unit_type("new org unit type")
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": new_org_unit_type.id,
            "org_units_editable": False,
        }
        response = self.client.post(self.OUCRC_API_URL, data=data, format="json")
        self.assertContains(
            response,
            f"The user doesn't have access to the OrgUnitType {new_org_unit_type.id}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("org_unit_type_id", response.json())

    def test_create_with_possible_type_ids_not_accessible_to_user(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        new_project, _ = self.create_new_project_and_account(project_name="new project", account_name="new account")
        new_org_unit_type = self.create_new_org_unit_type(name="new org unit type", project=new_project)
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": new_org_unit_type.id,
            "possible_type_ids": [new_org_unit_type.id],
        }
        response = self.client.post(self.OUCRC_API_URL, data=data, format="json")
        self.assertContains(
            response,
            f"The user doesn't have access to the OrgUnitType {new_org_unit_type.id}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("possible_type_ids", response.json())

    def test_create_with_possible_parent_type_ids_not_accessible_to_user(self):
        self.client.force_authenticate(self.user_misty)
        new_project, _ = self.create_new_project_and_account(project_name="new project", account_name="new account")
        new_org_unit_type = self.create_new_org_unit_type(name="new org unit type", project=self.project_johto)
        new_parent_type = self.create_new_org_unit_type(name="new org unit type", project=new_project)
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": new_org_unit_type.id,
            "possible_parent_type_ids": [new_parent_type.id],
        }
        response = self.client.post(self.OUCRC_API_URL, data=data, format="json")
        self.assertContains(
            response,
            f"The user doesn't have access to the OrgUnitType {new_parent_type.id}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("possible_parent_type_ids", response.json())

    def test_create_with_group_set_ids_not_accessible_to_user(self):
        self.client.force_authenticate(self.user_brock)
        new_org_unit_type = self.create_new_org_unit_type(name="new org unit type", project=self.project_johto)
        new_group_set = m.GroupSet.objects.create(name="new group set")
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": new_org_unit_type.id,
            "group_set_ids": [new_group_set.id],
        }
        response = self.client.post(self.OUCRC_API_URL, data=data, format="json")
        self.assertContains(
            response,
            f"The user doesn't have access to the GroupSet {new_group_set.id}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("group_set_ids", response.json())

    def test_create_with_editable_reference_form_ids_not_accessible_to_user(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        new_org_unit_type = self.create_new_org_unit_type(name="new org unit type", project=self.project_johto)
        new_form = m.Form.objects.create(name="new form")
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": new_org_unit_type.id,
            "editable_reference_form_ids": [new_form.id],
        }
        response = self.client.post(self.OUCRC_API_URL, data=data, format="json")
        self.assertContains(
            response,
            f"The user doesn't have access to the Form {new_form.id}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("editable_reference_form_ids", response.json())

    def test_create_with_other_group_ids_not_accessible_to_user(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        new_org_unit_type = self.create_new_org_unit_type(name="new org unit type", project=self.project_johto)
        new_group = m.Group.objects.create(name="new group")
        data = {
            "project_id": self.project_johto.id,
            "org_unit_type_id": new_org_unit_type.id,
            "other_group_ids": [new_group.id],
        }
        response = self.client.post(self.OUCRC_API_URL, data=data, format="json")
        self.assertContains(
            response,
            f"The user doesn't have access to the Group {new_group.id}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("other_group_ids", response.json())

    # *** Testing update PATCH endpoint ***
    def test_update_full(self):
        # Changing all the possible fields of this OUCRC
        self.client.force_authenticate(self.user_misty)
        data = {
            "org_units_editable": True,
            "editable_fields": m.OrgUnitChangeRequestConfiguration.LIST_OF_POSSIBLE_EDITABLE_FIELDS,
            "possible_type_ids": [
                self.ou_type_water_pokemons.id,
                self.ou_type_fire_pokemons.id,
                self.ou_type_rock_pokemons.id,
            ],
            "possible_parent_type_ids": [
                self.ou_type_water_pokemons.id,
                self.ou_type_rock_pokemons.id,
                self.ou_type_fire_pokemons.id,
            ],
            "group_set_ids": [self.group_set_misty_pokemons.id],
            "editable_reference_form_ids": [self.form_water_gun.id, self.form_rock_throw.id],
            "other_group_ids": [self.other_group_film_1.id, self.other_group_film_2.id, self.other_group_film_3.id],
        }
        response = self.client.patch(f"{self.OUCRC_API_URL}{self.oucrc_type_water.id}/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.oucrc_type_water.refresh_from_db()
        oucrc = self.oucrc_type_water
        self.assertTrue(oucrc.org_units_editable)
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
        self.assertEqual(oucrc.updated_by, self.user_misty)
        self.assertNotEqual(oucrc.created_by, oucrc.updated_at)

        # Checking if the update was properly logged
        logs = Modification.objects.filter(object_id=oucrc.id)
        self.assertEqual(len(logs), 1)
        logged_oucrc = logs[0]
        self.assertEqual(logged_oucrc.user, self.user_misty)
        self.assertNotEqual(logged_oucrc.past_value, [])

        diff = logged_oucrc.field_diffs()
        self.assertIn("org_units_editable", diff["modified"])
        self.assertIn("editable_fields", diff["modified"])
        self.assertIn("possible_types", diff["modified"])
        self.assertIn("possible_parent_types", diff["modified"])
        self.assertIn("group_sets", diff["modified"])
        self.assertIn("editable_reference_forms", diff["modified"])
        self.assertIn("other_groups", diff["modified"])
        self.assertIn("updated_by", diff["modified"])

    def test_update_partial(self):
        # Changing only some fields of this OUCRC
        self.client.force_authenticate(self.user_brock)
        data = {
            "editable_fields": ["name"],
            "other_group_ids": [self.other_group_film_1.id, self.other_group_film_2.id, self.other_group_film_3.id],
        }
        response = self.client.patch(f"{self.OUCRC_API_URL}{self.oucrc_type_rock.id}/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.oucrc_type_rock.refresh_from_db()
        oucrc = self.oucrc_type_rock
        self.assertCountEqual(oucrc.editable_fields, data["editable_fields"])
        self.assertCountEqual(oucrc.other_groups.values_list("id", flat=True), data["other_group_ids"])
        self.assertEqual(oucrc.updated_by, self.user_brock)
        self.assertNotEqual(oucrc.created_by, oucrc.updated_at)

        # Checking if the update was properly logged
        logs = Modification.objects.filter(object_id=oucrc.id)
        self.assertEqual(len(logs), 1)
        logged_oucrc = logs[0]
        self.assertEqual(logged_oucrc.user, self.user_brock)
        self.assertNotEqual(logged_oucrc.past_value, [])

        diff = logged_oucrc.field_diffs()
        self.assertNotIn("org_units_editable", diff["modified"])
        self.assertIn("editable_fields", diff["modified"])
        self.assertNotIn("possible_types", diff["modified"])
        self.assertNotIn("possible_parent_types", diff["modified"])
        self.assertNotIn("group_sets", diff["modified"])
        self.assertNotIn("editable_reference_forms", diff["modified"])
        self.assertIn("other_groups", diff["modified"])
        self.assertIn("updated_by", diff["modified"])

    def test_update_without_auth(self):
        data = {
            "org_units_editable": False,
        }
        response = self.client.patch(f"{self.OUCRC_API_URL}{self.oucrc_type_fire.id}/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_without_perm(self):
        self.client.force_authenticate(self.user_without_perms_giovanni)
        data = {
            "org_units_editable": False,
        }
        response = self.client.post(f"{self.OUCRC_API_URL}{self.oucrc_type_fire.id}/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_invalid_id(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        data = {
            "org_units_editable": True,
        }
        probably_not_a_valid_id = 1234567890
        response = self.client.patch(f"{self.OUCRC_API_URL}{probably_not_a_valid_id}/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_invalid_editable_fields(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        pikachu = "PIKACHU"
        data = {
            "editable_fields": ["name", "aliases", pikachu, "closed_date"],
        }
        response = self.client.patch(f"{self.OUCRC_API_URL}{self.oucrc_type_fire.id}/", data=data, format="json")
        self.assertContains(response, pikachu, status_code=status.HTTP_400_BAD_REQUEST)

        result = response.json()
        self.assertIn("editable_fields", result)
        self.assertIn(pikachu, result["editable_fields"][0])

    def test_update_unknown_possible_types(self):
        self.make_patch_api_call_with_non_existing_id_in_attribute(attribute_name="possible_type_ids")

    def test_update_unknown_possible_parent_types(self):
        self.make_patch_api_call_with_non_existing_id_in_attribute(attribute_name="possible_parent_type_ids")

    def test_update_unknown_group_sets(self):
        self.make_patch_api_call_with_non_existing_id_in_attribute(attribute_name="group_set_ids")

    def test_update_unknown_editable_reference_forms(self):
        self.make_patch_api_call_with_non_existing_id_in_attribute(attribute_name="editable_reference_form_ids")

    def test_update_unknown_other_groups(self):
        self.make_patch_api_call_with_non_existing_id_in_attribute(attribute_name="other_group_ids")

    def test_update_with_possible_type_ids_not_accessible_to_user(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        new_project, _ = self.create_new_project_and_account(project_name="new project", account_name="new account")
        new_org_unit_type = self.create_new_org_unit_type(name="new org unit type", project=new_project)
        data = {
            "possible_type_ids": [new_org_unit_type.id],
        }
        response = self.client.patch(f"{self.OUCRC_API_URL}{self.oucrc_type_fire.id}/", data=data, format="json")
        self.assertContains(
            response,
            f"The user doesn't have access to the OrgUnitType {new_org_unit_type.id}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("possible_type_ids", response.json())

    def test_update_with_possible_parent_type_ids_not_accessible_to_user(self):
        self.client.force_authenticate(self.user_misty)
        new_project, _ = self.create_new_project_and_account(project_name="new project", account_name="new account")
        new_parent_type = self.create_new_org_unit_type(name="parent org unit type", project=new_project)
        data = {
            "possible_parent_type_ids": [new_parent_type.id],
        }
        response = self.client.patch(f"{self.OUCRC_API_URL}{self.oucrc_type_water.id}/", data=data, format="json")
        self.assertContains(
            response,
            f"The user doesn't have access to the OrgUnitType {new_parent_type.id}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("possible_parent_type_ids", response.json())

    def test_update_with_group_set_ids_not_accessible_to_user(self):
        self.client.force_authenticate(self.user_brock)
        new_group_set = m.GroupSet.objects.create(name="new group set")
        data = {
            "group_set_ids": [new_group_set.id],
        }
        response = self.client.patch(f"{self.OUCRC_API_URL}{self.oucrc_type_rock.id}/", data=data, format="json")
        self.assertContains(
            response,
            f"The user doesn't have access to the GroupSet {new_group_set.id}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("group_set_ids", response.json())

    def test_update_with_editable_reference_form_ids_not_accessible_to_user(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        new_form = m.Form.objects.create(name="new form")
        data = {
            "editable_reference_form_ids": [new_form.id],
        }
        response = self.client.patch(f"{self.OUCRC_API_URL}{self.oucrc_type_fire.id}/", data=data, format="json")
        self.assertContains(
            response,
            f"The user doesn't have access to the Form {new_form.id}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("editable_reference_form_ids", response.json())

    def test_update_with_other_group_ids_not_accessible_to_user(self):
        self.client.force_authenticate(self.user_misty)
        new_group = m.Group.objects.create(name="new group")
        data = {
            "other_group_ids": [new_group.id],
        }
        response = self.client.patch(f"{self.OUCRC_API_URL}{self.oucrc_type_water.id}/", data=data, format="json")
        self.assertContains(
            response,
            f"The user doesn't have access to the Group {new_group.id}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("other_group_ids", response.json())

    # + Test for updating groupsets or groups, but there were updates in groupsets between OUCRC creation and update
    # -> what should happen? error? cleanup without telling the user?

    # *** Testing DELETE endpoint ***
    def test_delete_ok(self):
        oucrcs_before_deletion = m.OrgUnitChangeRequestConfiguration.objects.count()
        self.client.force_authenticate(self.user_ash_ketchum)
        response = self.client.delete(f"{self.OUCRC_API_URL}{self.oucrc_type_fire.id}/", format="json")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        oucrcs_after_deletion = m.OrgUnitChangeRequestConfiguration.objects.count()
        self.assertEqual(oucrcs_before_deletion, oucrcs_after_deletion + 1)

        soft_deleted_oucrc = m.OrgUnitChangeRequestConfiguration.objects_only_deleted.get(id=self.oucrc_type_fire.id)
        self.assertIsNotNone(soft_deleted_oucrc.deleted_at)
        self.assertEqual(soft_deleted_oucrc.updated_by, self.user_ash_ketchum)

        # Checking if the suppression was properly logged
        logs = Modification.objects.filter(object_id=self.oucrc_type_fire.id)
        self.assertEqual(len(logs), 1)
        logged_oucrc = logs[0]
        self.assertEqual(logged_oucrc.user, self.user_ash_ketchum)
        self.assertNotEqual(logged_oucrc.past_value, [])

        diff = logged_oucrc.field_diffs()
        self.assertNotIn("org_units_editable", diff["modified"])
        self.assertNotIn("editable_fields", diff["modified"])
        self.assertNotIn("possible_types", diff["modified"])
        self.assertNotIn("possible_parent_types", diff["modified"])
        self.assertNotIn("group_sets", diff["modified"])
        self.assertNotIn("editable_reference_forms", diff["modified"])
        self.assertNotIn("other_groups", diff["modified"])
        self.assertIn("updated_at", diff["modified"])
        self.assertIn("deleted_at", diff["modified"])

    def test_delete_without_auth(self):
        response = self.client.delete(f"{self.OUCRC_API_URL}{self.oucrc_type_fire.id}/", format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_without_perm(self):
        self.client.force_authenticate(self.user_without_perms_giovanni)
        response = self.client.delete(f"{self.OUCRC_API_URL}{self.oucrc_type_fire.id}/", format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_invalid_id(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        probably_not_a_valid_id = 1234567890
        response = self.client.delete(f"{self.OUCRC_API_URL}{probably_not_a_valid_id}/", format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_deleting_and_recreating(self):
        # First, let's delete the existing OUCRC
        self.client.force_authenticate(self.user_ash_ketchum)
        response = self.client.delete(f"{self.OUCRC_API_URL}{self.oucrc_type_fire.id}/", format="json")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Then let's create a new OUCRC with the same project_id and org_unit_type_id as the one that was deleted
        # We don't care about the other parameters
        data = {
            "project_id": self.project_johto.id,
            "type": m.OrgUnitChangeRequestConfiguration.Type.EDITION,
            "org_unit_type_id": self.ou_type_fire_pokemons.id,
            "org_units_editable": False,
            "editable_fields": ["name", "opening_date"],
        }
        response = self.client.post(self.OUCRC_API_URL, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        result = response.json()
        new_oucrc = m.OrgUnitChangeRequestConfiguration.objects.get(id=result["id"])
        self.assertEqual(new_oucrc.project_id, self.oucrc_type_fire.project_id)
        self.assertEqual(new_oucrc.org_unit_type_id, self.oucrc_type_fire.org_unit_type_id)

    def test_error_deleting_already_deleted(self):
        # First, let's delete the existing OUCRC
        self.client.force_authenticate(self.user_ash_ketchum)
        response = self.client.delete(f"{self.OUCRC_API_URL}{self.oucrc_type_fire.id}/", format="json")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Then let's delete it again
        response = self.client.delete(f"{self.OUCRC_API_URL}{self.oucrc_type_fire.id}/", format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # *** Testing GET check_availability endpoint ***
    def test_check_availability_ok(self):
        # Preparing a new OrgUnitType in this project - since the 3 OUT already have an OUCRC in setUpTestData
        new_org_unit_type = self.create_new_org_unit_type("Psychic Pokémons")
        new_org_unit_type.projects.add(self.project_johto)
        new_org_unit_type.refresh_from_db()

        self.client.force_authenticate(self.user_ash_ketchum)
        response = self.client.get(
            f"{self.OUCRC_API_URL}check_availability/",
            {
                "project_id": self.project_johto.id,
                "type": m.OrgUnitChangeRequestConfiguration.Type.EDITION,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        expected = {
            "id": new_org_unit_type.id,
            "name": new_org_unit_type.name,
        }
        self.assertEqual(response.json(), [expected])

    def test_check_availability_no_result(self):
        # All the OUCRCs have already been made for this project
        self.client.force_authenticate(self.user_ash_ketchum)
        response = self.client.get(
            f"{self.OUCRC_API_URL}check_availability/",
            {
                "project_id": self.project_johto.id,
                "type": m.OrgUnitChangeRequestConfiguration.Type.EDITION,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), [])

    def test_check_availability_no_config_yet(self):
        # Preparing a new Project and new OrgUnitTypes
        new_project, new_account = self.create_new_project_and_account(
            project_name="New project", account_name="New account"
        )
        new_user = self.create_user_with_profile(
            username="New user",
            account=new_account,
            permissions=[CORE_ORG_UNITS_CHANGE_REQUEST_CONFIGURATIONS_PERMISSION],
        )

        new_ou_type_1 = self.create_new_org_unit_type("new type 1")
        new_ou_type_1.projects.add(new_project)
        new_ou_type_1.refresh_from_db()
        new_ou_type_2 = self.create_new_org_unit_type("new type 2")
        new_ou_type_2.projects.add(new_project)
        new_ou_type_2.refresh_from_db()

        self.client.force_authenticate(new_user)
        response = self.client.get(
            f"{self.OUCRC_API_URL}check_availability/",
            {
                "project_id": new_project.id,
                "type": m.OrgUnitChangeRequestConfiguration.Type.EDITION,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        expected = [
            {
                "id": new_ou_type_1.id,
                "name": new_ou_type_1.name,
            },
            {
                "id": new_ou_type_2.id,
                "name": new_ou_type_2.name,
            },
        ]
        self.assertEqual(response.json(), expected)

    def test_check_availability_without_auth(self):
        response = self.client.get(
            f"{self.OUCRC_API_URL}check_availability/",
            {
                "project_id": self.project_johto.id,
                "type": m.OrgUnitChangeRequestConfiguration.Type.EDITION,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_check_availability_without_perm(self):
        self.client.force_authenticate(self.user_without_perms_giovanni)
        response = self.client.get(
            f"{self.OUCRC_API_URL}check_availability/",
            {
                "project_id": self.project_johto.id,
                "type": m.OrgUnitChangeRequestConfiguration.Type.EDITION,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_check_availability_error_missing_parameter_project(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        response = self.client.get(f"{self.OUCRC_API_URL}check_availability/", format="json")
        self.assertContains(
            response,
            "This field is required",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("project_id", response.json())

    def test_check_availability_error_missing_parameter_type(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        response = self.client.get(
            f"{self.OUCRC_API_URL}check_availability/",
            {
                "project_id": self.project_johto.id,
            },
            format="json",
        )
        self.assertContains(
            response,
            "This field is required",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("type", response.json())

    def test_check_availability_invalid_project_id(self):
        probably_not_a_valid_id = 1234567890
        self.client.force_authenticate(self.user_ash_ketchum)
        response = self.client.get(
            f"{self.OUCRC_API_URL}check_availability/",
            {
                "project_id": probably_not_a_valid_id,
                "type": m.OrgUnitChangeRequestConfiguration.Type.EDITION,
            },
            format="json",
        )
        self.assertContains(
            response,
            probably_not_a_valid_id,
            status_code=status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("project_id", response.json())
        self.assertIn("does not exist", response.json()["project_id"][0])

    def test_check_availability_with_project_id_not_accessible_to_user(self):
        self.client.force_authenticate(self.user_misty)
        new_project, _ = self.create_new_project_and_account(project_name="new project", account_name="new account")
        new_org_unit_type = self.create_new_org_unit_type(name="new org unit type", project=new_project)
        # There should be one result since there is no OUCRC for the new project, but the user doesn't have access to it
        data = {
            "project_id": new_project.id,
            "org_unit_type_id": new_org_unit_type.id,
            "org_units_editable": False,
        }
        response = self.client.get(
            f"{self.OUCRC_API_URL}check_availability/",
            {
                "project_id": new_project.id,
                "type": m.OrgUnitChangeRequestConfiguration.Type.EDITION,
            },
            format="json",
        )
        self.assertContains(
            response,
            f"The user doesn't have access to the Project {new_project.id}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
