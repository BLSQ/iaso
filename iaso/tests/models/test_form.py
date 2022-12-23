from iaso.test import TestCase

from iaso import models as m


class FormModelTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        sector = m.OrgUnitType.objects.create(name="Sector", short_name="Sec")

        cls.form_uses_validation = m.Form.objects.create(
            name="Hydroponics study 1", submission_to_be_validated_by=sector
        )

        cls.form_without_validation = m.Form.objects.create(name="Hydroponics study 1")

    def test_takes_part_validation_mechanism(self):
        self.assertTrue(self.form_uses_validation.takes_part_validation_mechanism)
        self.assertFalse(self.form_without_validation.takes_part_validation_mechanism)
