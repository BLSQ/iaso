from iaso.tests.api.v3.org_units.base import OrgUnitV3TestCase


class OrgUnitV3PaginationTestCase(OrgUnitV3TestCase):
    """End-to-end checks - the edge cases of `V3PagePagination` are unit-tested in `common/test_pagination.py`."""

    def test_no_count_by_default(self):
        data = self.get_json({"page_size": 2})
        self.assertIsNone(data["count"])
        self.assertIsNone(data["pages"])
        self.assertEqual(len(data["results"]), 2)
        self.assertTrue(data["has_next"])
        self.assertFalse(data["has_previous"])

    def test_with_count(self):
        data = self.get_json({"page_size": 2, "with_count": "true"})
        self.assertEqual(data["count"], len(self.star_wars_org_units))
        self.assertEqual(data["pages"], 3)

    def test_walking_the_pages_returns_every_org_unit_once(self):
        ids, page = [], 1
        while True:
            data = self.get_json({"page_size": 2, "page": page, "fields": "id"})
            ids += [row["id"] for row in data["results"]]
            if not data["has_next"]:
                break
            page += 1
        self.assertEqual(page, 3)
        self.assertEqual(ids, sorted(org_unit.id for org_unit in self.star_wars_org_units))

    def test_page_size_at_max_is_allowed(self):
        self.assertEqual(self.get_json({"page_size": 200_000})["page_size"], 200_000)

    def test_page_size_over_max_is_bad_request(self):
        data = self.get_error({"page_size": 200_001})
        self.assertEqual(data, {"error": "Invalid page_size: 200001", "detail": "page_size must be <= 200000."})

    def test_invalid_page_size_or_page_is_bad_request(self):
        self.assertEqual(self.get_error({"page_size": "abc"})["error"], "Invalid page_size: 'abc'")
        self.assertEqual(self.get_error({"page": "0"})["error"], "Invalid page: '0'")

    def test_page_past_the_end_is_not_found(self):
        self.get_error({"page_size": 2, "page": 999}, status_code=404)
