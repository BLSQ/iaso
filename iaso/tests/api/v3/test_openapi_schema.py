"""OpenAPI schema coverage for every `/api/v3/` endpoint.

Generates the OpenAPI schema scoped to the v3 viewsets discovered by `_discover_viewsets()` (see
`test_filter_nomenclature.py` - same discovery, so both tests agree on what counts as "a v3 endpoint") and
asserts drf-spectacular didn't have to warn/error its way through, i.e. every action resolved to a concrete
response schema instead of falling back to a generic one. A new v3 endpoint is covered automatically, no
per-endpoint registration needed.

Scoped on purpose: generating the *full*, unscoped schema currently crashes on an unrelated pre-existing bug
(`iaso/api/completeness_stats.py` calling `AnonymousUser.iaso_profile`), so this can't piggyback on
`manage.py spectacular` for the whole project yet.

What this does NOT catch: a viewset can have `serializer_class` set to the *wrong* serializer (e.g. a
custom `@action` silently inheriting its viewset's serializer even though it returns a different shape) -
drf-spectacular only warns when it can't resolve a serializer at all, not when it resolves one that lies
about the response shape. That's still down to code review.
"""

from django.test import TestCase
from drf_spectacular.drainage import GENERATOR_STATS, reset_generator_stats
from drf_spectacular.generators import SchemaGenerator

from iaso.tests.api.v3.test_filter_nomenclature import _discover_viewsets


class _V3OnlySchemaGenerator(SchemaGenerator):
    def _get_paths_and_endpoints(self):
        v3_viewsets = set(_discover_viewsets())
        return [endpoint for endpoint in super()._get_paths_and_endpoints() if type(endpoint[3]) in v3_viewsets]


class V3SchemaDocumentationTestCase(TestCase):
    def test_v3_endpoints_generate_a_clean_openapi_schema(self):
        reset_generator_stats()
        schema = _V3OnlySchemaGenerator().get_schema(request=None, public=True)

        # guards against the scoping filter above silently matching nothing (e.g. a renamed viewset) and
        # the assertions below passing vacuously.
        self.assertTrue(schema.get("paths"), "no v3 endpoint was matched by the schema generator")

        self.assertFalse(
            dict(GENERATOR_STATS._warn_cache),
            "drf-spectacular couldn't fully document a v3 endpoint, see warning(s) above",
        )
        self.assertFalse(
            dict(GENERATOR_STATS._error_cache),
            "drf-spectacular hit an error documenting a v3 endpoint, see error(s) above",
        )
