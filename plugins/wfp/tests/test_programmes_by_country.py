from django.test import SimpleTestCase

from plugins.wfp.models import NUTRITION_PROGRAMMES, PROGRAMME_TYPE
from plugins.wfp.programmes_by_country import PROGRAMMES_BY_COUNTRY, PROGRAMMES_BY_ENTITY_TYPE


class ProgrammesByCountryTestCase(SimpleTestCase):
    """The configuration is written by hand: a typo would add sheets of an unknown programme, or show the women with
    the columns of the children, without any error."""

    def test_only_known_programmes_and_programme_types(self):
        # "Not Eligible" is a value of the journeys, not a programme the beneficiaries can be enrolled in
        programmes = {value for value, _ in NUTRITION_PROGRAMMES} - {"Not Eligible"}
        programme_types = {value for value, _ in PROGRAMME_TYPE}
        for country, entity_types in PROGRAMMES_BY_COUNTRY.items():
            for code, configured in entity_types.items():
                with self.subTest(country=country, code=code):
                    self.assertIn(configured.programme_type, programme_types)
                    self.assertEqual(set(configured.programmes) - programmes, set())

    def test_each_entity_type_in_one_country_only(self):
        # otherwise, the last country would silently override the others in `PROGRAMMES_BY_ENTITY_TYPE`
        codes = [code for entity_types in PROGRAMMES_BY_COUNTRY.values() for code in entity_types]
        self.assertEqual(len(PROGRAMMES_BY_ENTITY_TYPE), len(codes))
