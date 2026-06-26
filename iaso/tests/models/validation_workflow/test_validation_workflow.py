from django.db import IntegrityError
from django.test import TransactionTestCase

from iaso.models import Account
from iaso.models.validation_workflow import ValidationWorkflow


class TestValidationWorkflow(TransactionTestCase):
    def test_ensure_slug_is_not_updating(self):
        d1 = ValidationWorkflow.objects.create(name="test", account=Account.objects.create(name="test"))
        slug_1 = d1.slug
        d1.name = "new test"
        d1.save()
        d1.refresh_from_db()
        self.assertEqual(slug_1, d1.slug)

    def test_slug_is_not_none_with_special_characters(self):
        sentences = [
            ["éééééééééééééöööööööööööööööööööööµ", "eeeeeeeeeeeeeooooooooooooooooooooou"],
            ["Ангажимент към околната среда", "angazhiment-km-okolnata-sreda"],
            ["Το ρολόι είναι δώρο", "to-roloi-einai-doro"],
        ]
        account = Account.objects.create(name="test")
        for sentence in sentences:
            with self.subTest(sentence=sentence[0]):
                d1 = ValidationWorkflow.objects.create(name=sentence[0], account=account)
                self.assertEqual(
                    d1.slug,
                    sentence[1],
                    f"Slugifying with special characters failed, expected {sentence[1]} got {d1.slug}, make sure unidecode is installed",
                )

    def test_ensure_slug_is_unique_with_account(self):
        account = Account.objects.create(name="test")
        other_account = Account.objects.create(name="another account")
        d1 = ValidationWorkflow.objects.create(name="test", account=account)
        d3 = ValidationWorkflow.objects.create(name="test", account=other_account)

        self.assertEqual(d1.slug, "test")
        self.assertEqual(d3.slug, "test")

    def test_unique_constraints(self):
        account = Account.objects.create(name="test")
        vf = ValidationWorkflow.objects.create(name="test", account=account)

        with self.assertRaises(IntegrityError):
            ValidationWorkflow.objects.create(name="test", account=account)

        vf.delete()

        vf.refresh_from_db()
        self.assertIsNotNone(vf.deleted_at)

        vf2 = ValidationWorkflow.objects.create(name="test", account=account)

        self.assertEqual(vf.slug, vf2.slug)
        self.assertEqual(vf.name, vf2.name)
