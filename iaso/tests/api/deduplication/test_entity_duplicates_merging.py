"""Entity merging tests."""

from http import HTTPStatus
from uuid import uuid4

from django.core.files.base import ContentFile
from django.core.files.uploadedfile import UploadedFile
from rest_framework import status

from beanstalk_worker.services import TestTaskService
from hat.audit.models import ENTITY_DUPLICATE_DISCARD, Modification
from iaso import models as m
from iaso.models.deduplication import ValidationStatus
from iaso.permissions.core_permissions import (
    CORE_ENTITIES_DUPLICATES_READ_PERMISSION,
    CORE_ENTITIES_DUPLICATES_WRITE_PERMISSION,
)
from iaso.test import APITestCase


class EntityDuplicatesTestBase(APITestCase):
    """3 entities, each with a registration and a follow-up submission, in 2 pending pairs: (0, 1) and (0, 2)."""

    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Test Account")
        cls.project = m.Project.objects.create(name="Test Project", account=cls.account, app_id="test.app")

        cls.org_unit_type = m.OrgUnitType.objects.create(name="Org Unit Type", short_name="ou_type")
        cls.default_orgunit = m.OrgUnit.objects.create(
            name="Default Org Unit",
            org_unit_type=cls.org_unit_type,
        )

        cls.user = cls.create_user_with_profile(
            username="test_user",
            account=cls.account,
            permissions=[
                CORE_ENTITIES_DUPLICATES_READ_PERMISSION,
                CORE_ENTITIES_DUPLICATES_WRITE_PERMISSION,
            ],
            org_units=[cls.default_orgunit],
        )

        cls.form = m.Form.objects.create(
            name="Test Form",
            possible_fields=[
                {"name": "name", "label": "Name", "type": "text"},
                {"name": "age", "label": "Age", "type": "integer"},
                {"name": "Prenom", "label": "Prenom", "type": "text"},
                {"name": "Nom", "label": "Nom", "type": "text"},
                {"name": "height_cm__decimal__", "label": "height", "type": "decimal"},
                {"name": "_height_cm__decimal__", "label": "height2", "type": "decimal"},
            ],
        )
        cls.project.forms.add(cls.form)

        cls.entity_type = m.EntityType.objects.create(
            name="Test Entity Type", reference_form=cls.form, account=cls.account
        )

        cls.form_version = m.FormVersion.objects.create(form=cls.form, version_id="2020010101")

        cls.analyze = m.EntityDuplicateAnalyzis.objects.create(
            algorithm="levenshtein",
            metadata={"fields": ["name", "age"], "entity_type_id": cls.entity_type.pk},
        )

        cls.entities = []
        for i in range(3):
            xml_content = f"""<data>
                <name>Entity {i}</name>
                <age>{20 + i}</age>
                <Prenom>Same</Prenom>
                <Nom>Name</Nom>
                <entityUuid>{uuid4()}</entityUuid>
                <meta><instanceID>uuid:{uuid4()}</instanceID></meta>
            </data>"""
            instance = m.Instance.objects.create(
                form=cls.form,
                form_version=cls.form_version,
                project=cls.project,
                json={
                    "name": f"Entity {i}",
                    "age": 20 + i,
                    "Prenom": "Same",
                    "Nom": "Name",
                    "_version": "2020010101",
                },
                file=ContentFile(xml_content.encode("utf-8"), name=f"test_{i}.xml"),
            )
            m.InstanceFile.objects.create(instance=instance, file=f"test_file_{i}.jpg", name=f"test_file_{i}.jpg")

            entity = m.Entity.objects.create(
                name=f"Entity {i}",
                entity_type=cls.entity_type,
                account=cls.account,
                attributes=instance,
                uuid=uuid4(),
            )
            instance.entity = entity
            instance.save()

            extra_instance = m.Instance.objects.create(
                form=cls.form,
                form_version=cls.form_version,
                project=cls.project,
                entity=entity,
                file=ContentFile(xml_content.encode("utf-8"), name=f"extra_test_{i}.xml"),
            )
            m.InstanceFile.objects.create(
                instance=extra_instance, file=f"extra_test_file_{i}.jpg", name=f"extra_test_file_{i}.jpg"
            )

            cls.entities.append(entity)

        # Create duplicate pairs: (0, 1) and (0, 2)
        cls.dup1 = m.EntityDuplicate.objects.create(
            entity1=cls.entities[0],
            entity2=cls.entities[1],
            similarity_score=90,
            validation_status=ValidationStatus.PENDING,
            analyze=cls.analyze,
        )
        cls.dup2 = m.EntityDuplicate.objects.create(
            entity1=cls.entities[0],
            entity2=cls.entities[2],
            similarity_score=80,
            validation_status=ValidationStatus.PENDING,
            analyze=cls.analyze,
        )


class EntityDuplicatesMergingAPITestCase(EntityDuplicatesTestBase):
    def test_merge_updates_related_duplicates(self):
        self.client.force_authenticate(self.user)

        # Merge Entity 0 and Entity 1 into a new entity
        payload = {
            "entity1_id": self.entities[0].pk,
            "entity2_id": self.entities[1].pk,
            "merge": {
                "name": self.entities[0].pk,
                "age": self.entities[1].pk,
            },
            "ignore": False,
        }

        response = self.client.post("/api/entityduplicates/", data=payload, format="json")
        self.assertEqual(response.status_code, HTTPStatus.OK)
        new_entity_id = response.data["new_entity_id"]

        # Verify old entities are soft-deleted
        self.entities[0].refresh_from_db()
        self.entities[1].refresh_from_db()
        self.assertIsNotNone(self.entities[0].deleted_at)
        self.assertIsNotNone(self.entities[1].deleted_at)

        # Verify dup1 (merged pair) is validated
        self.dup1.refresh_from_db()
        self.assertEqual(self.dup1.validation_status, ValidationStatus.VALIDATED)

        # Verify dup2 (related pair) is updated to point to the new entity
        self.dup2.refresh_from_db()
        self.assertEqual(self.dup2.entity1.pk, new_entity_id)
        self.assertEqual(self.dup2.entity2.pk, self.entities[2].pk)

        # Verify InstanceFiles are copied
        new_entity = m.Entity.objects.get(pk=new_entity_id)
        # files from merged attributes
        self.assertEqual(new_entity.attributes.instancefile_set.count(), 2)

        other_instances = new_entity.instances.exclude(id=new_entity.attributes_id)
        self.assertEqual(other_instances.count(), 2)
        for inst in other_instances:
            self.assertEqual(inst.instancefile_set.count(), 1)

    def test_detail_view_with_merged_entities(self):
        self.client.force_authenticate(self.user)

        payload = {
            "entity1_id": self.entities[0].pk,
            "entity2_id": self.entities[1].pk,
            "merge": {"name": self.entities[0].pk, "age": self.entities[1].pk},
        }
        self.client.post("/api/entityduplicates/", data=payload, format="json")

        response = self.client.get(
            f"/api/entityduplicates/detail/?entities={self.entities[0].pk},{self.entities[1].pk}"
        )
        data = self.assertJSONResponse(response, HTTPStatus.OK)

        self.assertIn("fields", data)

    def test_list_view_includes_merged_duplicates(self):
        self.client.force_authenticate(self.user)

        payload = {
            "entity1_id": self.entities[0].pk,
            "entity2_id": self.entities[1].pk,
            "merge": {"name": self.entities[0].pk, "age": self.entities[1].pk},
        }
        self.client.post("/api/entityduplicates/", data=payload, format="json")

        # Check list view with merged=true
        response = self.client.get("/api/entityduplicates/?merged=true")
        data = self.assertJSONResponse(response, HTTPStatus.OK)
        # Should find at least the merged one
        self.assertTrue(any(d["id"] == self.dup1.id for d in data["results"]))

    def test_merge_entity_duplicate(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(
            "/api/entityduplicates_analyzes/",
            {
                "entity_type_id": self.entity_type.id,
                "fields": ["Prenom", "Nom"],
                "algorithm": "levenshtein",
                "parameters": [],
            },
            format="json",
        )

        task_service = TestTaskService()
        task_service.run_all()

        duplicate = m.EntityDuplicate.objects.first()

        self.assertEqual(duplicate.validation_status, ValidationStatus.PENDING)

        entity1 = duplicate.entity1
        entity2 = duplicate.entity2

        merged_data = {i: entity1.id for i in ["Nom", "Prenom", "height_cm__decimal__", "_height_cm__decimal__"]}

        response = self.client.post(
            "/api/entityduplicates/",
            data={"merge": merged_data, "entity1_id": entity1.id, "entity2_id": entity2.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()

        self.assertIn("entity1_id", response_data)
        self.assertIn("entity2_id", response_data)
        self.assertIn("ignored", response_data)
        self.assertIn("new_entity_id", response_data)

        # entity1_id should be the same as entity1.id
        self.assertEqual(response_data["entity1_id"], entity1.id)
        # entity2_id should be the same as entity2.id
        self.assertEqual(response_data["entity2_id"], entity2.id)
        # ignore should be True
        self.assertEqual(response_data["ignored"], False)

        # Verify DB updates were correctly done
        entity1.refresh_from_db()
        entity2.refresh_from_db()
        self.assertIsNotNone(entity1.deleted_at)
        self.assertIsNotNone(entity2.deleted_at)
        self.assertEqual(entity1.merged_to_id, response_data["new_entity_id"])
        self.assertEqual(entity2.merged_to_id, response_data["new_entity_id"])

    # WC2-532 Merge entities with instance containing emoji
    def test_merge_entity_duplicate_with_emoji(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(
            "/api/entityduplicates_analyzes/",
            {
                "entity_type_id": self.entity_type.id,
                "fields": ["Prenom", "Nom"],
                "algorithm": "levenshtein",
                "parameters": [],
            },
            format="json",
        )

        task_service = TestTaskService()
        task_service.run_all()

        duplicate = m.EntityDuplicate.objects.first()

        self.assertEqual(duplicate.validation_status, ValidationStatus.PENDING)

        entity1 = duplicate.entity1
        entity2 = duplicate.entity2

        # Now add a form instance with an emoji to entity1
        with open("iaso/tests/fixtures/submission_with_emoji.xml", "rb") as xml_file:
            instance = m.Instance.objects.create(
                entity=entity1,
                form=self.form,
                org_unit=self.default_orgunit,
                file=UploadedFile(xml_file),
            )
        json_instance = instance.get_and_save_json_of_xml()
        # make sure the emoji is there
        self.assertEqual(json_instance["prevous_muac_color"], "🟡Yellow")

        merged_data = {i: entity1.id for i in duplicate.analyze.metadata["fields"]}

        response = self.client.post(
            "/api/entityduplicates/",
            data={"merge": merged_data, "entity1_id": entity1.id, "entity2_id": entity2.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()

        # Verify DB updates were correctly done
        entity1.refresh_from_db()
        entity2.refresh_from_db()
        self.assertIsNotNone(entity1.deleted_at)
        self.assertIsNotNone(entity2.deleted_at)
        self.assertEqual(entity1.merged_to_id, response_data["new_entity_id"])
        self.assertEqual(entity2.merged_to_id, response_data["new_entity_id"])

        merged = entity1.merged_to
        self.assertEqual(merged.instances.count(), 4)  # 1 attributes + 1 emoji + 2 extra instances from setup
        self.assertTrue(merged.instances.filter(json__prevous_muac_color="🟡Yellow").exists())


class EntityDuplicatesDiscardEntityAPITestCase(EntityDuplicatesTestBase):
    """
    Test resolving duplicates by soft deleting one of the two entities, instead of merging them.

    (ENTITY_DUPLICATES_SOFT_DELETE feature flag)
    """

    URL = "/api/entityduplicates/"

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.soft_delete_flag, _ = m.AccountFeatureFlag.objects.get_or_create(
            code="ENTITY_DUPLICATES_SOFT_DELETE", defaults={"name": "Entity duplicates soft deletion"}
        )
        cls.read_only_user = cls.create_user_with_profile(
            username="read_only_user",
            account=cls.account,
            permissions=[CORE_ENTITIES_DUPLICATES_READ_PERMISSION],
            org_units=[cls.default_orgunit],
        )

    def setUp(self):
        self.account.feature_flags.add(self.soft_delete_flag)

    def discard_entity(self, entity_to_discard, entity1=None, entity2=None, user=None):
        self.client.force_authenticate(user or self.user)
        return self.client.post(
            self.URL,
            data={
                "action": "discard_entity",
                "entity1_id": (entity1 or self.entities[0]).pk,
                "entity2_id": (entity2 or self.entities[1]).pk,
                "entity_to_discard_id": entity_to_discard.pk,
            },
            format="json",
        )

    def test_discard_entity_entity_of_pair(self):
        to_delete, kept = self.entities[1], self.entities[0]
        instance_ids = list(to_delete.instances.values_list("id", flat=True))

        response = self.discard_entity(to_delete)
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(
            data,
            {"deleted_entity_id": to_delete.pk, "entity1_id": kept.pk, "entity2_id": to_delete.pk, "ignored": False},
        )

        to_delete.refresh_from_db()
        self.assertIsNotNone(to_delete.deleted_at)
        self.assertIsNone(to_delete.merged_to_id)  # nothing is merged
        self.assertEqual(len(instance_ids), 2)
        self.assertFalse(m.Instance.objects.filter(id__in=instance_ids, deleted=False).exists())
        kept.refresh_from_db()
        self.assertIsNone(kept.deleted_at)
        self.assertEqual(kept.instances.filter(deleted=False).count(), 2)

        # The pair of the deleted entity is removed, the other pair of the kept entity stays
        self.assertFalse(m.EntityDuplicate.objects.filter(pk=self.dup1.pk).exists())
        self.assertTrue(m.EntityDuplicate.objects.filter(pk=self.dup2.pk).exists())
        # Logged with its own source: the entity and its 2 submissions
        self.assertEqual(Modification.objects.filter(source=ENTITY_DUPLICATE_DISCARD, user=self.user).count(), 3)

    def test_discard_entity_needs_feature_flag(self):
        self.account.feature_flags.remove(self.soft_delete_flag)
        response = self.discard_entity(self.entities[1])
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)
        self.entities[1].refresh_from_db()
        self.assertIsNone(self.entities[1].deleted_at)

    def test_discard_entity_needs_write_permission(self):
        response = self.discard_entity(self.entities[1], user=self.read_only_user)
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)
        self.entities[1].refresh_from_db()
        self.assertIsNone(self.entities[1].deleted_at)

    def test_discard_entity_errors(self):
        # The entity to delete must be one of the pair
        response = self.discard_entity(self.entities[2])
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

        # No pair between these entities
        response = self.discard_entity(self.entities[2], entity1=self.entities[1], entity2=self.entities[2])
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

        # Pair already ignored
        self.dup1.validation_status = ValidationStatus.IGNORED
        self.dup1.save()
        response = self.discard_entity(self.entities[1])
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

        for entity in self.entities:
            entity.refresh_from_db()
            self.assertIsNone(entity.deleted_at)

    def test_discard_entity_already_deleted_entity(self):
        self.entities[1].delete()
        response = self.discard_entity(self.entities[1])
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

    def test_merge_refused_with_soft_delete_flag(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/entityduplicates/",
            data={
                "entity1_id": self.entities[0].pk,
                "entity2_id": self.entities[1].pk,
                "merge": {"name": self.entities[0].pk},
            },
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)
        self.entities[0].refresh_from_db()
        self.assertIsNone(self.entities[0].deleted_at)

    def test_ignore_allowed_with_soft_delete_flag(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/entityduplicates/",
            data={"entity1_id": self.entities[0].pk, "entity2_id": self.entities[1].pk, "ignore": True},
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_200_OK)
        self.dup1.refresh_from_db()
        self.assertEqual(self.dup1.validation_status, ValidationStatus.IGNORED)

    def test_merge_and_ignore_need_write_permission(self):
        self.account.feature_flags.remove(self.soft_delete_flag)
        self.client.force_authenticate(self.read_only_user)
        for payload in [
            {"merge": {"name": self.entities[0].pk}},
            {"ignore": True},
        ]:
            response = self.client.post(
                "/api/entityduplicates/",
                data={"entity1_id": self.entities[0].pk, "entity2_id": self.entities[1].pk, **payload},
                format="json",
            )
            self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)
        self.dup1.refresh_from_db()
        self.assertEqual(self.dup1.validation_status, ValidationStatus.PENDING)

    def test_explicit_ignore_action(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.URL,
            data={"action": "ignore", "entity1_id": self.entities[0].pk, "entity2_id": self.entities[1].pk},
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_200_OK)
        self.dup1.refresh_from_db()
        self.assertEqual(self.dup1.validation_status, ValidationStatus.IGNORED)

    def test_fields_that_dont_match_the_action_are_refused(self):
        self.client.force_authenticate(self.user)
        pair = {"entity1_id": self.entities[0].pk, "entity2_id": self.entities[1].pk}
        for payload in [
            {"action": "discard_entity", "entity_to_discard_id": self.entities[1].pk, "ignore": True},
            {"action": "discard_entity", "entity_to_discard_id": self.entities[1].pk, "merge": {}},
            {"action": "ignore", "entity_to_discard_id": self.entities[1].pk},
            {"action": "discard_entity"},  # missing entity_to_discard_id
            {"action": "unknown"},
        ]:
            with self.subTest(payload=payload):
                response = self.client.post(self.URL, data={**pair, **payload}, format="json")
                self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.dup1.refresh_from_db()
        self.assertEqual(self.dup1.validation_status, ValidationStatus.PENDING)
        self.entities[1].refresh_from_db()
        self.assertIsNone(self.entities[1].deleted_at)

    def test_merge_without_merge_definition_is_refused(self):
        self.account.feature_flags.remove(self.soft_delete_flag)
        self.client.force_authenticate(self.user)
        for payload in [{}, {"action": "merge"}]:
            with self.subTest(payload=payload):
                response = self.client.post(
                    self.URL,
                    data={"entity1_id": self.entities[0].pk, "entity2_id": self.entities[1].pk, **payload},
                    format="json",
                )
                self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
