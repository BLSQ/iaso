import logging
import tempfile

from io import BytesIO

import pandas as pd

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings

from iaso.models import Account, DataSource, Form, OrgUnit, OrgUnitType, Profile, Project, SourceVersion

from .views import ERROR_WRONG_CODE, ERROR_WRONG_PERIOD, handle_upload, import_data


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


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class CodeETSValidationTestCase(TestCase):
    """Test case to verify CODE ETS validation against org unit aliases"""

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

        # Create org unit type
        cls.hf_type = OrgUnitType.objects.create(name="Health Facility", short_name="HF")

        # Create org units with different alias configurations
        cls.org_unit_with_aliases = OrgUnit.objects.create(
            name="Hospital with Aliases",
            org_unit_type=cls.hf_type,
            version=cls.source_version,
            aliases=["CODE001", "CODE002", "HOSP_A"],
        )

        cls.org_unit_no_aliases = OrgUnit.objects.create(
            name="Hospital without Aliases", org_unit_type=cls.hf_type, version=cls.source_version, aliases=None
        )

        cls.org_unit_empty_aliases = OrgUnit.objects.create(
            name="Hospital with Empty Aliases", org_unit_type=cls.hf_type, version=cls.source_version, aliases=[]
        )

        cls.project = Project.objects.create(
            name="Active List Test Project", app_id="active.list.test", account=cls.account
        )
        cls.project.unit_types.add(cls.hf_type)

    def create_test_excel_file(self, code_ets_value, period="Jun-24"):
        """Helper method to create a test Excel file with specific CODE ETS value and period"""
        # Create test data
        data = {
            "N°": [1],
            "CODE ETS": [code_ets_value],
            "SITES": ["Test Hospital"],
            "Periode": [period],
            "CODE IDENTIFIANT": ["PAT001"],
            "SEXE": ["M"],
            "AGE": [30],
            "POIDS": [70],
            "Nouvelle inclusion": [0],
            "Transfert-In": [0],
            "Retour dans les soins": [0],
            "TB / VIH": [0],
            "Type de VIH": [1],
            "Ligne thérapeutique": [1],
            "Date de la dernière dispensation": ["2024-06-15"],
            "Nombre de jours dispensés": [30],
            "STABLE": ["Oui"],
            "Transfert Out": [0],
            "Décès": [0],
            "Arrêt TARV": [0],
            "Servi ailleurs": [0],
            "REGION": ["Test Region"],
            "DISTRICT": ["Test District"],
            "REGIME": ["TDF/3TC/DTG"],
        }

        df = pd.DataFrame(data)

        # Save to BytesIO to simulate Excel file
        excel_buffer = BytesIO()
        df.to_excel(excel_buffer, index=False)
        excel_buffer.seek(0)
        return excel_buffer.getvalue()

    def create_mock_import(self, org_unit, month="2024-06"):
        """Helper method to create a mock Import object"""
        from .models import SOURCE_EXCEL, Import

        return Import(
            hash_key="test_hash",
            file_name="test.xlsx",
            org_unit=org_unit,
            month=month,
            file_check="OK",
            source=SOURCE_EXCEL,
            user=self.user,
        )

    def test_code_ets_validation_success(self):
        """Test that validation passes when CODE ETS matches org unit aliases"""
        # Create Excel file with CODE ETS that matches org unit aliases
        excel_content = self.create_test_excel_file("CODE001")

        # Create mock import
        mock_import = self.create_mock_import(self.org_unit_with_aliases)

        # Test import_data function directly
        result = import_data(BytesIO(excel_content), mock_import)

        # Should not return an error (function returns None on success)
        self.assertIsNone(result, "CODE ETS validation should pass when code matches aliases")

    def test_code_ets_validation_failure(self):
        """Test that validation fails when CODE ETS doesn't match org unit aliases"""
        # Create Excel file with CODE ETS that doesn't match org unit aliases
        excel_content = self.create_test_excel_file("INVALID_CODE")

        # Create mock import
        mock_import = self.create_mock_import(self.org_unit_with_aliases)

        # Test import_data function directly
        result = import_data(BytesIO(excel_content), mock_import)

        # Should return detailed error information
        self.assertIsInstance(result, dict, "Should return error details as dictionary")
        self.assertEqual(result["error"], ERROR_WRONG_CODE, "Should return ERROR_WRONG_CODE")
        self.assertIn("INVALID_CODE", result["invalid_codes"], "Should include the invalid code")
        self.assertEqual(
            result["available_aliases"], ["CODE001", "CODE002", "HOSP_A"], "Should include available aliases"
        )
        self.assertEqual(result["org_unit_name"], "Hospital with Aliases", "Should include org unit name")

    def test_code_ets_validation_no_aliases(self):
        """Test that validation fails when org unit has no aliases"""
        # Create Excel file with any CODE ETS
        excel_content = self.create_test_excel_file("ANY_CODE")

        # Create mock import with org unit that has no aliases
        mock_import = self.create_mock_import(self.org_unit_no_aliases)

        # Test import_data function directly
        result = import_data(BytesIO(excel_content), mock_import)

        # Should return error since no aliases are defined
        self.assertIsInstance(result, dict, "Should return error details as dictionary")
        self.assertEqual(result["error"], ERROR_WRONG_CODE, "Should return ERROR_WRONG_CODE")
        self.assertEqual(result["available_aliases"], [], "Should show empty aliases list")

    def test_code_ets_validation_empty_aliases(self):
        """Test that validation fails when org unit has empty aliases list"""
        # Create Excel file with any CODE ETS
        excel_content = self.create_test_excel_file("ANY_CODE")

        # Create mock import with org unit that has empty aliases
        mock_import = self.create_mock_import(self.org_unit_empty_aliases)

        # Test import_data function directly
        result = import_data(BytesIO(excel_content), mock_import)

        # Should return error since aliases list is empty
        self.assertIsInstance(result, dict, "Should return error details as dictionary")
        self.assertEqual(result["error"], ERROR_WRONG_CODE, "Should return ERROR_WRONG_CODE")
        self.assertEqual(result["available_aliases"], [], "Should show empty aliases list")

    def test_handle_upload_with_code_ets_validation_failure(self):
        """Test that handle_upload properly handles CODE ETS validation failure"""
        # Create Excel file with invalid CODE ETS
        excel_content = self.create_test_excel_file("INVALID_CODE")

        # Create uploaded file
        uploaded_file = SimpleUploadedFile(
            "test_upload.xlsx",
            excel_content,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

        # Mock the form validation to pass
        from .views import RESPONSES

        original_responses = RESPONSES.copy()

        try:
            # Attempt upload (this will fail during XLS validation, but we'll bypass that)
            result, annotated_file = handle_upload(
                file_name="test_upload.xlsx",
                file=uploaded_file,
                org_unit_id=self.org_unit_with_aliases.id,
                month="2024-06",
                bypass=True,  # Bypass file validation to test CODE ETS validation
                user=self.user,
            )

            # Should return ERROR_WRONG_CODE
            self.assertEqual(result, ERROR_WRONG_CODE, "Should return ERROR_WRONG_CODE for invalid CODE ETS")

            # Check that error message was updated with specific details
            error_message = RESPONSES[ERROR_WRONG_CODE]["message"]
            self.assertIn("INVALID_CODE", error_message, "Error message should include invalid code")
            self.assertIn("Hospital with Aliases", error_message, "Error message should include org unit name")
            self.assertIn("CODE001, CODE002, HOSP_A", error_message, "Error message should include available aliases")

        finally:
            # Restore original responses
            RESPONSES.clear()
            RESPONSES.update(original_responses)

    def test_code_ets_case_sensitivity(self):
        """Test that CODE ETS validation is case sensitive"""
        # Create Excel file with lowercase version of a valid alias
        excel_content = self.create_test_excel_file("code001")  # lowercase

        # Create mock import
        mock_import = self.create_mock_import(self.org_unit_with_aliases)

        # Test import_data function directly
        result = import_data(BytesIO(excel_content), mock_import)

        # Should return error since case doesn't match
        self.assertIsInstance(result, dict, "Should return error for case mismatch")
        self.assertEqual(result["error"], ERROR_WRONG_CODE, "Should return ERROR_WRONG_CODE for case mismatch")

    def test_period_validation_success(self):
        """Test that validation passes when period in file matches selected period"""
        # Create Excel file with matching period (Jun-24 corresponds to 2024-06)
        excel_content = self.create_test_excel_file("CODE001", period="Jun-24")

        # Create mock import with corresponding YYYY-MM period
        mock_import = self.create_mock_import(self.org_unit_with_aliases, month="2024-06")

        # Test import_data function directly
        result = import_data(BytesIO(excel_content), mock_import)

        # Should not return an error (function returns None on success)
        self.assertIsNone(result, "Period validation should pass when periods match")

    def test_period_validation_failure(self):
        """Test that validation fails when period in file doesn't match selected period"""
        # Create Excel file with different period (May-24 instead of Jun-24)
        excel_content = self.create_test_excel_file("CODE001", period="May-24")

        # Create mock import with different period (2024-06 = Jun-24)
        mock_import = self.create_mock_import(self.org_unit_with_aliases, month="2024-06")

        # Test import_data function directly
        result = import_data(BytesIO(excel_content), mock_import)

        # Should return detailed error information
        self.assertIsInstance(result, dict, "Should return error details as dictionary")
        self.assertEqual(result["error"], ERROR_WRONG_PERIOD, "Should return ERROR_WRONG_PERIOD")
        self.assertIn("May-24", result["file_periods"], "Should include the file period")
        self.assertEqual(result["selected_period_yyyymm"], "2024-06", "Should include selected period in YYYY-MM")
        self.assertEqual(result["expected_file_period"], "Jun-24", "Should include expected file period")
        self.assertEqual(result["org_unit_name"], "Hospital with Aliases", "Should include org unit name")

    def test_period_validation_multiple_periods_in_file(self):
        """Test that validation fails when file contains multiple different periods"""
        # Create test data with multiple periods
        data = {
            "N°": [1, 2],
            "CODE ETS": ["CODE001", "CODE001"],
            "SITES": ["Test Hospital", "Test Hospital"],
            "Periode": ["May-24", "Jul-24"],  # Different periods
            "CODE IDENTIFIANT": ["PAT001", "PAT002"],
            "SEXE": ["M", "F"],
            "AGE": [30, 25],
            "POIDS": [70, 60],
            "Nouvelle inclusion": [0, 0],
            "Transfert-In": [0, 0],
            "Retour dans les soins": [0, 0],
            "TB / VIH": [0, 0],
            "Type de VIH": [1, 1],
            "Ligne thérapeutique": [1, 1],
            "Date de la dernière dispensation": ["2024-06-15", "2024-06-16"],
            "Nombre de jours dispensés": [30, 30],
            "STABLE": ["Oui", "Oui"],
            "Transfert Out": [0, 0],
            "Décès": [0, 0],
            "Arrêt TARV": [0, 0],
            "Servi ailleurs": [0, 0],
            "REGION": ["Test Region", "Test Region"],
            "DISTRICT": ["Test District", "Test District"],
            "REGIME": ["TDF/3TC/DTG", "TDF/3TC/DTG"],
        }

        df = pd.DataFrame(data)
        excel_buffer = BytesIO()
        df.to_excel(excel_buffer, index=False)
        excel_buffer.seek(0)
        excel_content = excel_buffer.getvalue()

        # Create mock import
        mock_import = self.create_mock_import(self.org_unit_with_aliases, month="2024-06")

        # Test import_data function directly
        result = import_data(BytesIO(excel_content), mock_import)

        # Should return error since file contains periods that don't match
        self.assertIsInstance(result, dict, "Should return error details as dictionary")
        self.assertEqual(result["error"], ERROR_WRONG_PERIOD, "Should return ERROR_WRONG_PERIOD")
        self.assertEqual(len(result["file_periods"]), 2, "Should detect both periods in file")
        self.assertEqual(result["selected_period_yyyymm"], "2024-06", "Should include selected period")
        self.assertEqual(result["expected_file_period"], "Jun-24", "Should include expected file period")

    def test_period_validation_with_different_year_format(self):
        """Test period validation with different year formats (2-digit vs 4-digit)"""
        # Test that both "Jun-24" and "Jun-2024" work (though file format should be "Jun-24")
        # For now, let's test case sensitivity with correct format
        excel_content = self.create_test_excel_file("CODE001", period="jun-24")  # lowercase

        # Create mock import
        mock_import = self.create_mock_import(self.org_unit_with_aliases, month="2024-06")

        # Test import_data function directly
        result = import_data(BytesIO(excel_content), mock_import)

        # Should return error since case doesn't match (Jun-24 vs jun-24)
        self.assertIsInstance(result, dict, "Should return error for case mismatch in period")
        self.assertEqual(result["error"], ERROR_WRONG_PERIOD, "Should return ERROR_WRONG_PERIOD for case mismatch")

    def test_handle_upload_with_period_validation_failure(self):
        """Test that handle_upload properly handles period validation failure"""
        # Create Excel file with wrong period
        excel_content = self.create_test_excel_file("CODE001", period="May-24")

        # Create uploaded file
        uploaded_file = SimpleUploadedFile(
            "test_upload.xlsx",
            excel_content,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

        # Mock the form validation to pass
        from .views import RESPONSES

        original_responses = RESPONSES.copy()

        try:
            # Attempt upload (bypass file validation to test period validation)
            result, annotated_file = handle_upload(
                file_name="test_upload.xlsx",
                file=uploaded_file,
                org_unit_id=self.org_unit_with_aliases.id,
                month="2024-06",  # Corresponds to Jun-24, different from file period May-24
                bypass=True,  # Bypass file validation to test period validation
                user=self.user,
            )

            # Should return ERROR_WRONG_PERIOD
            self.assertEqual(result, ERROR_WRONG_PERIOD, "Should return ERROR_WRONG_PERIOD for invalid period")

            # Check that error message was updated with specific details
            error_message = RESPONSES[ERROR_WRONG_PERIOD]["message"]
            self.assertIn("May-24", error_message, "Error message should include file period")
            self.assertIn("Jun-24", error_message, "Error message should include expected file period")
            self.assertIn("2024-06", error_message, "Error message should include selected period")
            self.assertIn("Hospital with Aliases", error_message, "Error message should include org unit name")

        finally:
            # Restore original responses
            RESPONSES.clear()
            RESPONSES.update(original_responses)


class LogCapture(logging.Handler):
    """Custom logging handler to capture log messages for testing"""

    def __init__(self, log_list):
        super().__init__()
        self.log_list = log_list

    def emit(self, record):
        self.log_list.append(self.format(record))
