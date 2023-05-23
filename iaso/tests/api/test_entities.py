import time
import uuid
from unittest import mock

from django.contrib.auth.models import AnonymousUser
from django.core.files import File

from iaso import models as m
from iaso.models import Entity, EntityType, FormVersion, Instance, Project
from iaso.test import APITestCase
from iaso.tests.api.workflows.base import var_dump


class EntityAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")
        cls.star_wars = star_wars

        space_balls = m.Account.objects.create(name="Space Balls")

        sw_source = m.DataSource.objects.create(name="Galactic Empire")
        cls.sw_source = sw_source
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version
        star_wars.save()
        cls.sw_version = sw_version

        cls.anon = AnonymousUser()

        cls.project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )

        cls.yop_solo = cls.create_user_with_profile(
            username="yop solo", account=space_balls, permissions=["iaso_entities"]
        )

        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")

        cls.jedi_council_corruscant = m.OrgUnit.objects.create(
            name="Coruscant Jedi Council", validation_status=m.OrgUnit.VALIDATION_VALID
        )
        cls.jedi_council_corruscant_unvalidated = m.OrgUnit.objects.create(name="Coruscant Jedi Council")

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_entities"])

        cls.user_without_ou = cls.create_user_with_profile(
            username="user_without_ou", account=star_wars, permissions=["iaso_entities"]
        )

        cls.form_1 = m.Form.objects.create(name="Hydroponics study", period_type=m.MONTH, single_per_period=True)

        cls.create_form_instance(
            form=cls.form_1, period="202001", org_unit=cls.jedi_council_corruscant, project=cls.project, uuid=uuid.uuid4
        )
        cls.create_form_instance(
            form=cls.form_1, period="202002", org_unit=cls.jedi_council_corruscant, project=cls.project, uuid=uuid.uuid4
        )
        cls.create_form_instance(
            form=cls.form_1, period="202002", org_unit=cls.jedi_council_corruscant, project=cls.project, uuid=uuid.uuid4
        )
        cls.create_form_instance(
            form=cls.form_1, period="202003", org_unit=cls.jedi_council_corruscant, project=cls.project, uuid=uuid.uuid4
        )

    def test_create_single_entity(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
        )

        payload = {
            "name": "New Client",
            "entity_type": entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }

        response = self.client.post("/api/entities/", data=payload, format="json")

        self.assertEqual(response.status_code, 200)

    def test_create_multiples_entity(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant, form=self.form_1, period="202002", uuid=uuid.uuid4()
        )

        second_instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant, form=self.form_1, period="202002", uuid=uuid.uuid4()
        )

        payload = {
            "name": "New Client",
            "entity_type": entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }, {
            "name": "New Client 2",
            "entity_type": entity_type.pk,
            "attributes": second_instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }

        response = self.client.post("/api/entities/bulk_create/", data=payload, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)

    def test_create_entity_same_attributes(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant, form=self.form_1, period="202002", uuid=uuid.uuid4()
        )

        payload = {
            "name": "New Client",
            "entity_type": entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }, {
            "name": "New Client 2",
            "entity_type": entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }

        response = self.client.post("/api/entities/bulk_create/", data=payload, format="json")

        self.assertEqual(response.status_code, 400)

    def test_retrieve_entity(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1, account=self.star_wars)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant, form=self.form_1, period="202002", uuid=uuid.uuid4()
        )

        second_instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant, form=self.form_1, period="202002", uuid=uuid.uuid4()
        )

        payload = {
            "name": "New Client",
            "entity_type": entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }, {
            "name": "New Client 2",
            "entity_type": entity_type.pk,
            "attributes": second_instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }

        self.client.post("/api/entities/bulk_create/", data=payload, format="json")

        response = self.client.get("/api/entities/", format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)

    def test_retrieve_entity_without_attributes(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1, account=self.star_wars)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant, form=self.form_1, period="202002", uuid=uuid.uuid4()
        )

        second_instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant, form=self.form_1, period="202002", uuid=uuid.uuid4()
        )

        payload = {
            "name": "New Client",
            "entity_type": entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }, {
            "name": "New Client 2",
            "entity_type": entity_type.pk,
            "attributes": second_instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }

        self.client.post("/api/entities/bulk_create/", data=payload, format="json")

        entity = Entity.objects.create(
            name="New Client 3", entity_type=entity_type, account=self.yoda.iaso_profile.account
        )

        entity.refresh_from_db()

        response = self.client.get("/api/entities/", format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 3)

        response = self.client.get(f"/api/entities/?entity_type_id={entity_type.pk}", format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 3)

        response = self.client.get(f"/api/entities/{entity.pk}/")

        self.assertEqual(response.status_code, 200)

    def test_get_entity_search_filter(self):
        """
        Test the 'search' filter of /api/entities

        This parameter allows to filter either by name, UUID or attributes (of the reference form)
        """
        self.client.force_authenticate(self.yoda)

        # Let's first create the test data
        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
            json={"name": "c", "age": 30, "gender": "F"},
        )

        payload = {
            "name": "New Client",
            "entity_type": entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }

        self.client.post("/api/entities/", data=payload, format="json")

        newly_added_entity = Entity.objects.last()

        # Case 1: search by entity name
        response = self.client.get("/api/entities/?search=Client", format="json")
        self.assertEqual(len(response.json()["result"]), 1)
        the_result = response.json()["result"][0]
        self.assertEqual(the_result["id"], newly_added_entity.id)

        # Case 2: search by entity name - make sure it's case-insensitive
        response = self.client.get("/api/entities/?search=cLiEnT", format="json")
        self.assertEqual(len(response.json()["result"]), 1)
        the_result = response.json()["result"][0]
        self.assertEqual(the_result["id"], newly_added_entity.id)

        # Case 3: search by entity UUID
        response = self.client.get(f"/api/entities/?search={newly_added_entity.uuid}", format="json")
        self.assertEqual(len(response.json()["result"]), 1)
        self.assertEqual(the_result["id"], newly_added_entity.id)

        # Case 4: search by JSON attribute
        response = self.client.get(f"/api/entities/?search=age", format="json")
        self.assertEqual(len(response.json()["result"]), 1)
        self.assertEqual(the_result["id"], newly_added_entity.id)

    def test_get_entity_by_id(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
        )

        payload = {
            "name": "New Client",
            "entity_type": entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }

        self.client.post("/api/entities/", data=payload, format="json")

        response = self.client.get("/api/entities/{0}/".format(Entity.objects.last().pk), format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], Entity.objects.last().pk)

    def test_handle_wrong_attributes(self):
        self.client.force_authenticate(self.yoda)
        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1)

        payload = {
            "name": "New Client",
            "entity_type": entity_type.pk,
            "attributes": 2324,
            "account": self.yoda.iaso_profile.account.pk,
        }

        response = self.client.post("/api/entities/", data=payload, format="json")

        self.assertEqual(response.status_code, 404)

    def test_update_entity(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant, form=self.form_1, period="202002", uuid=uuid.uuid4()
        )

        payload_post = {
            "name": "New Client",
            "entity_type": entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }

        self.client.post("/api/entities/", data=payload_post, format="json")

        payload = {"name": "New Client-2", "entity_type": entity_type.pk, "attributes": instance.pk}

        response = self.client.patch("/api/entities/{0}/".format(Entity.objects.last().pk), data=payload, format="json")

        self.assertEqual(response.status_code, 200)

    def test_retrieve_only_non_deleted_entity(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1, account=self.star_wars)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant, form=self.form_1, period="202002", uuid=uuid.uuid4()
        )

        second_instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant, form=self.form_1, period="202002", uuid=uuid.uuid4()
        )

        payload = {
            "name": "New Client",
            "entity_type": entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }, {
            "name": "New Client 2",
            "entity_type": entity_type.pk,
            "attributes": second_instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }

        self.client.post("/api/entities/bulk_create/", data=payload, format="json")
        self.client.delete("/api/entities/{0}/".format(Entity.objects.last().pk), format="json")

        response = self.client.get("/api/entities/", format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 1)

    def test_cant_create_entity_without_attributes(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1)

        payload = {
            "name": "New Client",
            "entity_type": entity_type.pk,
            "attributes": None,
            "account": self.yoda.iaso_profile.account.pk,
        }

        response = self.client.post("/api/entities/", data=payload, format="json")

        self.assertEqual(response.status_code, 404)

    def test_retrieve_entity_only_same_account(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1, account=self.star_wars)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
        )

        second_instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
        )

        Entity.objects.create(
            name="New Client",
            entity_type=entity_type,
            attributes=instance,
            account=self.yop_solo.iaso_profile.account,
        )

        Entity.objects.create(
            name="New Client",
            entity_type=entity_type,
            attributes=second_instance,
            account=self.yoda.iaso_profile.account,
        )

        response = self.client.get("/api/entities/", format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 1)

    @mock.patch("iaso.api.entity.gmtime", lambda: time.struct_time((2021, 7, 18, 14, 57, 0, 1, 291, 0)))
    def test_export_entity(self):
        self.client.force_authenticate(self.yoda)
        entity_type = EntityType.objects.create(
            name="Type 1",
            reference_form=self.form_1,
            fields_detail_info_view=["something", "else"],
            fields_list_view=["something", "else"],
        )

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
        )

        second_instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
        )

        Entity.objects.create(
            name="New Client",
            entity_type=entity_type,
            attributes=instance,
            account=self.yop_solo.iaso_profile.account,
        )

        Entity.objects.create(
            name="New Client",
            entity_type=entity_type,
            attributes=second_instance,
            account=self.yoda.iaso_profile.account,
        )

        # export all entities type as csv
        response = self.client.get("/api/entities/?csv=true/")
        self.assertEqual(response.status_code, 200)
        self.assertEquals(response.get("Content-Disposition"), "attachment; filename=entities-2021-07-18-14-57.csv")

        # export all entities type as xlsx
        response = self.client.get("/api/entities/?xlsx=true/")
        self.assertEqual(response.status_code, 200)
        self.assertEquals(response.get("Content-Disposition"), "attachment; filename=entities-2021-07-18-14-57.xlsx")

        # export specific entity type as xlsx
        response = self.client.get(f"/api/entities/?entity_type_ids={entity_type.pk}&xlsx=true/")
        self.assertEqual(response.status_code, 200)
        self.assertEquals(response.get("Content-Disposition"), "attachment; filename=entities-2021-07-18-14-57.xlsx")

        # export specific entity type as csv
        response = self.client.get(f"/api/entities/?entity_type_ids={entity_type.pk}&csv=true/")
        self.assertEqual(response.status_code, 200)
        self.assertEquals(response.get("Content-Disposition"), "attachment; filename=entities-2021-07-18-14-57.csv")

        # TODO: we should also check the content of the files

    def test_handle_export_entity_type_empty_field_list(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(
            name="Type 1",
            reference_form=self.form_1,
        )

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
        )

        entity = Entity.objects.create(
            name="New Client",
            entity_type=entity_type,
            account=self.yop_solo.iaso_profile.account,
        )

        entity.attributes = instance

        entity.save()

        response = self.client.get("/api/entities/?xlsx=true/")
        self.assertEqual(response.status_code, 200)

    def test_entity_mobile(self):
        self.client.force_authenticate(self.yoda)

        self.yoda.iaso_profile.org_units.set([self.jedi_council_corruscant])

        self.form_1.form_id = "A_FORM_ID"

        self.form_1.json = {"_version": "A_FORM_ID"}

        self.form_1.save()

        FormVersion.objects.create(form=self.form_1, version_id="A_FORM_ID")

        entity_type = EntityType.objects.create(
            name="Type 1",
            reference_form=self.form_1,
        )

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
            project=self.project,
            uuid="9335359a-9f80-422d-997a-68ae7e39d9g3",
        )

        self.form_1.instances.set([instance])
        self.form_1.save()

        entity = Entity.objects.create(
            name="New Client",
            entity_type=entity_type,
            attributes=instance,
            account=self.yoda.iaso_profile.account,
        )

        instance.entity = entity
        instance.save()

        response = self.client.get(f"/api/mobile/entities/?app_id={self.project.app_id}")

        data = response.json().get("results")[0]

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data.get("id"), str(entity.uuid))
        self.assertEqual(data.get("defining_instance_id"), str(instance.uuid))

        response = self.client.get(f"/api/mobile/entities/{entity.uuid}/?app_id={self.project.app_id}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data.get("id"), str(entity.uuid))

    def test_entity_mobile_user(self):
        self.client.force_authenticate(self.yoda)

        self.form_1.form_id = "A_FORM_ID"

        self.form_1.json = {"_version": "A_FORM_ID"}
        self.form_1.projects.add(self.project)

        self.form_1.save()

        FormVersion.objects.create(form=self.form_1, version_id="A_FORM_ID")

        entity_type = EntityType.objects.create(
            name="Type 1",
            reference_form=self.form_1,
        )

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
            project=self.project,
            uuid="9335359a-9f80-422d-997a-68ae7e39d9g3",
        )
        instance.file = File(open("iaso/tests/fixtures/test_entity_data2.xml", "rb"))
        instance.json = {
            "name": "Prince of Euphor",
            "father_name": "Professor Procyon",
            "age_type": 0,
            "birth_date": "1978-07-03",
            "gender": "male",
            "hc": "hc_C",
            "_version": "A_FORM_ID",
            "instanceID": "uuid:4901dff4-30af-49e2-afd1-42970bb8f03e",
        }
        instance.save()

        instance2 = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
            project=self.project,
            uuid="9335359a-9f80-422d-997a-68ae7e39d9g6",
        )
        instance2.file = File(open("iaso/tests/fixtures/test_entity_data2.xml", "rb"))
        instance2.json = {
            "name": "Prince of Euphor",
            "father_name": "Professor Procyon",
            "age_type": 0,
            "birth_date": "1978-07-03",
            "gender": "male",
            "hc": "hc_C",
            "_version": "A_FORM_ID",
            "instanceID": "uuid:4901dff4-30af-49e2-afd1-42970bb8f03e",
        }
        instance2.save()

        instance_unvalidated_ou = Instance.objects.create(
            org_unit=self.jedi_council_corruscant_unvalidated,
            form=self.form_1,
            period="202002",
            project=self.project,
            uuid="9335359a-9f80-422d-997a-68ae7e39d9g4",
        )
        instance_unvalidated_ou.file = File(open("iaso/tests/fixtures/test_entity_data2.xml", "rb"))
        instance_unvalidated_ou.json = {
            "name": "Prince of Euphor",
            "father_name": "Professor Procyon",
            "age_type": 0,
            "birth_date": "1978-07-03",
            "gender": "male",
            "hc": "hc_C",
            "_version": "A_FORM_ID",
            "instanceID": "uuid:4901dff4-30af-49e2-afd1-42970bb8f03e",
        }
        instance_unvalidated_ou.save()

        instance_entity_no_attributes = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
            project=self.project,
            uuid="9335359a-9f80-422d-997a-68ae7e39d9g5",
        )
        instance_entity_no_attributes.file = File(open("iaso/tests/fixtures/test_entity_data2.xml", "rb"))
        instance_entity_no_attributes.json = {
            "name": "Prince of Euphor",
            "father_name": "Professor Procyon",
            "age_type": 0,
            "birth_date": "1978-07-03",
            "gender": "male",
            "hc": "hc_C",
            "_version": "A_FORM_ID",
            "instanceID": "uuid:4901dff4-30af-49e2-afd1-42970bb8f03e",
        }
        instance_entity_no_attributes.save()

        self.form_1.instances.set([instance, instance_unvalidated_ou, instance_entity_no_attributes])
        self.form_1.save()

        entity = Entity.objects.create(
            name="New Client",
            entity_type=entity_type,
            attributes=instance,
            account=self.yoda.iaso_profile.account,
        )

        entity_unvalidated = Entity.objects.create(
            name="New Client",
            entity_type=entity_type,
            attributes=instance_unvalidated_ou,
            account=self.yoda.iaso_profile.account,
        )

        entity_no_attributes = Entity.objects.create(
            name="New Client_2",
            entity_type=entity_type,
            account=self.yop_solo.iaso_profile.account,
        )

        instance2.entity = entity
        instance2.save()

        # shouldn't appear
        instance_unvalidated_ou.entity = entity_unvalidated
        instance_unvalidated_ou.save()

        # shouldn't appear
        instance_entity_no_attributes.entity = entity_no_attributes
        instance_entity_no_attributes.save()

        response = self.client.get(f"/api/mobile/entities/?app_id={self.project.app_id}")

        response_json = response.json()

        var_dump(response_json)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_json.get("count"), 2)
        self.assertEqual(response_json.get("results")[0].get("entity_type_id"), str(entity_type.id))
        self.assertEqual(len(response_json.get("results")[0].get("instances")), 1)
        self.assertEqual(response_json.get("results")[1].get("entity_type_id"), str(entity_type.id))
        self.assertEqual(len(response_json.get("results")[1].get("instances")), 0)

    def test_access_respect_appid_mobile(self):
        self.client.force_authenticate(self.yoda)

        app_id = "APP_ID"

        project = Project.objects.create(name="Project 1", app_id=app_id, account=self.star_wars)
        project.account = self.star_wars
        project.save()

        self.form_1.projects.add(project)

        # we should return only the entities whose instaces/attributes are linked to this project.

        instance_app_id = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
            project=project,
            uuid="9335359a-9f80-422d-997a-68ae7e39d9g3",
        )
        instance_app_id.file = File(open("iaso/tests/fixtures/test_entity_data2.xml", "rb"))
        instance_app_id.json = {
            "name": "Prince of Euphor",
            "father_name": "Professor Procyon",
            "age_type": 0,
            "birth_date": "1978-07-03",
            "gender": "male",
            "hc": "hc_C",
            "_version": "2022090602",
            "instanceID": "uuid:4901dff4-30af-49e2-afd1-42970bb8f03e",
        }
        instance_app_id.save()

        entity_type, created = EntityType.objects.get_or_create(
            name="Type 1",
            reference_form=self.form_1,
        )

        entity_app_id = Entity.objects.create(
            name="New Client",
            entity_type=entity_type,
            attributes=instance_app_id,
            account=self.yoda.iaso_profile.account,
        )

        instance_app_id.entity = entity_app_id
        instance_app_id.save()

        FormVersion.objects.create(version_id="2022090602", form_id=instance_app_id.form.id)

        self.form_1.instances.add(instance_app_id)
        self.form_1.save()

        response = self.client.get(f"/api/mobile/entities/?app_id={app_id}")

        response_json = response.json()

        var_dump(response_json)

        self.assertEqual(response_json["count"], 1)
        self.assertEqual(response_json["results"][0]["entity_type_id"], str(entity_type.id))

        response_entity_instance = response_json["results"][0]["instances"]

        self.assertEqual(response_entity_instance[0]["id"], instance_app_id.uuid)
        self.assertEqual(response_entity_instance[0]["json"], instance_app_id.json)
