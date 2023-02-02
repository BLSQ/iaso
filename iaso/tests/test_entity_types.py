from django.core.files import File
from unittest import mock


from iaso import models as m
from iaso.models import EntityType
from iaso.test import APITestCase


class EntityTypeAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")
        cls.the_gang = m.Account.objects.create(name="The Gang")

        sw_source = m.DataSource.objects.create(name="Galactic Empire")
        cls.sw_source = sw_source
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version
        star_wars.save()
        cls.sw_version = sw_version

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_submissions"])

        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")

        cls.jedi_council_corruscant = m.OrgUnit.objects.create(name="Coruscant Jedi Council")

        cls.project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )

        cls.form_1 = m.Form.objects.create(name="Hydroponics study", period_type=m.MONTH, single_per_period=True)

        cls.create_form_instance(
            form=cls.form_1, period="202001", org_unit=cls.jedi_council_corruscant, project=cls.project
        )
        cls.create_form_instance(
            form=cls.form_1, period="202002", org_unit=cls.jedi_council_corruscant, project=cls.project
        )
        cls.create_form_instance(
            form=cls.form_1, period="202002", org_unit=cls.jedi_council_corruscant, project=cls.project
        )
        cls.create_form_instance(
            form=cls.form_1, period="202003", org_unit=cls.jedi_council_corruscant, project=cls.project
        )

        cls.form_2 = m.Form.objects.create(
            name="Hydroponic public survey",
            form_id="sample2",
            device_field="deviceid",
            location_field="geoloc",
            period_type="QUARTER",
            single_per_period=True,
        )

        # Form without period
        cls.form_3 = m.Form.objects.create(
            name="Hydroponic public survey III",
            form_id="sample34",
            device_field="deviceid",
            location_field="geoloc",
            # period_type="QUARTER",
            # single_per_period=True,
        )

        cls.form_4 = m.Form.objects.create(
            name="Hydroponic public survey IV",
            form_id="sample26",
            device_field="deviceid",
            location_field="geoloc",
            period_type="QUARTER",
            single_per_period=True,
        )

        form_2_file_mock = mock.MagicMock(spec=File)
        form_2_file_mock.name = "test.xml"
        cls.form_2.form_versions.create(file=form_2_file_mock, version_id="2020022401")
        cls.form_2.org_unit_types.add(cls.jedi_council)
        cls.create_form_instance(form=cls.form_2, period="202001", org_unit=cls.jedi_council_corruscant)
        cls.form_2.save()

        # Instance saved without period
        cls.form_3.form_versions.create(file=form_2_file_mock, version_id="2020022401")
        cls.form_3.org_unit_types.add(cls.jedi_council)
        cls.create_form_instance(form=cls.form_3, org_unit=cls.jedi_council_corruscant)
        cls.form_3.save()

        # A deleted Instance
        cls.form_4.form_versions.create(file=form_2_file_mock, version_id="2020022402")
        cls.form_4.org_unit_types.add(cls.jedi_council)
        cls.create_form_instance(form=cls.form_4, period="2020Q1", org_unit=cls.jedi_council_corruscant, deleted=True)
        cls.form_4.save()

        cls.project.unit_types.add(cls.jedi_council)
        cls.project.forms.add(cls.form_1)
        cls.project.forms.add(cls.form_2)
        cls.project.forms.add(cls.form_3)
        cls.project.forms.add(cls.form_4)
        sw_source.projects.add(cls.project)
        cls.project.save()

    def test_create_entity_type(self):

        self.client.force_authenticate(self.yoda)

        payload = {
            "name": "New Entity Type",
            "reference_form": self.form_1.id,
            "account": self.yoda.iaso_profile.account.pk,
        }

        response = self.client.post("/api/entitytypes/", data=payload, format="json")

        self.assertEqual(response.status_code, 201)

    def test_get_entity_type(self):
        self.client.force_authenticate(self.yoda)

        payload = {
            "name": "New Entity Type",
            "reference_form": self.form_1.id,
        }

        self.client.post("/api/entitytypes/", data=payload, format="json")

        response = self.client.get("/api/entitytypes/", format="json")

        self.assertEqual(response.status_code, 200)

    def test_update_entity_type(self):
        self.client.force_authenticate(self.yoda)

        post_payload = {
            "name": "New Entity Type_test",
            "reference_form": self.form_1.id,
            "account": self.yoda.iaso_profile.account.pk,
        }

        self.client.post("/api/entitytypes/", data=post_payload, format="json")

        patch_payload = {
            "name": "New Entity Type_test_2",
            "reference_form": self.form_1.id,
            "account": self.yoda.iaso_profile.account.pk,
        }

        response = self.client.patch(
            "/api/entitytypes/{0}/".format(EntityType.objects.last().pk), data=patch_payload, format="json"
        )
        print(response.json())
        self.assertEqual(response.status_code, 200)

    def test_entity_type_are_unique_per_account(self):
        self.client.force_authenticate(self.yoda)

        EntityType.objects.create(
            name="beneficiary", reference_form=self.form_1, account=self.yoda.iaso_profile.account
        )

        payload = {
            "name": "beneficiary",
            "reference_form": self.form_1.id,
            "account": self.yoda.iaso_profile.account.pk,
        }

        response = self.client.post("/api/entitytypes/", data=payload, format="json")

        print(response.json())

        self.assertEqual(response.status_code, 400)

    def test_entity_types_are_multitenancy(self):

        self.client.force_authenticate(self.yoda)
        EntityType.objects.create(
            name="beneficiary", reference_form=self.form_1, account=self.yoda.iaso_profile.account
        )

        payload = {"name": "beneficiary", "reference_form": self.form_1.id, "account": self.the_gang.pk}

        response = self.client.post("/api/entitytypes/", data=payload, format="json")
        get_response = self.client.get("/api/entitytypes/")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(get_response.json()), 1)
