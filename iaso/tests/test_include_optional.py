from unittest import mock

from django.template import Context, Template
from django.template.loader import render_to_string
from django.test import SimpleTestCase


class IncludeOptionalTests(SimpleTestCase):
    def test_missing_template_renders_empty(self):
        rendered = Template('{% load iaso_extras %}{% include_optional "does/not/exist.html" %}').render(Context({}))
        self.assertEqual(rendered, "")

    def test_embedded_pages_render_without_the_polio_snippet(self):
        # superset.html calls render_bundle, which reads webpack-stats.json.
        # Polio CI does not build the frontend, so skip the bundle lookup.
        context = {"title": "Report", "analytics_script": "", "config": {}, "src": "https://example.com"}
        with mock.patch("webpack_loader.utils.get_as_tags", return_value=""):
            for template_name in (
                "iaso/pages/powerbi.html",
                "iaso/pages/superset.html",
                "iaso/pages/iframe.html",
            ):
                rendered = render_to_string(template_name, context)
                self.assertIn(context["title"], rendered)
