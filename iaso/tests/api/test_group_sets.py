import datetime
import json
import typing
from unittest import mock
from unittest.mock import patch
from uuid import uuid4

import pytz
from django.contrib.gis.geos import Point
from django.core.files import File
from django.utils import timezone
from django.utils.timezone import now
from rest_framework import status

from hat.api.export_utils import timestamp_to_utc_datetime
from hat.audit.models import Modification
from iaso import models as m
from iaso.api import query_params as query
from iaso.models import GroupSet
from iaso.test import APITestCase
import csv
import io

MOCK_DATE = datetime.datetime(2020, 2, 2, 2, 2, 2, tzinfo=pytz.utc)


class GroupSetsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.now = now()

        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.source_version_2 = m.SourceVersion.objects.create(data_source=cls.data_source, number=2)

        star_wars = m.Account.objects.create(name="Star Wars", default_version=cls.source_version_2)
        marvel = m.Account.objects.create(name="Marvel")

        cls.acccount_1_user_1 = cls.create_user_with_profile(
            username="yoda", account=star_wars, permissions=["iaso_org_units"]
        )
        cls.acccount_1_user_2 = cls.create_user_with_profile(username="chewbacca", account=star_wars)
        cls.acccount_3_user_1 = cls.create_user_with_profile(
            username="raccoon", account=marvel, permissions=["iaso_org_units"]
        )

        cls.project_1 = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )

        cls.project_2 = m.Project.objects.create(
            name="New Land Speeder concept", app_id="stars.empire.agriculture.land_speeder", account=star_wars
        )

        cls.src_1_group_1 = m.Group.objects.create(name="Councils", source_version=cls.source_version_1)
        cls.src_1_group_2 = m.Group.objects.create(name="Hidden", source_version=cls.source_version_1)

        cls.src_2_group_1 = m.Group.objects.create(name="Assemblies", source_version=cls.source_version_2)

        cls.project_1.data_sources.add(cls.data_source)
        cls.project_1.save()
        cls.data_source.account = star_wars
        cls.data_source.projects.add(cls.project_1)
        cls.data_source.save()

        cls.acccount_1_user_1.iaso_profile.projects.add(cls.project_1)

    def test_create_groupset_with_valid_groups(self):
        """
        Ensure we can create a GroupSet with valid group_ids.
        """

        self.client.force_authenticate(self.acccount_1_user_1)

        valid_payload = {
            "name": "New GroupSet",
            "source_version_id": self.source_version_1.id,
            "group_ids": [self.src_1_group_1.id, self.src_1_group_2.id],
        }
        response = self.client.post("/api/group_sets/", valid_payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(GroupSet.objects.count(), 1)

        created_groupset = GroupSet.objects.last()
        self.assertEqual(created_groupset.name, "New GroupSet")
        self.assertEqual(created_groupset.source_version.id, self.source_version_1.id)
        self.assertEqual([x.id for x in created_groupset.groups.all()], [self.src_1_group_1.id, self.src_1_group_2.id])

    def test_update_groupset_with_valid_groups(self):
        """
        Ensure we can create a GroupSet with valid group_ids.
        """

        self.client.force_authenticate(self.acccount_1_user_1)

        valid_payload = {
            "name": "New GroupSet",
            "source_version_id": self.source_version_1.id,
        }
        response = self.client.post("/api/group_sets/", valid_payload, format="json")

        groupset = GroupSet.objects.all()[0]
        self.assertEqual(groupset.groups.count(), 0)
        url = f"/api/group_sets/{groupset.id}/"
        response = self.client.patch(
            url,
            {
                "source_version_id": self.source_version_1.id,
                "group_ids": [self.src_1_group_1.id, self.src_1_group_2.id],
            },
            format="json",
        )

        groupset = GroupSet.objects.all()[0]
        self.assertEqual(groupset.groups.count(), 2)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_groupset_with_invalid_groups(self):
        """
        Ensure we can create a GroupSet with valid group_ids.
        """

        self.client.force_authenticate(self.acccount_1_user_1)

        invalid_payload = {
            "name": "New GroupSet mixing 2 sources",
            "source_version_id": self.source_version_1.id,
            "group_ids": [self.src_1_group_1.id, self.src_2_group_1.id],
        }
        response = self.client.post("/api/group_sets/", invalid_payload, format="json")
        print(response.json())

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(GroupSet.objects.count(), 0)
        self.assertIn("group_ids", response.data)
