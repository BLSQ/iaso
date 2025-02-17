from django.contrib.auth.models import AnonymousUser
from django.core.files import File

from iaso import models as m
from iaso.api.deduplication.entity_duplicate import merge_entities
from iaso.models import Entity, EntityType, Instance
from iaso.test import APITestCase


class EntityAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Account")
        cls.sw_source = m.DataSource.objects.create(name="Data source")
        cls.sw_version = m.SourceVersion.objects.create(data_source=cls.sw_source, number=1)
        cls.account.default_version = cls.sw_version
        cls.account.save()
        cls.sw_version = cls.sw_version

        cls.anon = AnonymousUser()

        cls.project = m.Project.objects.create(
            name="Disease tracking",
            app_id="app.id.com",
            account=cls.account,
        )

        cls.user = cls.create_user_with_profile(username="user", account=cls.account, permissions=["iaso_entities"])

        cls.form = m.Form.objects.create(name="Registration", period_type=m.MONTH, single_per_period=True)
        entity_type = EntityType.objects.create(
            name="Patient",
            reference_form=cls.form,
            account=cls.account,
        )

        cls.entity1 = Entity.objects.create(entity_type=entity_type, account=cls.account)
        cls.entity2 = Entity.objects.create(entity_type=entity_type, account=cls.account)
        cls.entity3 = Entity.objects.create(entity_type=entity_type, account=cls.account)

    def test_no_deleted_entities(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/mobile/entities/deleted/?app_id={self.project.app_id}")

        self.assertEqual(response.status_code, 200)
        json_response = response.json()
        self.assertEqual(len(json_response["results"]), 0)

        # make sure the endpoint is paginated
        self.assertEqual(json_response["count"], 0)
        self.assertEqual(json_response["has_next"], False)

    def test_get_deleted_entities(self):
        self.entity1.delete()

        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/mobile/entities/deleted/?app_id={self.project.app_id}")

        self.assertEqual(response.status_code, 200)
        json_response = response.json()
        self.assertEqual(json_response["count"], 1)
        self.assertEqual(len(json_response["results"]), 1)
        ent = json_response["results"][0]
        self.assertEqual(ent["id"], self.entity1.id)
        self.assertEqual(ent["uuid"], str(self.entity1.uuid))
        self.assertIsNotNone(ent["deleted_at"])
        self.assertIsNone(ent["merged_to_uuid"])

    def test_get_merged_entities(self):
        # Add proper attributes or the merge will fail
        with open("iaso/fixtures/instance_form_1_1.xml", "rb") as f:
            instance1 = Instance.objects.create(form=self.form, period="202002", file=File(f))
            instance1.entity = self.entity1
            instance1.save()
            self.entity1.attributes = instance1
            self.entity1.save()

            instance2 = Instance.objects.create(form=self.form, period="202002", file=File(f))
            instance2.entity = self.entity2
            instance2.save()
            self.entity2.attributes = instance2
            self.entity2.save()

        new_entity = merge_entities(self.entity1, self.entity2, {}, self.user)

        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/mobile/entities/deleted/?app_id={self.project.app_id}")

        self.assertEqual(response.status_code, 200)
        json_response = response.json()
        self.assertEqual(json_response["count"], 2)
        self.assertEqual(len(json_response["results"]), 2)

        ent1, ent2 = json_response["results"]
        self.assertEqual(ent1["id"], self.entity1.id)
        self.assertEqual(ent1["uuid"], str(self.entity1.uuid))
        self.assertIsNotNone(ent1["deleted_at"])
        self.assertEqual(ent1["merged_to_uuid"], str(new_entity.uuid))
        self.assertEqual(ent2["id"], self.entity2.id)
        self.assertEqual(ent2["uuid"], str(self.entity2.uuid))
        self.assertIsNotNone(ent2["deleted_at"])
        self.assertEqual(ent2["merged_to_uuid"], str(new_entity.uuid))
