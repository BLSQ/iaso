from unittest import mock

from iaso.api.microplanning.serializers import MissionWriteSerializer
from iaso.models import EntityType
from iaso.permissions.core_permissions import CORE_PLANNING_WRITE_PERMISSION
from iaso.tests.api.microplanning.test_setup import PlanningSerializersTestBase


class MissionCRUDTestCase(PlanningSerializersTestBase):
    def test_list_missions(self):
        self.client.force_authenticate(self.user_1)
        response = self.client.get("/api/microplanning/missions/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 2)

    def test_list_missions_multi_tenancy(self):
        """User from account_2 should not see missions from account_1."""
        self.client.force_authenticate(self.user_2)
        response = self.client.get("/api/microplanning/missions/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 0)

    def test_create_form_filling_mission(self):
        user_with_perms = self.create_user_with_profile(
            username="mission_creator", account=self.account_1, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)
        data = {
            "name": "New Form Filling Mission",
            "mission_type": "FORM_FILLING",
            "mission_forms": [
                {"form_id": self.form_1.id, "min_cardinality": 1, "max_cardinality": 5},
            ],
        }
        response = self.client.post("/api/microplanning/missions/", data=data, format="json")
        r = self.assertJSONResponse(response, 201)
        self.assertEqual(r["name"], "New Form Filling Mission")
        self.assertEqual(r["mission_type"], "FORM_FILLING")
        self.assertEqual(len(r["mission_forms"]), 1)
        self.assertEqual(r["mission_forms"][0]["form"]["id"], self.form_1.id)
        self.assertEqual(r["mission_forms"][0]["min_cardinality"], 1)
        self.assertEqual(r["mission_forms"][0]["max_cardinality"], 5)
        self.assertEqual(r["account"], self.account_1.id)

    def test_create_form_filling_mixed_cardinalities(self):
        """Fill 1 summary form + unlimited service information forms."""
        user_with_perms = self.create_user_with_profile(
            username="mission_mixed", account=self.account_1, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)
        data = {
            "name": "Mixed cardinality mission",
            "mission_type": "FORM_FILLING",
            "mission_forms": [
                {"form_id": self.form_1.id, "min_cardinality": 1, "max_cardinality": 1},
                {"form_id": self.form_2.id, "min_cardinality": 0, "max_cardinality": None},
            ],
        }
        response = self.client.post("/api/microplanning/missions/", data=data, format="json")
        r = self.assertJSONResponse(response, 201)
        self.assertEqual(len(r["mission_forms"]), 2)
        forms_by_name = {mf["form"]["name"]: mf for mf in r["mission_forms"]}
        self.assertEqual(forms_by_name["form_1"]["min_cardinality"], 1)
        self.assertEqual(forms_by_name["form_1"]["max_cardinality"], 1)
        self.assertEqual(forms_by_name["form_2"]["min_cardinality"], 0)
        self.assertIsNone(forms_by_name["form_2"]["max_cardinality"])

    def test_create_org_unit_and_form_mission(self):
        user_with_perms = self.create_user_with_profile(
            username="mission_ou", account=self.account_1, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)
        data = {
            "name": "OU + Forms Mission",
            "mission_type": "ORG_UNIT_AND_FORM",
            "org_unit_type": self.org_unit_type_child.id,
            "org_unit_min_cardinality": 1,
            "org_unit_max_cardinality": 10,
            "mission_forms": [
                {"form_id": self.form_1.id, "min_cardinality": 1, "max_cardinality": 1},
            ],
        }
        response = self.client.post("/api/microplanning/missions/", data=data, format="json")
        r = self.assertJSONResponse(response, 201)
        self.assertEqual(r["mission_type"], "ORG_UNIT_AND_FORM")
        self.assertEqual(r["org_unit_type"]["id"], self.org_unit_type_child.id)
        self.assertEqual(len(r["mission_forms"]), 1)

    def test_create_org_unit_and_form_no_forms(self):
        """ORG_UNIT_AND_FORM without forms is valid (just create org units)."""
        user_with_perms = self.create_user_with_profile(
            username="mission_ou_only", account=self.account_1, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)
        data = {
            "name": "OU creation only",
            "mission_type": "ORG_UNIT_AND_FORM",
            "org_unit_type": self.org_unit_type_child.id,
            "org_unit_min_cardinality": 1,
            "org_unit_max_cardinality": 5,
        }
        response = self.client.post("/api/microplanning/missions/", data=data, format="json")
        r = self.assertJSONResponse(response, 201)
        self.assertEqual(r["mission_type"], "ORG_UNIT_AND_FORM")
        self.assertEqual(len(r["mission_forms"]), 0)

    def test_create_entity_and_form_mission(self):
        """Register 60 children, fill anthropometric + medical visit per child."""
        entity_type = EntityType.objects.create(name="Child", account=self.account_1)
        user_with_perms = self.create_user_with_profile(
            username="mission_entity", account=self.account_1, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)
        data = {
            "name": "Register children with forms",
            "mission_type": "ENTITY_AND_FORM",
            "entity_type": entity_type.id,
            "entity_min_cardinality": 60,
            "entity_max_cardinality": 60,
            "mission_forms": [
                {"form_id": self.form_1.id, "min_cardinality": 1, "max_cardinality": 1},
                {"form_id": self.form_2.id, "min_cardinality": 1, "max_cardinality": 1},
            ],
        }
        response = self.client.post("/api/microplanning/missions/", data=data, format="json")
        r = self.assertJSONResponse(response, 201)
        self.assertEqual(r["mission_type"], "ENTITY_AND_FORM")
        self.assertEqual(r["entity_type"]["id"], entity_type.id)
        self.assertEqual(r["entity_min_cardinality"], 60)
        self.assertEqual(len(r["mission_forms"]), 2)

    def test_retrieve_mission(self):
        self.client.force_authenticate(self.user_1)
        response = self.client.get(f"/api/microplanning/missions/{self.mission_1.id}/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(r["id"], self.mission_1.id)
        self.assertEqual(r["name"], "mission_form_1")
        self.assertEqual(len(r["mission_forms"]), 1)

    def test_update_mission(self):
        user_with_perms = self.create_user_with_profile(
            username="mission_updater", account=self.account_1, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)
        data = {"name": "Updated Mission Name"}
        response = self.client.patch(f"/api/microplanning/missions/{self.mission_1.id}/", data=data, format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(r["name"], "Updated Mission Name")
        # mission_forms should be unchanged on partial update without mission_forms
        self.assertEqual(len(r["mission_forms"]), 1)

    def test_update_mission_forms(self):
        """Updating mission_forms replaces all existing ones."""
        user_with_perms = self.create_user_with_profile(
            username="mission_updater2", account=self.account_1, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)
        data = {
            "mission_forms": [
                {"form_id": self.form_1.id, "min_cardinality": 2, "max_cardinality": 5},
                {"form_id": self.form_2.id, "min_cardinality": 1, "max_cardinality": 3},
            ],
        }
        response = self.client.patch(f"/api/microplanning/missions/{self.mission_1.id}/", data=data, format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r["mission_forms"]), 2)

    def test_delete_mission(self):
        user_with_perms = self.create_user_with_profile(
            username="mission_deleter", account=self.account_1, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)
        response = self.client.delete(f"/api/microplanning/missions/{self.mission_1.id}/")
        self.assertEqual(response.status_code, 204)
        self.mission_1.refresh_from_db()
        self.assertIsNotNone(self.mission_1.deleted_at)


class MissionValidationTestCase(PlanningSerializersTestBase):
    def test_form_filling_requires_forms(self):
        request = mock.Mock(user=self.user_1)
        data = {
            "name": "Bad Mission",
            "mission_type": "FORM_FILLING",
        }
        serializer = MissionWriteSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("mission_forms", serializer.errors)

    def test_org_unit_and_form_requires_org_unit_type(self):
        request = mock.Mock(user=self.user_1)
        data = {
            "name": "Bad Mission",
            "mission_type": "ORG_UNIT_AND_FORM",
        }
        serializer = MissionWriteSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("org_unit_type", serializer.errors)

    def test_entity_and_form_requires_entity_type(self):
        request = mock.Mock(user=self.user_1)
        data = {
            "name": "Bad Mission",
            "mission_type": "ENTITY_AND_FORM",
        }
        serializer = MissionWriteSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("entity_type", serializer.errors)

    def test_org_unit_cardinality_min_greater_than_max(self):
        request = mock.Mock(user=self.user_1)
        data = {
            "name": "Bad Cardinality",
            "mission_type": "ORG_UNIT_AND_FORM",
            "org_unit_type": self.org_unit_type_child.id,
            "org_unit_min_cardinality": 10,
            "org_unit_max_cardinality": 5,
        }
        serializer = MissionWriteSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("org_unit_min_cardinality", serializer.errors)

    def test_entity_cardinality_min_greater_than_max(self):
        entity_type = EntityType.objects.create(name="Child", account=self.account_1)
        request = mock.Mock(user=self.user_1)
        data = {
            "name": "Bad Cardinality",
            "mission_type": "ENTITY_AND_FORM",
            "entity_type": entity_type.id,
            "entity_min_cardinality": 100,
            "entity_max_cardinality": 50,
        }
        serializer = MissionWriteSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("entity_min_cardinality", serializer.errors)

    def test_mission_form_cardinality_min_greater_than_max(self):
        request = mock.Mock(user=self.user_1)
        data = {
            "name": "Bad Form Cardinality",
            "mission_type": "FORM_FILLING",
            "mission_forms": [
                {"form_id": self.form_1.id, "min_cardinality": 10, "max_cardinality": 5},
            ],
        }
        serializer = MissionWriteSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())

    def test_filter_by_mission_type(self):
        self.client.force_authenticate(self.user_1)
        response = self.client.get("/api/microplanning/missions/", {"mission_type": "FORM_FILLING"}, format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 2)

        response = self.client.get("/api/microplanning/missions/", {"mission_type": "ORG_UNIT_AND_FORM"}, format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 0)
