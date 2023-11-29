import datetime
import os
import shutil
import time_machine
from unittest import mock

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.utils import timezone

from hat import settings
from plugins.polio.api.notifications.serializers import NotificationSerializer, NotificationImportSerializer
from plugins.polio.models import Notification, NotificationImport
from iaso.test import APITestCase, TestCase
from iaso import models as m


DT = datetime.datetime(2023, 11, 21, 11, 0, 0, 0, tzinfo=timezone.utc)

TEST_MEDIA_ROOT = os.path.join(settings.BASE_DIR, "media/_test")
XLSX_FILE_PATH = "plugins/polio/tests/fixtures/linelist_notification_test.xlsx"


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
@time_machine.travel(DT, tick=False)
class NotificationImportSerializerTestCase(TestCase):
    """
    Test NotificationImportSerializer.
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

    def test_deserialize_notification_import(self):
        with open(XLSX_FILE_PATH, "rb") as xlsx_file:
            data = {
                "file": SimpleUploadedFile("notifications.xlsx", xlsx_file.read()),
                "created_by": self.user.pk,
            }
            serializer = NotificationImportSerializer(data=data)

        self.assertTrue(serializer.is_valid())
        notification_import = serializer.save(account=self.account)
        self.assertEqual(notification_import.account, self.account)
        self.assertEqual(notification_import.created_by, self.user)
        self.assertEqual(notification_import.created_at, DT)
        self.assertIn("notifications.xlsx", notification_import.file.name)
        self.assertEqual(notification_import.created_at, DT)


@time_machine.travel(DT, tick=False)
class NotificationSerializerTestCase(TestCase):
    """
    Test NotificationSerializer.
    """

    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Data Source")
        cls.source_version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = m.Account.objects.create(name="Account", default_version=cls.source_version)
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

        country_angola = m.OrgUnit.objects.create(
            name="ANGOLA",
            org_unit_type=m.OrgUnitType.objects.create(category="COUNTRY"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["foo"],
            version=cls.source_version,
        )
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
        cls.district_cuvango.calculate_paths()

    def test_serialize_notification(self):
        kwargs = {
            "account": self.account,
            "epid_number": "ANG-HUI-CUV-19-002",
            "vdpv_category": Notification.VdpvCategories.CVDPV2,
            "source": Notification.Sources.AFP,
            "vdpv_nucleotide_diff_sabin2": "7nt",
            "lineage": "CHA-NDJ-1",
            "closest_match_vdpv2": "ENV-CHA-NDJ-CEN-CPR-19-02",
            "date_of_onset": datetime.date(2023, 11, 10),
            "date_results_received": datetime.date(2023, 11, 19),
            "org_unit": self.district_cuvango,
            "site_name": "ELIZANDRA ELSANone",
            "created_by": self.user,
        }
        notification = Notification.objects.create(**kwargs)
        # Simulate an annotated queryset.
        notification.annotated_district = "CUVANGO"
        notification.annotated_province = "HUILA"
        notification.annotated_country = "ANGOLA"

        serializer = NotificationSerializer(notification)

        self.assertEqual(
            serializer.data,
            {
                "epid_number": "ANG-HUI-CUV-19-002",
                "vdpv_category": Notification.VdpvCategories.CVDPV2,
                "source": Notification.Sources.AFP,
                "vdpv_nucleotide_diff_sabin2": "7nt",
                "lineage": "CHA-NDJ-1",
                "closest_match_vdpv2": "ENV-CHA-NDJ-CEN-CPR-19-02",
                "date_of_onset": "2023-11-10",
                "date_results_received": "2023-11-19",
                "district": "CUVANGO",
                "province": "HUILA",
                "country": "ANGOLA",
                "site_name": "ELIZANDRA ELSANone",
                "org_unit": self.district_cuvango.pk,
                "account": self.account.pk,
                "created_by": self.user.pk,
                "created_at": "2023-11-21T11:00:00Z",
                "updated_by": None,
                "updated_at": None,
            },
        )

    def test_deserialize_notification(self):
        data = {
            "epid_number": "ANG-HUI-CUV-19-002",
            "vdpv_category": Notification.VdpvCategories.CVDPV2,
            "source": Notification.Sources.AFP,
            "vdpv_nucleotide_diff_sabin2": "7nt",
            "lineage": "CHA-NDJ-1",
            "closest_match_vdpv2": "ENV-CHA-NDJ-CEN-CPR-19-02",
            "date_of_onset": "2023-11-10",
            "date_results_received": "2023-11-19",
            "site_name": "ELIZANDRA ELSANone",
            "org_unit": self.district_cuvango.pk,
        }
        serializer = NotificationSerializer(data=data)

        self.assertTrue(serializer.is_valid())
        serializer.save(account=self.account, created_by=self.user)

        notification = Notification.objects.get(epid_number=data["epid_number"])
        self.assertEqual(notification.vdpv_category, Notification.VdpvCategories.CVDPV2)
        self.assertEqual(notification.source, Notification.Sources.AFP)
        self.assertEqual(notification.vdpv_nucleotide_diff_sabin2, "7nt")
        self.assertEqual(notification.lineage, "CHA-NDJ-1")
        self.assertEqual(notification.closest_match_vdpv2, "ENV-CHA-NDJ-CEN-CPR-19-02")
        self.assertEqual(notification.date_of_onset, datetime.date(2023, 11, 10))
        self.assertEqual(notification.date_results_received, datetime.date(2023, 11, 19))
        self.assertEqual(notification.site_name, "ELIZANDRA ELSANone")
        self.assertEqual(notification.account, self.account)
        self.assertEqual(notification.org_unit, self.district_cuvango)
        self.assertEqual(notification.created_by, self.user)
        self.assertEqual(notification.created_at, DT)


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
@time_machine.travel(DT, tick=False)
class NotificationViewSetTestCase(APITestCase):
    """
    Test NotificationViewSet.
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
        cls.user = cls.create_user_with_profile(
            username="user", account=cls.account, permissions=["iaso_polio_notifications"]
        )

        country_angola = m.OrgUnit.objects.create(
            name="ANGOLA",
            org_unit_type=m.OrgUnitType.objects.create(category="COUNTRY"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["foo"],
            version=cls.source_version,
        )
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
        cls.district_cuvango.calculate_paths()

        cls.notification1 = Notification.objects.create(
            account=cls.account,
            epid_number="ANG-HUI-CUV-19-001",
            vdpv_category=Notification.VdpvCategories.CVDPV2,
            source=Notification.Sources.AFP,
            vdpv_nucleotide_diff_sabin2="7nt",
            lineage="CHA-NDJ-1",
            closest_match_vdpv2="ENV-CHA-NDJ-CEN-CPR-19-02",
            date_of_onset=datetime.date(2023, 11, 10),
            date_results_received=datetime.date(2023, 11, 19),
            org_unit=cls.district_cuvango,
            site_name="ELIZANDRA ELSANone",
            created_by=cls.user,
        )
        cls.notification2 = Notification.objects.create(
            account=cls.account,
            epid_number="ANG-HUI-CUV-19-002",
            vdpv_category=Notification.VdpvCategories.VDPV1,
            source=Notification.Sources.CC,
            vdpv_nucleotide_diff_sabin2="5",
            lineage="CHA-NDJ-2",
            closest_match_vdpv2="",
            date_of_onset=datetime.date(2023, 8, 11),
            date_results_received=datetime.date(2023, 8, 28),
            org_unit=cls.district_cuvango,
            site_name="",
            created_by=cls.user,
        )

    def test_list_without_auth(self):
        response = self.client.get("/api/polio/notifications/")
        self.assertJSONResponse(response, 403)

    def test_list(self):
        self.client.force_authenticate(self.user)
        with self.assertNumQueries(4):
            response = self.client.get("/api/polio/notifications/?limit=2")
            self.assertJSONResponse(response, 200)
            self.assertEqual(2, response.data["count"])

    def test_get(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/polio/notifications/{self.notification1.pk}/")
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.data["epid_number"], self.notification1.epid_number)

    def test_post(self):
        self.client.force_authenticate(self.user)
        data = {
            "epid_number": "ANG-HUI-CUV-19-003",
            "vdpv_category": Notification.VdpvCategories.VDPV,
            "source": Notification.Sources.ENV,
            "vdpv_nucleotide_diff_sabin2": "",
            "lineage": "",
            "closest_match_vdpv2": "",
            "date_of_onset": None,
            "date_results_received": None,
            "site_name": "",
            "org_unit": self.district_cuvango.pk,
        }
        response = self.client.post("/api/polio/notifications/", data=data, format="json")
        self.assertEqual(response.status_code, 201)
        notification = Notification.objects.get(epid_number=data["epid_number"])
        self.assertEqual(notification.created_by, self.user)

    def test_delete(self):
        self.client.force_authenticate(self.user)
        response = self.client.delete(f"/api/polio/notifications/{self.notification1.pk}/")
        self.assertEqual(response.status_code, 204)
        self.assertIsNone(Notification.objects.filter(pk=self.notification1.pk).first())

    def test_patch(self):
        self.client.force_authenticate(self.user)
        data = {
            "vdpv_category": Notification.VdpvCategories.WPV1,
        }
        response = self.client.patch(f"/api/polio/notifications/{self.notification1.pk}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)
        self.notification1.refresh_from_db()
        self.assertEqual(self.notification1.vdpv_category, Notification.VdpvCategories.WPV1)
        self.assertEqual(self.notification1.updated_by, self.user)

    def test_action_download_sample_xlsx(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/polio/notifications/download_sample_xlsx/")
        self.assertEqual(response.status_code, 200)
        self.assertEquals(response.get("Content-Disposition"), 'inline; filename="notifications_template.xlsx"')

    @mock.patch("plugins.polio.api.notifications.views.create_polio_notifications_async")
    def test_action_import_xlsx(self, mocked_create_polio_notifications_async):
        self.client.force_authenticate(self.user)
        with open(XLSX_FILE_PATH, "rb") as xlsx_file:
            data = {"account": self.account.pk, "file": xlsx_file}
            response = self.client.post(
                f"/api/polio/notifications/import_xlsx/",
                data=data,
                format="multipart",
                HTTP_ACCEPT="application/json",
            )
        self.assertJSONResponse(response, 201)
        self.assertTrue(mocked_create_polio_notifications_async.called)
        notification_import = NotificationImport.objects.get(pk=response.data["id"])
        self.assertEqual(notification_import.account, self.account)
        self.assertEqual(notification_import.created_by, self.user)
