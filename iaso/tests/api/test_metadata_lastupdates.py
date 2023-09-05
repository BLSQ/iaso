from datetime import datetime
from unittest import mock
from unittest.mock import patch

from iaso import models as m
from iaso.test import APITestCase
from django.utils.timezone import now


class MetadataLastUpdatesTestCase(APITestCase):
    @classmethod
    @mock.patch("django.utils.timezone.now", lambda: datetime(1970, 1, 1, 0, 0, 1))
    def setUpTestData(cls):
        n = cls.now = now()
        star_wars = m.Account.objects.create(name="Star Wars")
        sw_source = cls.sw_source = m.DataSource.objects.create(name="Galactic Empire")
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version
        star_wars.save()
        with patch("django.utils.timezone.now", lambda: datetime(1970, 1, 1, 0, 0, 7)):
            jedi_council = cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        jedi_academy = cls.jedi_academy = m.OrgUnitType.objects.create(name="Jedi Academy", short_name="Aca")
        project_1 = cls.project_1 = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )
        project_2 = cls.project_2 = m.Project.objects.create(
            name="New Land Speeder concept", app_id="stars.empire.agriculture.land_speeder", account=star_wars
        )
        sw_source.projects.add(project_1)
        sw_source.projects.add(project_2)
        sw_source.save()

        with patch("django.utils.timezone.now", lambda: datetime(1970, 1, 1, 0, 0, 1)):
            form_1 = cls.form_1 = m.Form.objects.create(name="Hydroponics study", created_at=n)
        with patch("django.utils.timezone.now", lambda: datetime(1970, 1, 1, 0, 0, 2)):
            form_2 = cls.form_2 = m.Form.objects.create(
                name="Hydroponic public survey",
                form_id="sample2",
                device_field="deviceid",
                location_field="geoloc",
                period_type="QUARTER",
                single_per_period=True,
                created_at=n,
            )
        with patch("django.utils.timezone.now", lambda: datetime(1970, 1, 1, 0, 0, 5)):
            form_version = cls.form_version = form_2.form_versions.create(
                file=cls.create_file_mock(name="testf1.xml"), version_id="2020022401"
            )
        with patch("django.utils.timezone.now", lambda: datetime(1970, 1, 1, 0, 0, 3)):
            form_3 = cls.form_3 = m.Form.objects.create(name="form3", created_at=n)
        with patch("django.utils.timezone.now", lambda: datetime(1970, 1, 1, 0, 0, 4)):
            form_4 = cls.form_4 = m.Form.objects.create(name="form4", created_at=n)

        with patch("django.utils.timezone.now", lambda: datetime(1970, 1, 1, 0, 0, 1)):
            ou_1 = cls.ou_1 = m.OrgUnit.objects.create(name="OU1", org_unit_type=jedi_council, version=sw_version)
        with patch("django.utils.timezone.now", lambda: datetime(1970, 1, 1, 0, 0, 4)):
            ou_2 = cls.ou_2 = m.OrgUnit.objects.create(name="OU2", org_unit_type=jedi_council, version=sw_version)
        with patch("django.utils.timezone.now", lambda: datetime(1970, 1, 1, 0, 0, 2)):
            ou_3 = cls.ou_3 = m.OrgUnit.objects.create(name="OU3", org_unit_type=jedi_academy, version=sw_version)
        with patch("django.utils.timezone.now", lambda: datetime(1970, 1, 1, 0, 0, 3)):
            ou_4 = cls.ou_4 = m.OrgUnit.objects.create(name="OU4", org_unit_type=jedi_academy, version=sw_version)

        cls.yoda = cls.create_user_with_profile(
            username="yoda", account=star_wars, permissions=["iaso_forms"], org_units=[ou_3]
        )

        project_1.unit_types.add(jedi_council)
        project_1.forms.add(form_1)
        project_1.forms.add(form_2)
        project_1.save()
        project_2.unit_types.add(jedi_academy)
        project_2.forms.add(form_3)
        project_2.forms.add(form_4)
        project_2.save()

        assert jedi_council.updated_at.timestamp() == 7.0, f"updated at: {jedi_council.updated_at.timestamp()}"
        assert jedi_academy.updated_at.timestamp() == 1.0, f"updated at: {jedi_academy.updated_at.timestamp()}"
        assert form_1.updated_at.timestamp() == 1.0, f"updated at: {form_1.updated_at.timestamp()}"
        assert form_2.updated_at.timestamp() == 2.0, f"updated at: {form_2.updated_at.timestamp()}"
        assert form_3.updated_at.timestamp() == 3.0, f"updated at: {form_3.updated_at.timestamp()}"
        assert form_4.updated_at.timestamp() == 4.0, f"updated at: {form_4.updated_at.timestamp()}"
        assert form_version.updated_at.timestamp() == 5.0, f"updated at: {form_version.updated_at.timestamp()}"
        assert ou_1.updated_at.timestamp() == 1.0, f"updated at: {ou_1.updated_at.timestamp()}"
        assert ou_2.updated_at.timestamp() == 4.0, f"updated at: {ou_2.updated_at.timestamp()}"
        assert ou_3.updated_at.timestamp() == 2.0, f"updated at: {ou_3.updated_at.timestamp()}"
        assert ou_4.updated_at.timestamp() == 3.0, f"updated at: {ou_4.updated_at.timestamp()}"

    def test_last_updates_without_auth_and_app_id(self):
        """GET /api/mobile/metadata/lastupdates/: returns 400 for missing app id"""

        response = self.client.get("/api/mobile/metadata/lastupdates/")
        self.assertJSONResponse(response, 400)

    def test_last_updates_without_auth_but_app_id(self):
        """GET /api/mobile/metadata/lastupdates/?app_id=stars.empire.agriculture.land_speeder"""

        response = self.client.get(f"/api/mobile/metadata/lastupdates/?app_id={self.project_2.app_id}")
        self.assertJSONResponse(response, 200)

        self.assertEqual(response.json()["forms"], 4.0)  # highest form for project 2
        self.assertEqual(response.json()["org_units"], 3.0)  # highest org unit for project 2

    def test_last_updates_with_wrong_app_id(self):
        """GET /api/mobile/metadata/lastupdates/?app_id=WRONG: returns 404 for invalid app id"""

        response = self.client.get(f"/api/mobile/metadata/lastupdates/?app_id=WRONG")
        self.assertJSONResponse(response, 404)

    def test_last_updates_with_auth_but_no_app_id(self):
        """GET /api/mobile/metadata/lastupdates/: authenticated but returns 400 for missing app id"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/mobile/metadata/lastupdates/")
        self.assertJSONResponse(response, 400)

    def test_last_updates_with_auth_and_app_id(self):
        """GET /api/mobile/metadata/lastupdates/: authenticated with app id"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/mobile/metadata/lastupdates/?app_id={self.project_2.app_id}")
        self.assertJSONResponse(response, 200)

        self.assertEqual(response.json()["forms"], 4.0)  # highest form for project 2
        self.assertEqual(response.json()["org_units"], 2.0)  # highest org unit in the ones available to the user
