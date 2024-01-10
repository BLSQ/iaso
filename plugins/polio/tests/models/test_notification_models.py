import datetime
import os
import shutil
import time_machine

from django.core.files.uploadedfile import UploadedFile
from django.test import override_settings
from django.utils import timezone

from hat import settings
from iaso import models as m
from iaso.models import OrgUnit
from iaso.test import TestCase
from plugins.polio.models import Notification, NotificationImport, NotificationXlsxImporter


DT = datetime.datetime(2023, 12, 12, 11, 0, 0, 0, tzinfo=datetime.timezone.utc)

TEST_MEDIA_ROOT = os.path.join(settings.BASE_DIR, "media/_test")


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
@time_machine.travel(DT, tick=False)
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
        cls.data_source = m.DataSource.objects.create(name="Data Source")
        cls.source_version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = m.Account.objects.create(name="Account", default_version=cls.source_version)
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

        cls.file_path = "plugins/polio/tests/fixtures/linelist_notification_test.xlsx"
        cls.wrong_cols_file_path = "plugins/polio/tests/fixtures/linelist_notification_wrong_cols_test.xlsx"
        cls.invalid_file_path = "plugins/polio/tests/fixtures/linelist_notification_invalid_format_test.txt"

        # Org units matching data in `cls.file_path`
        # Country.
        country_angola = m.OrgUnit.objects.create(
            name="ANGOLA",
            org_unit_type=m.OrgUnitType.objects.create(category="COUNTRY"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["foo"],
            version=cls.source_version,
        )
        # Region / District 1.
        region_huila = m.OrgUnit.objects.create(
            name="HUILA",
            parent=country_angola,
            org_unit_type=m.OrgUnitType.objects.create(category="REGION"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["foo", "bar"],
            version=cls.source_version,
        )
        cls.district_cuvango = m.OrgUnit.objects.create(
            name="CUVANGO",
            parent=region_huila,
            org_unit_type=m.OrgUnitType.objects.create(category="DISTRICT"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["foo", "bar", "baz"],
            version=cls.source_version,
        )
        # Region / District 2.
        region_lunda_norte = m.OrgUnit.objects.create(
            name="LUNDA NORTE",
            parent=country_angola,
            org_unit_type=m.OrgUnitType.objects.create(category="REGION"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["foo", "qux"],
            version=cls.source_version,
        )
        cls.district_cambulo = m.OrgUnit.objects.create(
            name="CAMBULO",
            parent=region_lunda_norte,
            org_unit_type=m.OrgUnitType.objects.create(category="DISTRICT"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["foo", "qux", "quux"],
            version=cls.source_version,
        )
        cls.district_cuvango.calculate_paths()
        cls.district_cambulo.calculate_paths()

    def test_model_str(self):
        notification_import = NotificationImport(file="foo.xlsx", account=self.account, created_by=self.user)
        self.assertEqual(str(notification_import), "foo.xlsx - new")

    def test_read_excel_with_invalid_format(self):
        with open(self.invalid_file_path, "rb") as xls_file:
            notification_import = NotificationImport.objects.create(
                file=UploadedFile(xls_file), account=self.account, created_by=self.user
            )
        with self.assertRaises(ValueError) as error:
            notification_import.read_excel(notification_import.file)
        self.assertIn("Invalid Excel file", str(error.exception))

    def test_read_excel_with_wrong_cols(self):
        with open(self.wrong_cols_file_path, "rb") as xls_file:
            notification_import = NotificationImport.objects.create(
                file=UploadedFile(xls_file), account=self.account, created_by=self.user
            )
        with self.assertRaises(ValueError) as error:
            notification_import.read_excel(notification_import.file)
        self.assertEqual(str(error.exception), "Missing column PROVINCE.")

    def test_create_notifications(self):
        with open(self.file_path, "rb") as xls_file:
            notification_import = NotificationImport.objects.create(
                file=UploadedFile(xls_file), account=self.account, created_by=self.user
            )
        notification_import.create_notifications(created_by=self.user)

        self.assertEqual(Notification.objects.count(), 2)

        notification1 = Notification.objects.get(epid_number="ANG-LNO-CAM-19-001")
        self.assertEqual(notification1.vdpv_category, notification1.VdpvCategories.CVDPV2)
        self.assertEqual(notification1.source, notification1.Sources.AFP)
        self.assertEqual(notification1.lineage, "")
        self.assertEqual(notification1.vdpv_nucleotide_diff_sabin2, "5nt")
        self.assertEqual(notification1.closest_match_vdpv2, "SABIN 2")
        self.assertEqual(notification1.date_of_onset, datetime.date(2019, 4, 5))
        self.assertEqual(notification1.date_results_received, None)
        self.assertEqual(notification1.org_unit, self.district_cambulo)
        self.assertEqual(notification1.site_name, "ELIZANDRA ELSA")
        self.assertEqual(notification1.created_by, self.user)
        self.assertEqual(notification1.created_at, DT)
        self.assertEqual(notification1.updated_at, None)
        self.assertEqual(notification1.updated_by, None)
        self.assertEqual(notification1.import_source, notification_import)

        notification2 = Notification.objects.get(epid_number="ANG-HUI-CUV-19-002")
        self.assertEqual(notification2.vdpv_category, notification1.VdpvCategories.CVDPV2)
        self.assertEqual(notification2.source, notification1.Sources.AFP)
        self.assertEqual(notification2.lineage, "ANG-HUI-1")
        self.assertEqual(notification2.vdpv_nucleotide_diff_sabin2, "")
        self.assertEqual(notification2.closest_match_vdpv2, "Sabin 2")
        self.assertEqual(notification2.date_of_onset, datetime.date(2019, 4, 27))
        self.assertEqual(notification2.date_results_received, None)
        self.assertEqual(notification2.org_unit, self.district_cuvango)
        self.assertEqual(notification2.site_name, "JOSEFA NGOMBE")
        self.assertEqual(notification2.created_by, self.user)
        self.assertEqual(notification2.created_at, DT)
        self.assertEqual(notification2.updated_at, None)
        self.assertEqual(notification2.updated_by, None)
        self.assertEqual(notification2.import_source, notification_import)

    def test_update_notifications(self):
        with open(self.file_path, "rb") as xls_file:
            notification_import = NotificationImport.objects.create(
                file=UploadedFile(xls_file), account=self.account, created_by=self.user
            )

        notification_import.create_notifications(created_by=self.user)
        # Import data a second time (it must be treated as an update).
        notification_import.create_notifications(created_by=self.user)

        self.assertEqual(Notification.objects.count(), 2)

        notification1 = Notification.objects.get(epid_number="ANG-LNO-CAM-19-001")
        self.assertEqual(notification1.updated_by, self.user)
        self.assertEqual(notification1.updated_at, DT)

        notification2 = Notification.objects.get(epid_number="ANG-HUI-CUV-19-002")
        self.assertEqual(notification2.updated_by, self.user)
        self.assertEqual(notification2.updated_at, DT)


class NotificationXlsxImporterTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.country = m.OrgUnit.objects.create(
            name="ANGOLA",
            org_unit_type=m.OrgUnitType.objects.create(category="COUNTRY"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["foo"],
        )
        cls.region = m.OrgUnit.objects.create(
            name="HUILA",
            parent=cls.country,
            org_unit_type=m.OrgUnitType.objects.create(category="REGION"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["foo", "bar"],
        )
        cls.district = m.OrgUnit.objects.create(
            name="CUVANGO",
            parent=cls.region,
            org_unit_type=m.OrgUnitType.objects.create(category="DISTRICT"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["foo", "bar", "baz"],
        )
        cls.district.calculate_paths()
        cls.importer = NotificationXlsxImporter(org_units=OrgUnit.objects.all())

    def test_clean_str(self):
        self.assertEqual(self.importer.clean_str(" foo     "), "foo")
        self.assertEqual(self.importer.clean_str(True), "True")
        self.assertEqual(self.importer.clean_str(5), "5")

    def test_clean_date(self):
        self.assertEqual(self.importer.clean_date(""), None)
        dt = datetime.datetime(2023, 11, 14, 15, 0, 0, 0, tzinfo=datetime.timezone.utc)
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
        countries_cache, regions_cache, districts_cache = self.importer.build_org_unit_caches()
        self.assertEqual(countries_cache["angola"][0], self.country)
        self.assertEqual(regions_cache["huila"][0], self.region)
        self.assertEqual(districts_cache["cuvango"][0], self.district)
