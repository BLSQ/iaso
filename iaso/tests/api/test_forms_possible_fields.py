from django.test import SimpleTestCase

from iaso.api.forms.possible_fields import (
    POSSIBLE_FIELDS_USAGE_DEDUPLICATION,
    POSSIBLE_FIELDS_USAGE_ENTITY_TYPE_CONFIG,
    field_type_allowed,
    filter_possible_fields_by_usage,
)
from iaso.models.deduplication import EntityDuplicateAnalyzis


class PossibleFieldsFilterTestCase(SimpleTestCase):
    def test_field_type_allowed_exact_match(self):
        self.assertTrue(field_type_allowed("text", ["text", "integer"]))
        self.assertFalse(field_type_allowed("barcode", ["text", "integer"]))

    def test_field_type_allowed_select_with_choice_list_suffix(self):
        allowed = ["select_one", "select one", "text"]
        self.assertTrue(field_type_allowed("select_one gender", allowed))
        self.assertTrue(field_type_allowed("select one gender", allowed))
        self.assertFalse(field_type_allowed("select_multiple symptoms", allowed))

    def test_deduplication_usage_keeps_supported_types_only(self):
        fields = [
            {"name": "field1", "type": "text"},
            {"name": "field2", "type": "number"},
            {"name": "field3", "type": "photo"},
            {"name": "field4", "type": "select"},
            {"name": "field5", "type": "integer"},
            {"name": "field6", "type": None},
            {"name": "field7", "type": "barcode"},
            {"name": "gender", "type": "select one"},
        ]

        result = filter_possible_fields_by_usage(fields, POSSIBLE_FIELDS_USAGE_DEDUPLICATION)

        self.assertEqual(
            result,
            [
                {"name": "field1", "type": "text"},
                {"name": "field2", "type": "number"},
                {"name": "field5", "type": "integer"},
                {"name": "field6", "type": None},
            ],
        )
        self.assertNotIn("barcode", EntityDuplicateAnalyzis.SUPPORTED_FIELD_TYPES)

    def test_entity_type_config_includes_displayable_xlsform_types(self):
        fields = [
            {"name": "name", "type": "text"},
            {"name": "age", "type": "integer"},
            {"name": "dob", "type": "date"},
            {"name": "gender", "type": "select one"},
            {"name": "gender_with_list", "type": "select_one gender"},
            {"name": "symptoms", "type": "select_multiple"},
            {"name": "beneficiary_id", "type": "barcode"},
            {"name": "location", "type": "geopoint"},
            # media / complex geo / structural — not displayable in entity type config
            {"name": "photo", "type": "image"},
            {"name": "audio_note", "type": "audio"},
            {"name": "trace", "type": "geotrace"},
            {"name": "secret", "type": "hidden"},
            # XLSForm types not supported yet by useGetFieldValue
            {"name": "location", "type": "geopoint"},
            {"name": "score", "type": "range"},
            {"name": "today_field", "type": "today"},
            {"name": "consent", "type": "acknowledge"},
            {"name": "phone", "type": "phonenumber"},
            {"name": "collector", "type": "username"},
            {"name": "contact_email", "type": "email"},
            {"name": "device", "type": "deviceid"},
        ]

        result = filter_possible_fields_by_usage(fields, POSSIBLE_FIELDS_USAGE_ENTITY_TYPE_CONFIG)

        self.assertEqual(
            [field["name"] for field in result],
            ["name", "age", "dob", "gender", "gender_with_list", "symptoms", "beneficiary_id"],
        )

    def test_unknown_or_missing_usage_falls_back_to_deduplication(self):
        fields = [
            {"name": "field1", "type": "text"},
            {"name": "field7", "type": "barcode"},
            {"name": "gender", "type": "select one"},
        ]

        self.assertEqual(
            filter_possible_fields_by_usage(fields, "not_a_real_preset"),
            [{"name": "field1", "type": "text"}],
        )
        self.assertEqual(
            filter_possible_fields_by_usage(fields, None),
            [{"name": "field1", "type": "text"}],
        )

    def test_empty_possible_fields(self):
        self.assertEqual(filter_possible_fields_by_usage(None), [])
        self.assertEqual(filter_possible_fields_by_usage([]), [])
