from django.test import SimpleTestCase
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from iaso.api.v3.common.pagination import V3PagePagination


class _Rows(list):
    """Stands in for a queryset: sliceable, plus the `count()` `with_count=true` calls."""

    def count(self):
        return len(self)


class _View:
    results_key = "org_units"


class V3PagePaginationTestCase(SimpleTestCase):
    def setUp(self):
        self.rows = _Rows(range(1, 6))  # 5 rows
        self.paginator = V3PagePagination()

    def request(self, **params):
        return Request(APIRequestFactory().get("/", params))

    def paginate(self, **params):
        return self.paginator.paginate_queryset(self.rows, self.request(**params))

    def response(self, **params):
        page = self.paginate(**params)
        return self.paginator.get_paginated_response(page).data

    # -- page_size --

    def test_page_size_defaults_to_100(self):
        self.assertEqual(self.paginator.get_page_size(self.request()), 100)

    def test_explicit_page_size(self):
        self.assertEqual(self.paginator.get_page_size(self.request(page_size=2)), 2)

    def test_page_size_at_max_is_allowed(self):
        self.assertEqual(self.paginator.get_page_size(self.request(page_size=200_000)), 200_000)

    def test_page_size_over_max_is_bad_request(self):
        with self.assertRaises(ValidationError) as ctx:
            self.paginator.get_page_size(self.request(page_size=200_001))
        self.assertEqual(ctx.exception.detail["error"], "Invalid page_size: 200001")
        self.assertEqual(ctx.exception.detail["detail"], "page_size must be <= 200000.")

    def assert_bad_request(self, error, **params):
        with self.assertRaises(ValidationError) as ctx:
            self.paginate(**params)
        self.assertEqual(ctx.exception.detail["error"], error)
        return ctx.exception.detail

    def test_non_numeric_or_non_positive_page_size_is_bad_request(self):
        for page_size in ("abc", "1.5", "", "0", "-3"):
            with self.subTest(page_size=page_size):
                detail = self.assert_bad_request(f"Invalid page_size: {page_size!r}", page_size=page_size)
                self.assertEqual(detail["detail"], "page_size must be a positive integer.")

    # -- page --

    def test_first_page_by_default(self):
        data = self.response(page_size=2)
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["results"], [1, 2])
        self.assertFalse(data["has_previous"])
        self.assertTrue(data["has_next"])

    def test_middle_page(self):
        data = self.response(page_size=2, page=2)
        self.assertEqual(data["results"], [3, 4])
        self.assertTrue(data["has_previous"])
        self.assertTrue(data["has_next"])

    def test_last_partial_page_has_no_next(self):
        data = self.response(page_size=2, page=3)
        self.assertEqual(data["results"], [5])
        self.assertFalse(data["has_next"])

    def test_page_exactly_full_has_no_next(self):
        # the extra fetched row is what tells "exactly full" apart from "more to come"
        data = self.response(page_size=5)
        self.assertEqual(data["results"], [1, 2, 3, 4, 5])
        self.assertFalse(data["has_next"])

    def test_non_numeric_or_non_positive_page_is_bad_request(self):
        for page in ("abc", "2.0", "", "0", "-1"):
            with self.subTest(page=page):
                detail = self.assert_bad_request(f"Invalid page: {page!r}", page=page)
                self.assertEqual(detail["detail"], "page must be a positive integer.")

    def test_page_past_the_end_is_not_found(self):
        with self.assertRaisesMessage(NotFound, "Page 4 is out of range"):
            self.paginate(page_size=2, page=4)

    def test_empty_first_page_is_not_an_error(self):
        self.rows = _Rows()
        data = self.response()
        self.assertEqual(data["results"], [])
        self.assertFalse(data["has_next"])

    # -- count --

    def test_count_and_pages_are_null_by_default(self):
        data = self.response(page_size=2)
        self.assertIsNone(data["count"])
        self.assertIsNone(data["pages"])

    def test_with_count_accepts_several_truthy_spellings(self):
        for value in ("true", "True", "1", "yes"):
            with self.subTest(with_count=value):
                self.assertEqual(self.response(page_size=2, with_count=value)["count"], 5)
        self.assertIsNone(self.response(page_size=2, with_count="false")["count"])

    def test_pages_is_rounded_up(self):
        for page_size, expected_pages in ((2, 3), (5, 1), (1, 5), (10, 1)):
            with self.subTest(page_size=page_size):
                self.assertEqual(self.response(page_size=page_size, with_count="true")["pages"], expected_pages)

    def test_pages_is_zero_without_rows(self):
        self.rows = _Rows()
        self.assertEqual(self.response(with_count="true")["pages"], 0)

    # -- response shape --

    def test_response_keys(self):
        self.assertEqual(
            set(self.response(page_size=2)),
            {"count", "results", "has_next", "has_previous", "page", "pages", "page_size"},
        )

    def test_results_key_comes_from_the_view(self):
        request = self.request()
        request.parser_context = {"view": _View()}
        page = self.paginator.paginate_queryset(self.rows, request)
        self.assertEqual(self.paginator.get_paginated_response(page).data["org_units"], [1, 2, 3, 4, 5])

    def test_response_schema_documents_nullable_count(self):
        self.paginator.request = self.request()
        schema = self.paginator.get_paginated_response_schema({"type": "array"})
        self.assertTrue(schema["properties"]["count"]["nullable"])
        self.assertEqual(schema["properties"]["results"], {"type": "array"})
