from iaso.test import APITestCase
from plugins.polio.api.rounds.round import RoundSerializer
from plugins.polio.tests.api.test import PolioTestCaseMixin


class _DummyRequest:
    def __init__(self, data):
        self.data = data


class RoundSerializerValidationsTestCase(APITestCase, PolioTestCaseMixin):
    @classmethod
    def setUpTestData(cls):
        cls.account, cls.datasource, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            "Default source", "Default account", "Default project"
        )

    def _make_serializer(self, payload, request_is_planned=None):
        # Always provide a request context because current validators access request unguarded
        context = {"request": _DummyRequest({"is_planned": request_is_planned})}
        return RoundSerializer(data=payload, context=context)

    def test_planned_campaign_requires_population_fields_via_request_flag(self):
        serializer = self._make_serializer(
            payload={
                # Round-level is_planned not set; campaign is planned via request
                "target_population": None,
                "percentage_covered_target_population": None,
            },
            request_is_planned=True,
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("target_population", serializer.errors)
        self.assertIn("percentage_covered_target_population", serializer.errors)

    def test_planned_round_requires_population_fields_via_round_flag(self):
        serializer = self._make_serializer(
            payload={
                "is_planned": True,
                "target_population": None,
                "percentage_covered_target_population": None,
            }
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("target_population", serializer.errors)
        self.assertIn("percentage_covered_target_population", serializer.errors)

    def test_unplanned_allows_missing_population_fields(self):
        serializer = self._make_serializer(
            payload={
                "is_planned": False,
                "target_population": None,
                "percentage_covered_target_population": None,
            },
            request_is_planned=False,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_zero_values_allowed_for_planned(self):
        # Zero values are not allowed
        serializer = self._make_serializer(
            payload={
                "is_planned": True,
                "target_population": 0,
                "percentage_covered_target_population": 0,
            }
        )
        self.assertFalse(serializer.is_valid(), serializer.errors)

    def test_validation_error_format(self):
        # Test that validation errors are properly formatted as field-specific errors
        serializer = self._make_serializer(
            payload={
                "is_planned": True,
                "target_population": None,
                "percentage_covered_target_population": None,
            }
        )
        self.assertFalse(serializer.is_valid())

        # Check that errors are field-specific
        self.assertIn("target_population", serializer.errors)
        self.assertIn("percentage_covered_target_population", serializer.errors)

        # Check error messages
        self.assertIn("Target population must be defined", str(serializer.errors["target_population"]))
        self.assertIn(
            "Percentage covered must be defined", str(serializer.errors["percentage_covered_target_population"])
        )

    def test_single_field_missing_error(self):
        # Test that only missing fields are included in errors
        serializer = self._make_serializer(
            payload={
                "is_planned": True,
                "target_population": 1000,  # Provided
                "percentage_covered_target_population": None,  # Missing
            }
        )
        self.assertFalse(serializer.is_valid())

        # Only the missing field should have an error
        self.assertNotIn("target_population", serializer.errors)
        self.assertIn("percentage_covered_target_population", serializer.errors)

        # Check that only one field has an error
        self.assertEqual(len(serializer.errors), 1)

    def test_both_fields_missing_error(self):
        # Test that both fields are included when both are missing
        serializer = self._make_serializer(
            payload={
                "is_planned": True,
                "target_population": None,  # Missing
                "percentage_covered_target_population": None,  # Missing
            }
        )
        self.assertFalse(serializer.is_valid())

        # Both fields should have errors
        self.assertIn("target_population", serializer.errors)
        self.assertIn("percentage_covered_target_population", serializer.errors)

        # Check that both fields have errors
        self.assertEqual(len(serializer.errors), 2)
