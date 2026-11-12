from django.test import SimpleTestCase

from iaso.tasks.mobile_app_setup.api_calls import API_CALLS, ApiCall, Page, Pagination
from iaso.tests.tasks.mobile_app_setup.mocks import FakeClient


def _page(page, pages, results):
    return {"page": page, "pages": pages, "has_next": page < pages, "results": results}


class ApiCallTest(SimpleTestCase):
    def test_is_enabled(self):
        self.assertTrue(ApiCall(path="/api/x/", filename="x").is_enabled({}))
        flagged = ApiCall(path="/api/x/", filename="x", required_feature_flag="ENTITY")
        self.assertTrue(flagged.is_enabled({"ENTITY"}))
        self.assertFalse(flagged.is_enabled({"PLANNING"}))

    def test_filenames_are_unique(self):
        filenames = [call.filename for call in API_CALLS]
        self.assertEqual(len(filenames), len(set(filenames)))


class FetchPagesTest(SimpleTestCase):
    def test_not_paginated(self):
        client = FakeClient({"/api/x/": [{"id": 1}]})
        call = ApiCall(path="/api/x/", filename="x", default_params={"a": "1"})

        pages = list(call.fetch_pages(client, "app"))

        self.assertEqual(pages, [Page(filename="x.json", payload=[{"id": 1}])])
        self.assertEqual(client.requests, [("/api/x/", {"a": "1", "app_id": "app"})])

    def test_paginated(self):
        client = FakeClient({"/api/x/": [_page(1, 2, [1]), _page(2, 2, [2])]})
        call = ApiCall(path="/api/x/", filename="x", pagination=Pagination.PAGE, page_size=10)

        pages = list(call.fetch_pages(client, "app"))

        self.assertEqual(
            [(p.filename, p.number, p.total_pages) for p in pages], [("x-1.json", 1, 2), ("x-2.json", 2, 2)]
        )
        self.assertEqual(
            client.requests,
            [
                ("/api/x/", {"app_id": "app", "page": 1, "limit": 10}),
                ("/api/x/", {"app_id": "app", "page": 2, "limit": 10}),
            ],
        )

    def test_paginated_endpoint_returning_a_list(self):
        client = FakeClient({"/api/x/": [[1, 2]]})
        call = ApiCall(path="/api/x/", filename="x", pagination=Pagination.PAGE)

        pages = list(call.fetch_pages(client, "app"))

        self.assertEqual([(p.filename, p.payload, p.total_pages) for p in pages], [("x-1.json", [1, 2], 1)])

    def test_cursor_pagination(self):
        client = FakeClient(
            {
                "/api/x/": [
                    {**_page(1, 3, [1]), "count": 3, "next_cursor": "c1"},
                    {**_page(2, 3, [2]), "count": None, "pages": None, "next_cursor": "c2"},
                    {**_page(3, 3, [3]), "count": None, "pages": None, "next_cursor": None},
                ]
            }
        )
        call = ApiCall(path="/api/x/", filename="x", pagination=Pagination.CURSOR, page_size=1)

        pages = list(call.fetch_pages(client, "app"))

        # The server echoes the page numbers that are sent.
        self.assertEqual(
            client.requests,
            [
                ("/api/x/", {"app_id": "app", "page": 1, "limit": 1}),
                ("/api/x/", {"app_id": "app", "page": 2, "limit": 1, "cursor": "c1"}),
                ("/api/x/", {"app_id": "app", "page": 3, "limit": 1, "cursor": "c2"}),
            ],
        )
        self.assertEqual(
            [p.payload for p in pages],
            [
                {"page": 1, "pages": 3, "count": 3, "has_next": True, "results": [1], "next_cursor": "c1"},
                {"page": 2, "pages": 3, "count": 3, "has_next": True, "results": [2], "next_cursor": "c2"},
                {"page": 3, "pages": 3, "count": 3, "has_next": False, "results": [3], "next_cursor": None},
            ],
        )
        self.assertEqual([p.total_pages for p in pages], [3, 3, 3])
