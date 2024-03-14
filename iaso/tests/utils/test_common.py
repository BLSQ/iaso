from iaso.test import TestCase
from iaso.utils.models.common import get_creator_name


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
