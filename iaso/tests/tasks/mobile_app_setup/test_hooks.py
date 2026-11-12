from unittest import mock

from django.test import SimpleTestCase

from iaso.tasks.mobile_app_setup.hooks import make_payload_transformers, register_payload_transformer_factory


class PayloadTransformersTest(SimpleTestCase):
    def setUp(self):
        self.factories = []
        patcher = mock.patch("iaso.tasks.mobile_app_setup.hooks.payload_transformer_factories", self.factories)
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_register_payload_transformer_factory_once(self):
        def make_transformer(project, options):
            return None

        register_payload_transformer_factory(make_transformer)
        register_payload_transformer_factory(make_transformer)

        self.assertEqual(self.factories, [make_transformer])

    def test_factories_are_called_with_the_project_and_options(self):
        project = mock.sentinel.project
        calls = []

        def transform(filename, payload):
            pass

        def make_transformer(project, options):
            calls.append((project, options))
            return transform

        register_payload_transformer_factory(make_transformer)

        self.assertEqual(make_payload_transformers(project, {"a": 1}), [transform])
        self.assertEqual(calls, [(project, {"a": 1})])

    def test_factories_returning_none_are_skipped(self):
        def transform(filename, payload):
            pass

        register_payload_transformer_factory(lambda project, options: None)
        register_payload_transformer_factory(lambda project, options: transform)

        self.assertEqual(make_payload_transformers(mock.sentinel.project, {}), [transform])
