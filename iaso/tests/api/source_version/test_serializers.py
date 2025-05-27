from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from iaso import models as m
from iaso.api.source_versions_serializers import DiffSerializer
from iaso.test import TestCase


# TODO: add tests for SourceVersionListSerializer
# TODO: add tests for ExportSerializer


class DiffSerializerTestCase(TestCase):
    """
    Test Diff serializer.
    """

    @classmethod
    def setUpTestData(cls):
        cls.account, cls.data_source, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            "source", "account", "project"
        )
        cls.user, cls.anon, cls.user_no_perms = cls.create_base_users(cls.account, [])

        cls.group_1 = m.Group.objects.create(name="Group 1", source_version=cls.source_version)
        cls.group_2 = m.Group.objects.create(name="Group 2", source_version=cls.source_version)

        cls.org_unit_type_1 = m.OrgUnitType.objects.create(
            name="Hellooooooooooo", short_name="is it me you're looking for?"
        )
        cls.org_unit_type_2 = m.OrgUnitType.objects.create(
            name="I can see it in your eyes", short_name="I can see it in your smile"
        )

        cls.org_unit_1 = m.OrgUnit.objects.create(
            name="OU 1",
            org_unit_type=cls.org_unit_type_1,
            validation_status=m.OrgUnit.VALIDATION_NEW,
            version=cls.source_version,
        )
        cls.org_unit_2 = m.OrgUnit.objects.create(
            name="OU 2",
            org_unit_type=cls.org_unit_type_2,
            validation_status=m.OrgUnit.VALIDATION_NEW,
            version=cls.source_version,
        )

    def setUp(self):
        # Building a request to fake calling serializers from the API - we need this to add the user
        # This is not in setUpTestData because it can't be deep copied
        factory = APIRequestFactory()
        self.drf_request = Request(factory.get("/i-dont-care-about-the-url/", format="json"))
        self.drf_request.user = self.user

    def test_deserialize_happy_path(self):
        data = {
            "ref_version_id": self.source_version.id,
            "ref_status": m.OrgUnit.VALIDATION_VALID,
            "ref_top_org_unit_id": self.org_unit_2.id,
            "ref_org_unit_type_ids": [self.org_unit_type_1.id],
            "ref_org_unit_group_id": self.group_2.id,
            "source_version_id": self.source_version.id,
            "source_status": m.OrgUnit.VALIDATION_VALID,
            "source_top_org_unit_id": self.org_unit_1.id,
            "source_org_unit_type_ids": [self.org_unit_type_1.id, self.org_unit_type_2.id],
            "source_org_unit_group_id": self.group_1.id,
            "fields_to_export": ["name", "parent", "geometry", "groups", "opening_date", "closed_date"],
        }
        serializer = DiffSerializer(data=data, context={"request": self.drf_request})
        self.assertTrue(serializer.is_valid())

    def test_deserialize_error_source_group_not_in_source_version(self):
        # Creating a new group & version
        new_version = m.SourceVersion.objects.create(data_source=self.data_source, number=42)
        new_group = m.Group.objects.create(name="New Group", source_version=new_version)

        data = {
            "ref_version_id": self.source_version.id,
            "ref_status": "",
            "ref_top_org_unit_id": None,
            "ref_org_unit_type_ids": [],
            "ref_org_unit_group_id": self.group_2.id,
            "source_version_id": self.source_version.id,
            "source_status": "",
            "source_top_org_unit_id": None,
            "source_org_unit_type_ids": [],
            "source_org_unit_group_id": new_group.id,
            "fields_to_export": [],
        }
        serializer = DiffSerializer(data=data, context={"request": self.drf_request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("source_org_unit_group_id", serializer.errors)
        self.assertIn("not in source_version_id", serializer.errors["source_org_unit_group_id"][0])

    def test_deserialize_error_ref_group_not_in_ref_version(self):
        # Creating a new group & version
        new_version = m.SourceVersion.objects.create(data_source=self.data_source, number=42)
        new_group = m.Group.objects.create(name="New Group", source_version=new_version)

        data = {
            "ref_version_id": self.source_version.id,
            "ref_status": "",
            "ref_top_org_unit_id": None,
            "ref_org_unit_type_ids": [],
            "ref_org_unit_group_id": new_group.id,
            "source_version_id": self.source_version.id,
            "source_status": "",
            "source_top_org_unit_id": None,
            "source_org_unit_type_ids": [],
            "source_org_unit_group_id": self.group_1.id,
            "fields_to_export": [],
        }
        serializer = DiffSerializer(data=data, context={"request": self.drf_request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("ref_org_unit_group_id", serializer.errors)
        self.assertIn("not in ref_version_id", serializer.errors["ref_org_unit_group_id"][0])

    def test_deserialize_no_groups(self):
        data = {
            "ref_version_id": self.source_version.id,
            "ref_status": "",
            "ref_top_org_unit_id": None,
            "ref_org_unit_type_ids": [],
            "ref_org_unit_group_id": None,
            "source_version_id": self.source_version.id,
            "source_status": "",
            "source_top_org_unit_id": None,
            "source_org_unit_type_ids": [],
            "source_org_unit_group_id": None,
            "fields_to_export": [],
        }
        serializer = DiffSerializer(data=data, context={"request": self.drf_request})
        self.assertTrue(serializer.is_valid())

    # TODO: test errors linked to other fields in DiffSerializer validation
