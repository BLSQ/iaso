from unittest import mock

from django.conf import settings
from django.test import override_settings

from iaso import models as m
from iaso.middlewares.perf_stats import UNMATCHED_ROUTE, normalize_route, request_variant
from iaso.perf_stats.collector import Collector
from iaso.test import APITestCase


MIDDLEWARE_PATH = "iaso.middlewares.perf_stats.PerfStatsMiddleware"


@override_settings(
    PERF_STATS_ENABLED=True,
    MIDDLEWARE=[MIDDLEWARE_PATH] + [path for path in settings.MIDDLEWARE if path != MIDDLEWARE_PATH],
)
class PerfStatsMiddlewareTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Account")
        cls.project = m.Project.objects.create(name="Project", app_id="org.test.app", account=cls.account)
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

    def setUp(self):
        self.collector = Collector()
        patcher = mock.patch("iaso.middlewares.perf_stats.collector", self.collector)
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_records_route_pattern_status_and_account_of_drf_authenticated_user(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/projects/{self.project.id}/")
        self.assertEqual(response.status_code, 200)
        self.client.get("/api/projects/999999/")
        self.collector.flush()

        stats = {stat.outcome: stat for stat in m.PerfStat.objects.all()}
        self.assertEqual(set(stats), {"200", "404"})
        self.assertEqual(stats["200"].kind, m.PerfStat.Kind.HTTP)
        self.assertEqual(stats["200"].name, "GET api/projects/<pk>/")
        self.assertEqual(stats["200"].account_id, self.account.id)
        self.assertIsNone(stats["200"].project_id)
        self.assertEqual(stats["200"].count, 1)
        self.assertEqual(stats["200"].errors, 0)
        self.assertGreater(stats["200"].sum_ms, 0)
        self.assertGreater(stats["200"].sum_db_queries, 0)

    def test_app_id_resolves_project(self):
        self.client.get("/api/projects/", {"app_id": "org.test.app"})
        self.collector.flush()

        stat = m.PerfStat.objects.get()
        self.assertEqual(stat.project_id, self.project.id)
        self.assertEqual(stat.account_id, self.account.id)

    def test_allow_listed_params_are_recorded_as_variant(self):
        self.client.force_authenticate(self.user)
        self.client.get("/api/projects/", {"order": "name"})
        self.client.get("/api/projects/", {"xlsx": "true", "order": "name"})
        self.collector.flush()

        self.assertEqual(dict(m.PerfStat.objects.values_list("variant", "count")), {"": 1, "xlsx": 1})

    def test_request_variant(self):
        params = ["csv", "xlsx", "format"]
        self.assertEqual(request_variant({}, params), "")
        self.assertEqual(request_variant({"order": "name", "limit": "20"}, params), "")
        self.assertEqual(request_variant({"xlsx": "true"}, params), "xlsx")
        self.assertEqual(request_variant({"xlsx": ""}, params), "")
        self.assertEqual(request_variant({"csv": "false"}, params), "csv=false")
        self.assertEqual(request_variant({"format": "CSV"}, params), "format=csv")
        self.assertEqual(request_variant({"format": "../etc/<script>"}, params), "format=?")
        # Always in allow-list order, whatever the order in the URL.
        self.assertEqual(request_variant({"format": "json", "csv": "1"}, params), "csv&format=json")

    def test_excluded_paths_and_options_are_not_recorded(self):
        self.client.get("/_health/")
        self.client.options("/api/projects/")
        self.collector.flush()

        self.assertFalse(m.PerfStat.objects.exists())
        # Tasks delivered by SQS over HTTP are recorded as tasks instead
        self.assertIn("/tasks/task/", settings.PERF_STATS_EXCLUDED_PATH_PREFIXES)

    def test_unmatched_urls_share_one_route(self):
        self.client.get("/api/this-does-not-exist-1/")
        self.client.get("/api/this-does-not-exist-2/")
        self.collector.flush()

        stat = m.PerfStat.objects.get()
        self.assertEqual(stat.name, f"GET {UNMATCHED_ROUTE}")
        self.assertEqual(stat.count, 2)

    def test_normalize_route(self):
        self.assertEqual(normalize_route("^api/forms/(?P<pk>[^/.]+)/$"), "api/forms/<pk>/")
        self.assertEqual(
            normalize_route("^api/forms/(?P<pk>[^/.]+)/manifest\\.(?P<format>[a-z0-9]+)/?$"),
            "api/forms/<pk>/manifest\\.<format>/?",
        )
        self.assertEqual(normalize_route("api/v3/orgunits/<int:pk>/"), "api/v3/orgunits/<int:pk>/")
