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

    def test_annotate_duplicates(self):
        """Test queryset method with_duplicates"""
        entities = m.Entity.objects.bulk_create(
            m.Entity(entity_type=self.entity_type, account=self.account) for _ in range(6)
        )

        # Entities 0-2 are duplicates of each other
        m.EntityDuplicate.objects.create(
            entity1=entities[0], entity2=entities[1], validation_status=ValidationStatus.PENDING
        )
        m.EntityDuplicate.objects.create(
            entity1=entities[0], entity2=entities[2], validation_status=ValidationStatus.PENDING
        )

        # Entities 3-4 as well
        m.EntityDuplicate.objects.create(
            entity1=entities[3], entity2=entities[4], validation_status=ValidationStatus.PENDING
        )

        annotated = list(m.Entity.objects.with_duplicates().all())

        self.assertEqual(sorted(annotated[0].duplicate_ids), [annotated[1].id, annotated[2].id])

        self.assertEqual(sorted(annotated[1].duplicate_ids), [annotated[0].id])
        self.assertEqual(sorted(annotated[2].duplicate_ids), [annotated[0].id])

        self.assertEqual(sorted(annotated[3].duplicate_ids), [annotated[4].id])
        self.assertEqual(sorted(annotated[4].duplicate_ids), [annotated[3].id])

        # Entity 6 has no duplicates
        self.assertEqual(sorted(annotated[5].duplicate_ids), [])
