from http import HTTPStatus
from uuid import uuid4

from django.core.files.base import ContentFile

from iaso import models as m
from iaso.models.deduplication import ValidationStatus
from iaso.permissions.core_permissions import (
    CORE_ENTITIES_DUPLICATES_READ_PERMISSION,
    CORE_ENTITIES_DUPLICATES_WRITE_PERMISSION,
)
from iaso.test import APITestCase


class EntityDuplicatesFixAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        account = m.Account.objects.create(name="Test Account")
        cls.account = account
        cls.project = m.Project.objects.create(name="Test Project", account=account, app_id="test.app")
        cls.user = cls.create_user_with_profile(
            username="test_user",
            account=account,
            permissions=[
                CORE_ENTITIES_DUPLICATES_READ_PERMISSION,
                CORE_ENTITIES_DUPLICATES_WRITE_PERMISSION,
            ],
        )

        cls.entity_type = m.EntityType.objects.create(name="Test Entity Type")
        cls.form = m.Form.objects.create(
            name="Test Form",
            possible_fields=[
                {"name": "name", "label": "Name", "type": "text"},
                {"name": "age", "label": "Age", "type": "integer"},
            ],
        )
        cls.project.forms.add(cls.form)
        cls.entity_type.reference_form = cls.form
        cls.entity_type.save()

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
                <entityUuid>{uuid4()}</entityUuid>
                <meta><instanceID>uuid:{uuid4()}</instanceID></meta>
            </data>"""
            instance = m.Instance.objects.create(
                form=cls.form,
                form_version=cls.form_version,
                project=cls.project,
                json={"name": f"Entity {i}", "age": 20 + i, "_version": "2020010101"},
                file=ContentFile(xml_content.encode("utf-8"), name=f"test_{i}.xml"),
            )
            m.InstanceFile.objects.create(instance=instance, file=f"test_file_{i}.jpg", name=f"test_file_{i}.jpg")

            entity = m.Entity.objects.create(
                name=f"Entity {i}",
                entity_type=cls.entity_type,
                account=account,
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

        # First merge them
        payload = {
            "entity1_id": self.entities[0].pk,
            "entity2_id": self.entities[1].pk,
            "merge": {"name": self.entities[0].pk, "age": self.entities[1].pk},
        }
        self.client.post("/api/entityduplicates/", data=payload, format="json")

        # Now try to view the detail of the merged pair
        response = self.client.get(
            f"/api/entityduplicates/detail/?entities={self.entities[0].pk},{self.entities[1].pk}"
        )
        data = self.assertJSONResponse(response, HTTPStatus.OK)

        self.assertIn("fields", data)

    def test_list_view_includes_merged_duplicates(self):
        self.client.force_authenticate(self.user)

        # Merge them
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
