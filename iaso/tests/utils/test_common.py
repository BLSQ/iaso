from iaso.test import TestCase
from iaso.utils.models.common import get_creator_name, get_org_unit_parents_ref


class CommonTestCase(TestCase):
    def test_get_creator_name(self):
        user = {"username": "yoda", "first_name": "Yo", "last_name": "Da"}
        creator = get_creator_name(
            None,
            user.get("username", ""),
            user.get("first_name", ""),
            user.get("last_name", ""),
        )
        self.assertEqual(creator, "yoda (Yo Da)")

    def test_get_creator_name_with_username_only(self):
        user = {"username": "yoda"}
        creator = get_creator_name(
            None,
            user.get("username", ""),
            user.get("first_name", ""),
            user.get("last_name", ""),
        )
        self.assertEqual(creator, "yoda")

    def test_get_org_unit_parents_ref(self):
        org_unit = {
            "id": 9354,
            "name": "Test 2",
            "org_unit_type__name": "FosaPlay",
            "version__data_source__name": "reference_play_test2.40.3",
            "validation_status": "NEW",
            "parent__name": "Parent",
            "parent__parent__name": "Parent 1",
            "parent__parent__parent__name": "Parent 2",
            "parent__parent__source_ref": "fdc6uOvgoji",
            "parent__parent__parent__source_ref": "ImspTQPwCqd",
            "parent__id": 7513,
            "parent__parent__id": 7417,
            "parent__parent__parent__id": 6688,
        }
        parent_source_ref_field_names = [
            "parent__source_ref",
            "parent__parent__source_ref",
            "parent__parent__parent__source_ref",
            "parent__parent__parent__parent__source_ref",
        ]

        parent_field_ids = [
            "parent__id",
            "parent__parent__id",
            "parent__parent__parent__id",
            "parent__parent__parent__parent__id",
        ]
        parents_source_ref = [
            get_org_unit_parents_ref(field_name, org_unit, parent_source_ref_field_names, parent_field_ids)
            for field_name in parent_source_ref_field_names
        ]
        self.assertEqual(parents_source_ref, ["iaso#7513", "fdc6uOvgoji", "ImspTQPwCqd", None])
