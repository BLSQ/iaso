from django.test import TestCase

from iaso.models.validation_workflow.templates import ValidationWorkflow


class TestValidationWorkflow(TestCase):
    def test_ensure_slug_is_updating(self):
        d1 = ValidationWorkflow.objects.create(name="test")
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
        for sentence in sentences:
            with self.subTest(sentence=sentence[0]):
                d1 = ValidationWorkflow.objects.create(name=sentence[0])
                self.assertEqual(
                    d1.slug,
                    sentence[1],
                    f"Slugifying with special characters failed, expected {sentence[1]} got {d1.slug}, make sure unidecode is installed",
                )
