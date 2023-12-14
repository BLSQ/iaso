from plugins.polio.api.common import find_orgunit_in_cache, get_url_content, make_orgunits_cache

from django.test import TestCase  # type: ignore
import responses  # type: ignore


class ApiCommonTestCase(TestCase):
    def mock_2_pages(self, suffix):
        responses.add(
            responses.GET,
            f"https://demo.com/api/form/4564/data.json{suffix}page=1&page_size=10000",
            json=[{"id": 1}],
            status=200,
        )

        responses.add(
            responses.GET,
            f"https://demo.com/api/form/4564/data.json{suffix}page=2&page_size=10000",
            json=[{"id": 2}],
            status=200,
        )

        responses.add(
            responses.GET,
            f"https://demo.com/api/form/4564/data.json{suffix}page=3&page_size=10000",
            status=404,
        )

    @responses.activate
    def test_get_url_content_without_params(self):
        self.mock_2_pages("?")

        content = get_url_content(
            "https://demo.com/api/form/4564/data.json", "myuser", "mypassword", 50000, prefer_cache=False
        )
        self.assertEqual(content, [{"id": 1}, {"id": 2}])

    @responses.activate
    def test_get_url_content_with_params(self):
        self.mock_2_pages("?created__lt=20231212&")

        content = get_url_content(
            "https://demo.com/api/form/4564/data.json?created__lt=20231212",
            "myuser",
            "mypassword",
            50000,
            prefer_cache=False,
        )
        self.assertEqual(content, [{"id": 1}, {"id": 2}])
