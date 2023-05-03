import json

from django.contrib.auth.models import User
from django.contrib.gis.geos import Point
from django.test import TestCase
from rest_framework.test import APIClient

from ..models import OrgUnit, Profile, OrgUnitType, Account, Project, DataSource, SourceVersion


class MultiSearchTestCase(TestCase):
    def setUp(self):
        account = Account(name="Zelda")

        source = DataSource.objects.create(name="Korogu")
        default_version = SourceVersion.objects.create(data_source=source, number=1)
        account.default_version = default_version
        account.save()
        self.project = Project(name="Hyrule", app_id="magic.countries.hyrule.collect", account=account)
        self.project.save()
        source.projects.add(self.project)

        source_2 = DataSource.objects.create(name="Goron")
        other_version = SourceVersion.objects.create(data_source=source_2, number=1)
        self.project_2 = Project(name="Lorule", app_id="magic.countries.lorule.collect", account=account)
        self.project_2.save()

        source_2.projects.add(self.project_2)

        unit_type = OrgUnitType(name="Village", short_name="Vil")
        unit_type.save()
        self.project.unit_types.add(unit_type)
        self.project_2.unit_types.add(unit_type)

        self.village_unit_type = unit_type

        user = User.objects.create(username="link")
        user.set_password("tiredofplayingthesameagain")
        user.save()
        p = Profile(user=user, account=account)
        p.save()
        self.link = user
        self.link_client = APIClient()
        self.link_client.login(username="link", password="tiredofplayingthesameagain")

        OrgUnit.objects.create(
            name="Akkala",
            org_unit_type=unit_type,
            version=default_version,
            location=Point(x=4, y=50, z=100),
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        OrgUnit.objects.create(
            name="Kakariko",
            org_unit_type=unit_type,
            version=default_version,
            location=Point(x=5, y=51, z=101),
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        OrgUnit.objects.create(
            name="Gerudo",
            org_unit_type=unit_type,
            version=other_version,
            location=Point(x=6, y=52, z=102),
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        OrgUnit.objects.create(
            name="Eldin",
            org_unit_type=unit_type,
            version=other_version,
            location=Point(x=6, y=52, z=102),
            validation_status=OrgUnit.VALIDATION_VALID,
        )

    def test_org_unit_multi_search_as_location(self):
        """Testing the multi search as location"""
        link_client = self.link_client

        response = link_client.get(
            '/api/orgunits/?limit=20&searches=[{"search":"akka"},{"search":"riko"}]&asLocation=True', format="json"
        )
        self.assertEqual(response.status_code, 200)

        json_response = json.loads(response.content)

        self.assertEqual(len(json_response), 2)

    def test_org_unit_multi_search_all(self):
        """Testing the multi search get all"""
        link_client = self.link_client

        response = link_client.get("/api/orgunits/?limit=20", format="json")
        self.assertEqual(response.status_code, 200)

        json_response = json.loads(response.content)

        self.assertEqual(json_response["count"], 4)

    def test_org_unit_multi_search_as_dict(self):
        """Testing the multi search as dict"""
        link_client = self.link_client

        response = link_client.get(
            '/api/orgunits/?limit=20&searches=[{"search":"akka"},{"search":"riko"}]', format="json"
        )
        self.assertEqual(response.status_code, 200)

        json_response = json.loads(response.content)

        self.assertEqual(json_response["count"], 2)

    def test_org_unit_multi_search_as_dict_default_version(self):
        """Testing the multi search only default version"""
        link_client = self.link_client

        response = link_client.get('/api/orgunits/?limit=20&searches=[{"defaultVersion":"true"}]', format="json")
        self.assertEqual(response.status_code, 200)

        json_response = json.loads(response.content)

        self.assertEqual(json_response["count"], 2)
