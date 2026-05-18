from datetime import timedelta

from django.utils import timezone

from iaso import models as m
from iaso.models.deduplication import ValidationStatus
from iaso.test import TestCase


class EntityTypeModelTestCase(TestCase):
    """
    Test EntityType model.
    """

    @classmethod
    def setUpTestData(cls):
        cls.account, cls.data_source, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            "source", "account", "project"
        )

    def test_entity_type_no_reference_form(self):
        """
        Checks that the as_dict method does not crash when there is no reference form - IA-4054
        """
        name = "EntityType"
        entity_type = m.EntityType.objects.create(
            name=name,
            code="Code",
            account=self.account,
        )
        entity_dict = entity_type.as_dict()
        self.assertIsNotNone(entity_dict["created_at"])
        self.assertIsNotNone(entity_dict["updated_at"])
        self.assertIsNotNone(entity_dict["account"])
        self.assertIsNone(entity_dict["reference_form"])
        self.assertEqual(entity_dict["name"], name)


class EntityTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Account")
        cls.form_1 = m.Form.objects.create(
            name="Hydroponics study",
            period_type=m.MONTH,
            single_per_period=True,
            form_id="form_1",
        )
        cls.project = m.Project.objects.create(name="Project", app_id="project", account=cls.account)
        cls.form_1.projects.add(cls.project)
        cls.entity_type = m.EntityType.objects.create(name="Type 1", reference_form=cls.form_1, account=cls.account)

    def test_pending_duplicate_ids(self):
        """Test the get_pending_duplicate_ids method on the Entity model."""
        entities = m.Entity.objects.bulk_create(
            m.Entity(entity_type=self.entity_type, account=self.account) for _ in range(4)
        )
        main_entity, other1, other2, other3 = entities

        dup1 = m.EntityDuplicate.objects.create(
            entity1=main_entity, entity2=other1, validation_status=ValidationStatus.PENDING
        )

        dup2 = m.EntityDuplicate.objects.create(
            entity1=other2, entity2=main_entity, validation_status=ValidationStatus.PENDING
        )

        dup3 = m.EntityDuplicate.objects.create(
            entity1=main_entity, entity2=other3, validation_status=ValidationStatus.VALIDATED
        )

        pending_ids = main_entity.get_pending_duplicate_ids()

        self.assertEqual(len(pending_ids), 2)
        self.assertCountEqual(pending_ids, [dup1.id, dup2.id])

    def test_latest_instance_created_at(self):
        """Test that the get_latest_instance_created_at method evaluates dates correctly."""
        entity = m.Entity.objects.create(entity_type=self.entity_type, account=self.account)

        # Test fallback when the entity has no instances
        self.assertEqual(entity.get_latest_instance_created_at(), entity.created_at)

        now = timezone.now()
        date_oldest = now - timedelta(days=10)
        date_middle = now - timedelta(days=5)
        date_newest = now - timedelta(days=1)

        # Test instance with only created_at
        inst1 = m.Instance.objects.create(entity=entity, form=self.form_1)
        m.Instance.objects.filter(id=inst1.id).update(created_at=date_oldest)

        self.assertEqual(entity.get_latest_instance_created_at(), date_oldest)

        # Test multiple instances
        inst2 = m.Instance.objects.create(entity=entity, form=self.form_1)
        m.Instance.objects.filter(id=inst2.id).update(created_at=date_middle)

        self.assertEqual(entity.get_latest_instance_created_at(), date_middle)

        # Test that source_created_at takes precedence
        inst3 = m.Instance.objects.create(entity=entity, form=self.form_1, source_created_at=date_newest)
        m.Instance.objects.filter(id=inst3.id).update(created_at=date_oldest)

        self.assertEqual(entity.get_latest_instance_created_at(), date_newest)
