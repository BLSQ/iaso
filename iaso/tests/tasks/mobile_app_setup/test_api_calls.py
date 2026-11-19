from django.test import SimpleTestCase

from iaso.tasks.mobile_app_setup.api_calls import API_CALLS, ApiCall, Page
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
        call = ApiCall(path="/api/x/", filename="x", paginated=True, page_size=10)

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
        call = ApiCall(path="/api/x/", filename="x", paginated=True)

        pages = list(call.fetch_pages(client, "app"))

        self.assertEqual([(p.filename, p.payload, p.total_pages) for p in pages], [("x-1.json", [1, 2], 1)])
