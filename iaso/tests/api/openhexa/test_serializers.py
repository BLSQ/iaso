import uuid

from django.test import TestCase

from iaso.api.openhexa.serializers import (
    PipelineDetailSerializer,
    PipelineLaunchSerializer,
    PipelineListSerializer,
    PipelineParametersSerializer,
)


class PipelineListSerializerTestCase(TestCase):
    """Test PipelineListSerializer."""

    def test_valid_data(self):
        """Test serializer with valid pipeline list data."""
        data = {
            "id": "60fcb048-a5f6-4a79-9529-1ccfa55e75d1",
            "name": "test_pipeline",
            "currentVersion": {"versionNumber": 1},
        }
        serializer = PipelineListSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["id"], data["id"])
        self.assertEqual(serializer.validated_data["name"], data["name"])
        self.assertEqual(serializer.validated_data["currentVersion"], data["currentVersion"])

    def test_missing_required_fields(self):
        """Test serializer with missing required fields."""
        data = {"id": "60fcb048-a5f6-4a79-9529-1ccfa55e75d1"}
        serializer = PipelineListSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("name", serializer.errors)
        self.assertIn("currentVersion", serializer.errors)


class PipelineDetailSerializerTestCase(TestCase):
    """Test PipelineDetailSerializer."""

    def test_valid_data(self):
        """Test serializer with valid pipeline detail data."""
        data = {
            "id": "60fcb048-a5f6-4a79-9529-1ccfa55e75d1",
            "name": "test_pipeline",
            "currentVersion": {
                "versionNumber": 1,
                "id": str(uuid.uuid4()),
                "parameters": [
                    {
                        "type": "str",
                        "name": "country_name",
                        "code": "country_name",
                        "default": "Burkina Faso",
                        "choices": None,
                        "required": True,
                        "multiple": False,
                    }
                ],
            },
        }
        serializer = PipelineDetailSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["id"], data["id"])
        self.assertEqual(serializer.validated_data["name"], data["name"])
        self.assertEqual(serializer.validated_data["currentVersion"], data["currentVersion"])


class PipelineParametersSerializerTestCase(TestCase):
    """Test PipelineParametersSerializer."""

    def test_valid_uuid(self):
        """Test serializer with valid UUID."""
        data = {"pipeline_id": "60fcb048-a5f6-4a79-9529-1ccfa55e75d1"}
        serializer = PipelineParametersSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["pipeline_id"], data["pipeline_id"])

    def test_empty_pipeline_id(self):
        """Test serializer with empty pipeline_id."""
        data = {"pipeline_id": ""}
        serializer = PipelineParametersSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("pipeline_id", serializer.errors)
        # Django's field validation runs first and returns the default message
        self.assertIn("This field may not be blank", str(serializer.errors["pipeline_id"]))

    def test_whitespace_only_pipeline_id(self):
        """Test serializer with whitespace-only pipeline_id."""
        data = {"pipeline_id": "   "}
        serializer = PipelineParametersSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("pipeline_id", serializer.errors)

    def test_invalid_uuid_format(self):
        """Test serializer with invalid UUID format."""
        data = {"pipeline_id": "not-a-uuid"}
        serializer = PipelineParametersSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("pipeline_id", serializer.errors)
        self.assertIn("Pipeline ID must be a valid UUID format", str(serializer.errors["pipeline_id"]))

    def test_uuid_with_whitespace(self):
        """Test serializer with UUID that has whitespace (should be trimmed)."""
        data = {"pipeline_id": "  60fcb048-a5f6-4a79-9529-1ccfa55e75d1  "}
        serializer = PipelineParametersSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["pipeline_id"], "60fcb048-a5f6-4a79-9529-1ccfa55e75d1")

    def test_case_insensitive_uuid(self):
        """Test serializer with uppercase UUID (should be valid)."""
        data = {"pipeline_id": "60FCB048-A5F6-4A79-9529-1CCFA55E75D1"}
        serializer = PipelineParametersSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["pipeline_id"], data["pipeline_id"])


class PipelineLaunchSerializerTestCase(TestCase):
    """Test PipelineLaunchSerializer."""

    def test_valid_data(self):
        """Test serializer with valid launch data."""
        version_uuid = str(uuid.uuid4())
        data = {
            "version": version_uuid,
            "config": {"country_name": "Burkina Faso", "use_demo_data": True},
        }
        serializer = PipelineLaunchSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(str(serializer.validated_data["version"]), version_uuid)
        self.assertEqual(serializer.validated_data["config"], data["config"])

    def test_missing_version(self):
        """Test serializer with missing version."""
        data = {"config": {"country_name": "Burkina Faso"}}
        serializer = PipelineLaunchSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("version", serializer.errors)

    def test_missing_config(self):
        """Test serializer with missing config."""
        data = {"version": str(uuid.uuid4())}
        serializer = PipelineLaunchSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("config", serializer.errors)

    def test_invalid_version_uuid(self):
        """Test serializer with invalid version UUID."""
        data = {
            "version": "not-a-uuid",
            "config": {"country_name": "Burkina Faso"},
        }
        serializer = PipelineLaunchSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("version", serializer.errors)

    def test_empty_config(self):
        """Test serializer with empty config."""
        data = {
            "version": str(uuid.uuid4()),
            "config": {},
        }
        serializer = PipelineLaunchSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["config"], {})

    def test_complex_config(self):
        """Test serializer with complex config data."""
        version_uuid = str(uuid.uuid4())
        config = {
            "country_name": "Burkina Faso",
            "use_demo_data": True,
            "max_records": 1000,
            "confidence_threshold": 0.85,
            "selected_regions": ["region1", "region2"],
            "settings": {"timeout": 300, "retries": 3},
        }
        data = {
            "version": version_uuid,
            "config": config,
        }
        serializer = PipelineLaunchSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["config"], config)
