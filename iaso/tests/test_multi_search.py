from django.test import TestCase, tag
from ..models import (
    OrgUnit,
    Profile,
    OrgUnitType,
    Account,
    Project,
    DataSource,
    SourceVersion,
)

from rest_framework.test import APIClient
from django.contrib.auth.models import User

import json


class MultiSearchTestCase(TestCase):
    def setUp(self):
        account = Account(name="Zelda")

        source = DataSource.objects.create(name="Korogu")
        version = SourceVersion.objects.create(data_source=source, number=1)
        account.default_version = version
        account.save()

        self.project = Project(
            name="Hyrule", app_id="magic.countries.hyrule.collect", account=account
        )
        self.project.save()

        source.projects.add(self.project)

        unit_type = OrgUnitType(name="Village", short_name="Vil")
        unit_type.save()
        self.project.unit_types.add(unit_type)

        self.village_unit_type = unit_type

        user = User.objects.create(username="link")
        user.set_password("tiredofplayingthesameagain")
        user.save()
        p = Profile(user=user, account=account)
        p.save()
        self.link = user
        self.link_client = APIClient()
        self.link_client.login(username="link", password="tiredofplayingthesameagain")

        OrgUnit.objects.create(name="Akkala", org_unit_type=unit_type, version=version)
        OrgUnit.objects.create(
            name="Kakariko", org_unit_type=unit_type, version=version
        )

    @tag("iaso_only")
    def test_org_unit_multi_search_as_location(self):
        """Testing the multi search"""
        link_client = self.link_client

        response = link_client.get(
            '/api/orgunits/?limit=2&searches=[{"search":"akka"},{"search":"riko"}]&asLocation=True',
            format="json",
        )
        self.assertEqual(response.status_code, 200)

        self.assertEqual(response.status_code, 200)

        json_response = json.loads(response.content)

        self.assertEqual(len(json_response), 2)

    @tag("iaso_only")
    def test_org_unit_multi_search_as_dict(self):
        """Testing the multi search"""
        link_client = self.link_client

        response = link_client.get(
            '/api/orgunits/?limit=2&searches=[{"search":"akka"},{"search":"riko"}]',
            format="json",
        )
        self.assertEqual(response.status_code, 200)

        self.assertEqual(response.status_code, 200)

        json_response = json.loads(response.content)

        self.assertEqual(json_response["count"], 2)
