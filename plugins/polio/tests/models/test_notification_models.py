import datetime
import os
import shutil

from django.core.files.uploadedfile import UploadedFile
from django.test import override_settings
from django.utils import timezone

from hat import settings
from iaso import models as m
from iaso.test import TestCase
from plugins.polio.models import NotificationImport, Notification, NotificationXlsxImporter

TEST_MEDIA_ROOT = os.path.join(settings.BASE_DIR, "media/_test")


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
class NotificationImportTestCase(TestCase):
    """
    Test NotificationImport model.
    """

    @classmethod
    def tearDownClass(cls):
        try:
            shutil.rmtree(TEST_MEDIA_ROOT)
        except FileNotFoundError:
            pass
        super().tearDownClass()

    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)
        cls.file_path = "plugins/polio/tests/fixtures/linelist_notification_test.xlsx"
        cls.wrong_cols_file_path = "plugins/polio/tests/fixtures/linelist_notification_wrong_cols_test.xlsx"
        cls.invalid_file_path = "plugins/polio/tests/fixtures/linelist_notification_invalid_format_test.txt"

    def test_model_str(self):
        notification_import = NotificationImport(file="foo.xlsx", account=self.account, created_by=self.user)
        self.assertEqual(str(notification_import), "foo.xlsx - new")

    def test_create_notifications_with_invalid_format(self):
        with open(self.invalid_file_path, "rb") as xls_file:
            notification_import = NotificationImport.objects.create(
                file=UploadedFile(xls_file), account=self.account, created_by=self.user
            )
        with self.assertRaises(ValueError) as error:
            notification_import.create_notifications(created_by=self.user)
        self.assertIn("Invalid Excel file", str(error.exception))

    def test_create_notifications_with_wrong_cols(self):
        with open(self.wrong_cols_file_path, "rb") as xls_file:
            notification_import = NotificationImport.objects.create(
                file=UploadedFile(xls_file), account=self.account, created_by=self.user
            )
        with self.assertRaises(ValueError) as error:
            notification_import.create_notifications(created_by=self.user)
        self.assertEqual(str(error.exception), "Missing column PROVINCE.")


class NotificationXlsxImporterTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.importer = NotificationXlsxImporter()

    def test_clean_str(self):
        self.assertEqual(self.importer.clean_str(" foo     "), "foo")
        self.assertEqual(self.importer.clean_str(True), "True")
        self.assertEqual(self.importer.clean_str(5), "5")

    def test_clean_date(self):
        self.assertEqual(self.importer.clean_date(""), None)
        dt = datetime.datetime(2023, 11, 14, 15, 0, 0, 0, tzinfo=timezone.utc)
        self.assertEqual(self.importer.clean_date(dt), datetime.date(2023, 11, 14))

    def test_clean_vdpv_category(self):
        self.assertEqual(self.importer.clean_vdpv_category("cvdpv1"), Notification.VdpvCategories.CVDPV1)
        self.assertEqual(self.importer.clean_vdpv_category(" SABIN2  "), Notification.VdpvCategories.SABIN2)

    def test_clean_source(self):
        self.assertEqual(self.importer.clean_source(" AFP  "), Notification.Sources.AFP)
        self.assertEqual(self.importer.clean_source(" cont  "), Notification.Sources.CONTACT)
        self.assertEqual(self.importer.clean_source("cc"), Notification.Sources.CC)
        self.assertEqual(self.importer.clean_source("foo"), Notification.Sources.OTHER)
        self.assertEqual(self.importer.clean_source("  accute flaccid paralysis"), Notification.Sources.AFP)

    def test_build_org_unit_caches(self):
        country = m.OrgUnit.objects.create(
            name="ANGOLA",
            org_unit_type=m.OrgUnitType.objects.create(category="COUNTRY"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["foo"],
        )
        region = m.OrgUnit.objects.create(
            name="HUILA",
            parent=country,
            org_unit_type=m.OrgUnitType.objects.create(category="REGION"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["foo", "bar"],
        )
        district = m.OrgUnit.objects.create(
            name="CUVANGO",
            parent=region,
            org_unit_type=m.OrgUnitType.objects.create(category="DISTRICT"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["foo", "bar", "baz"],
        )

        district.calculate_paths()
        countries_cache, regions_cache, districts_cache = self.importer.build_org_unit_caches()

        self.assertEqual(countries_cache["angola"][0], country)
        self.assertEqual(regions_cache["huila"][0], region)
        self.assertEqual(districts_cache["cuvango"][0], district)
