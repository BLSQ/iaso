from django.core.files import File
from unittest import mock


from iaso import models as m
from iaso.models import EntityType, Instance, Entity
from iaso.test import APITestCase


class EntityTypesAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")

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

    def test_create_single_entity(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", defining_form=self.form_1)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
        )

        payload = {"name": "New Client", "entity_type": entity_type.pk, "attributes": instance.pk}

        response = self.client.post("/api/entity/", data=payload, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_create_multiples_entity(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", defining_form=self.form_1)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
        )

        second_instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
        )

        payload = {"name": "New Client", "entity_type": entity_type.pk, "attributes": instance.pk}, {
            "name": "New Client 2",
            "entity_type": entity_type.pk,
            "attributes": second_instance.pk,
        }

        response = self.client.post("/api/entity/", data=payload, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)

    def test_create_entity_same_attributes(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", defining_form=self.form_1)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
        )

        payload = {"name": "New Client", "entity_type": entity_type.pk, "attributes": instance.pk}, {
            "name": "New Client 2",
            "entity_type": entity_type.pk,
            "attributes": instance.pk,
        }

        response = self.client.post("/api/entity/", data=payload, format="json")

        self.assertEqual(response.status_code, 409)

    def test_retrieve_entity(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", defining_form=self.form_1)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
        )

        second_instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
        )

        payload = {"name": "New Client", "entity_type": entity_type.pk, "attributes": instance.pk}, {
            "name": "New Client 2",
            "entity_type": entity_type.pk,
            "attributes": second_instance.pk,
        }

        self.client.post("/api/entity/", data=payload, format="json")

        response = self.client.get("/api/entity/", format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)

    def test_get_entity_by_id(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", defining_form=self.form_1)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
        )

        payload = {"name": "New Client", "entity_type": entity_type.pk, "attributes": instance.pk}

        self.client.post("/api/entity/", data=payload, format="json")

        response = self.client.get("/api/entity/{0}/".format(Entity.objects.last().pk, format="json"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], Entity.objects.last().pk)

    def test_handle_wrong_attributes(self):
        self.client.force_authenticate(self.yoda)
        entity_type = EntityType.objects.create(name="Type 1", defining_form=self.form_1)

        payload = {"name": "New Client", "entity_type": entity_type.pk, "attributes": 2324}

        response = self.client.post("/api/entity/", data=payload, format="json")

        self.assertEqual(response.status_code, 404)

    def test_update_entity(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", defining_form=self.form_1)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
        )

        payload_post = {"name": "New Client", "entity_type": entity_type.pk, "attributes": instance.pk}

        self.client.post("/api/entity/", data=payload_post, format="json")

        payload = {"name": "New Client-2", "entity_type": entity_type.pk, "attributes": instance.pk}

        response = self.client.patch("/api/entity/{0}/".format(Entity.objects.last().pk), data=payload, format="json")

        self.assertEqual(response.status_code, 200)
