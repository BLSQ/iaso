import datetime
import time_machine

from django.utils import timezone

from plugins.polio.api.notifications.serializers import NotificationSerializer
from plugins.polio.models import Notification
from iaso.test import APITestCase, TestCase
from iaso import models as m


DT = datetime.datetime(2023, 11, 21, 11, 0, 0, 0, tzinfo=timezone.utc)


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
                "vdpv_category": "cvdpv2",
                "source": "accute_flaccid_paralysis",
                "vdpv_nucleotide_diff_sabin2": "7nt",
                "lineage": "CHA-NDJ-1",
                "closest_match_vdpv2": "ENV-CHA-NDJ-CEN-CPR-19-02",
                "date_of_onset": "2023-11-10",
                "date_results_received": "2023-11-19",
                "site_name": "ELIZANDRA ELSANone",
                "created_at": "2023-11-21T11:00:00Z",
                "updated_at": None,
                "district": "CUVANGO",
                "province": "HUILA",
                "country": "ANGOLA",
            },
        )

    def test_deserialize_notification(self):
        data = {
            "epid_number": "ANG-HUI-CUV-19-002",
            "vdpv_category": "cvdpv2",
            "source": "accute_flaccid_paralysis",
            "vdpv_nucleotide_diff_sabin2": "7nt",
            "lineage": "CHA-NDJ-1",
            "closest_match_vdpv2": "ENV-CHA-NDJ-CEN-CPR-19-02",
            "date_of_onset": "2023-11-10",
            "date_results_received": "2023-11-19",
            "site_name": "ELIZANDRA ELSANone",
            "account": self.account.pk,
            "org_unit": self.district_cuvango.pk,
            "created_by": self.user.pk,
        }
        serializer = NotificationSerializer(data=data)

        self.assertTrue(serializer.is_valid())
        serializer.save()

        notification = Notification.objects.get(epid_number=data["epid_number"])
        self.assertEqual(notification.vdpv_category, Notification.VdpvCategories.CVDPV2)
        self.assertEqual(notification.source, Notification.Sources.AFP)
        self.assertEqual(notification.lineage, "CHA-NDJ-1")
        self.assertEqual(notification.closest_match_vdpv2, "ENV-CHA-NDJ-CEN-CPR-19-02")
        self.assertEqual(notification.date_of_onset, datetime.date(2023, 11, 10))
        self.assertEqual(notification.date_results_received, datetime.date(2023, 11, 19))
        self.assertEqual(notification.site_name, "ELIZANDRA ELSANone")
        self.assertEqual(notification.account, self.account)
        self.assertEqual(notification.org_unit, self.district_cuvango)
        self.assertEqual(notification.created_by, self.user)
        self.assertEqual(notification.created_at, DT)


@time_machine.travel(DT, tick=False)
class NotificationViewSetTestCase(APITestCase):
    """
    Test NotificationViewSet.
    """

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

    def test_list_with_auth(self):
        self.client.force_authenticate(self.user)
        with self.assertNumQueries(4):
            response = self.client.get("/api/polio/notifications/")
            self.assertJSONResponse(response, 200)
            self.assertEqual(2, response.data["count"])
