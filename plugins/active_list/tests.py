import logging
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings

from iaso.models import Account, DataSource, Form, OrgUnit, OrgUnitType, Profile, Project, SourceVersion

from .views import handle_upload


User = get_user_model()

# Capture logging to detect the XLSForm parsing error
logger = logging.getLogger("django_xlsform_validator")


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class ActiveListUploadTestCase(TestCase):
    """Test case to verify XLSForm validation works correctly without 'File is not a zip file' errors"""

    @classmethod
    def setUpTestData(cls):
        # Create account and basic setup
        cls.account = Account.objects.create(name="Test Health System")

        # Create data source and version
        cls.data_source = DataSource.objects.create(name="Test Data Source")
        cls.source_version = SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account.default_version = cls.source_version
        cls.account.save()

        # Create user with profile
        cls.user = User.objects.create_user(username="test_user", password="testpass123")
        p = Profile(user=cls.user, account=cls.account)
        p.save()

        # Create org unit types (hierarchy: Region -> District -> Health Facility)
        cls.region_type = OrgUnitType.objects.create(name="Region", short_name="REG")
        cls.district_type = OrgUnitType.objects.create(name="District", short_name="DIST")
        cls.hf_type = OrgUnitType.objects.create(name="Health Facility", short_name="HF")

        # Create org unit hierarchy
        cls.region = OrgUnit.objects.create(
            name="Test Region", org_unit_type=cls.region_type, version=cls.source_version
        )

        cls.district = OrgUnit.objects.create(
            name="Test District", org_unit_type=cls.district_type, parent=cls.region, version=cls.source_version
        )

        cls.health_facility = OrgUnit.objects.create(
            name="Test Health Facility", org_unit_type=cls.hf_type, parent=cls.district, version=cls.source_version
        )

        cls.project = Project.objects.create(
            name="Active List Test Project", app_id="active.list.test", account=cls.account
        )
        cls.project.unit_types.add(cls.hf_type)

        # Create or get the validation form with actual Excel file
        cls.validation_form, created = Form.objects.get_or_create(
            form_id="file_active_excel_validation",
            defaults={"name": "Active List Validation Form", "period_type": "MONTH", "single_per_period": False},
        )
        cls.validation_form.org_unit_types.add(cls.hf_type)
        cls.project.forms.add(cls.validation_form)

        # Delete any existing corrupted form versions
        cls.validation_form.form_versions.all().delete()

        # Load the validation Excel file and store content for reuse
        with open("plugins/active_list/data/file_active_import_checker.xlsx", "rb") as xls_file:
            cls.validation_file_content = xls_file.read()

        # Create FormVersion with a fresh file object
        cls.validation_form_version = cls.validation_form.form_versions.create(
            xls_file=SimpleUploadedFile(
                "file_active_import_checker.xlsx",
                cls.validation_file_content,
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ),
            version_id="test_1.0",
        )

    def setUp(self):
        """Set up logging capture for each test"""
        self.log_capture = []
        self.log_handler = LogCapture(self.log_capture)
        logger.addHandler(self.log_handler)
        logger.setLevel(logging.DEBUG)

    def tearDown(self):
        """Clean up logging capture"""
        logger.removeHandler(self.log_handler)

    def test_upload_file_without_zip_error(self):
        """Test that uploading a valid Excel file doesn't produce 'File is not a zip file' error"""

        # Load the test import file
        with open("plugins/active_list/data/testimport.xlsx", "rb") as test_file:
            file_content = test_file.read()

        # Create a fresh file object that won't be affected by pyxform's file handling
        uploaded_file = SimpleUploadedFile(
            "testimport.xlsx",
            file_content,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

        # Attempt the upload
        result, annotated_file = handle_upload(
            file_name="testimport.xlsx",
            file=uploaded_file,
            org_unit_id=self.health_facility.id,
            month="2024-06",
            bypass=False,
            user=self.user,
        )

        # Check that no "File is not a zip file" error occurred in logs
        error_messages = [log_entry for log_entry in self.log_capture if "File is not a zip file" in log_entry]
        self.assertEqual(len(error_messages), 0, f"Found 'File is not a zip file' errors in logs: {error_messages}")

        # Check that no "Error parsing XLSForm with pyxform" occurred in logs
        xlsform_errors = [
            log_entry for log_entry in self.log_capture if "Error parsing XLSForm with pyxform" in log_entry
        ]
        self.assertEqual(len(xlsform_errors), 0, f"Found XLSForm parsing errors in logs: {xlsform_errors}")

        # The result should be either OK or FILE_DATA_PROBLEM (if validation fails)
        # but NOT an XLSForm parsing error
        self.assertIn(
            result,
            ["OK", "FILE_DATA_PROBLEM", "ERROR_FILE_ALREADY_UPLOADED", "ERROR_PERIOD_ALREADY_UPLOADED"],
            f"Unexpected result: {result}",
        )

        print(f"Upload result: {result}")
        if self.log_capture:
            print("Captured logs:")
            for log_entry in self.log_capture:
                print(f"  {log_entry}")

    def test_form_version_exists_and_readable(self):
        """Test that the validation form version exists and is readable"""

        # Verify the form version exists
        self.assertIsNotNone(self.validation_form_version)
        self.assertIsNotNone(self.validation_form_version.xls_file)

        # Use the stored file content to check validity
        content = self.validation_file_content
        self.assertGreater(len(content), 0, "XLS file should not be empty")

        # Check that the file starts with ZIP signature (Excel files are ZIP archives)
        first_bytes = content[:4]

        self.assertEqual(
            first_bytes[:2], b"PK", f"Excel file should start with ZIP signature 'PK', but got: {first_bytes.hex()}"
        )

    def test_direct_xlsform_validation(self):
        """Test XLSForm validation directly without upload logic"""
        from django_xlsform_validator.validation import XLSFormValidator

        # Test the form version file directly
        validator = XLSFormValidator()

        # Create a fresh file object for validation to avoid closed file issues
        validation_file = SimpleUploadedFile(
            "file_active_import_checker.xlsx",
            self.validation_file_content,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

        try:
            validator.parse_xlsform(validation_file)
            print("✓ XLSForm validation successful")
        except Exception as e:
            self.fail(f"XLSForm validation failed: {e}")

    def test_multiple_uploads_same_file(self):
        """Test uploading the same file multiple times to check file pointer handling"""

        with open("plugins/active_list/data/testimport.xlsx", "rb") as test_file:
            file_content = test_file.read()

        # Upload the same file twice
        for i in range(2):
            uploaded_file = SimpleUploadedFile(
                f"testimport_{i}.xlsx",
                file_content,
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )

            result, annotated_file = handle_upload(
                file_name=f"testimport_{i}.xlsx",
                file=uploaded_file,
                org_unit_id=self.health_facility.id,
                month=f"2024-0{i + 6}",  # Different months to avoid period collision
                bypass=False,
                user=self.user,
            )

            # Check for XLSForm errors each time
            xlsform_errors = [
                log_entry for log_entry in self.log_capture if "Error parsing XLSForm with pyxform" in log_entry
            ]
            self.assertEqual(len(xlsform_errors), 0, f"Found XLSForm parsing errors on upload {i}: {xlsform_errors}")


class LogCapture(logging.Handler):
    """Custom logging handler to capture log messages for testing"""

    def __init__(self, log_list):
        super().__init__()
        self.log_list = log_list

    def emit(self, record):
        self.log_list.append(self.format(record))
