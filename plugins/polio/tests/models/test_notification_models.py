import datetime
import os
import shutil

from django.core.files.uploadedfile import UploadedFile
from django.test import override_settings
from django.utils import timezone

from hat import settings
from iaso import models as m
from iaso.test import TestCase
from plugins.polio.models import NotificationImport, Notification


TEST_MEDIA_ROOT = os.path.join(settings.BASE_DIR, "media/_test")


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
class NotificationImportTestCase(TestCase):
    """
    Test NotificationImport model.
    """

    DT = datetime.datetime(2023, 11, 14, 15, 0, 0, 0, tzinfo=timezone.utc)

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

    def test_clean_str(self):
        func = NotificationImport.clean_str
        self.assertEqual(func(" foo     "), "foo")
        self.assertEqual(func(True), "True")
        self.assertEqual(func(5), "5")

    def test_clean_date(self):
        func = NotificationImport.clean_date
        self.assertEqual(func(""), None)
        self.assertEqual(func(self.DT), datetime.date(2023, 11, 14))

    def test_clean_vdpv_category(self):
        func = NotificationImport.clean_vdpv_category
        self.assertEqual(func("cvdpv1"), Notification.VdpvCategories.CVDPV1)
        self.assertEqual(func(" SABIN2  "), Notification.VdpvCategories.SABIN2)

    def test_clean_source(self):
        func = NotificationImport.clean_source
        self.assertEqual(func(" AFP  "), Notification.Sources.AFP)
        self.assertEqual(func(" cont  "), Notification.Sources.CONTACT)
        self.assertEqual(func("foo"), Notification.Sources.OTHER)

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
