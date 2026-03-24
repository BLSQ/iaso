from django.test import TestCase

from iaso.models import Account, Form, Instance
from iaso.models.validation_workflow.templates import ValidationWorkflow


class TestValidationWorkflow(TestCase):
    def test_ensure_slug_is_updating(self):
        d1 = ValidationWorkflow.objects.create(name="test", account=Account.objects.create(name="test"))
        slug_1 = d1.slug
        d1.name = "new test"
        d1.save()
        d1.refresh_from_db()
        self.assertNotEqual(slug_1, d1.slug)

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

    def test_is_artifact_allowed(self):
        form = Form.objects.create()
        workflow = ValidationWorkflow.objects.create(name="test", account=Account.objects.create(name="test"))
        workflow.form_set.set([form])

        another_workflow = ValidationWorkflow.objects.create(
            name="another-test", account=Account.objects.create(name="test2")
        )

        another_form = Form.objects.create()

        instance = Instance.objects.create(form=form)
        another_instance = Instance.objects.create(form=another_form)

        self.assertTrue(workflow.is_artifact_allowed(instance))

        self.assertFalse(workflow.is_artifact_allowed(another_instance))

        self.assertTrue(another_workflow.is_artifact_allowed(instance))
        self.assertTrue(another_workflow.is_artifact_allowed(another_instance))
