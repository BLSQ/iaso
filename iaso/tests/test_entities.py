import uuid
from unittest import mock

from django.core.files import File

from iaso import models as m
from iaso.models import EntityType, Instance, Entity
from iaso.test import APITestCase


class EntityAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")
        cls.star_wars = star_wars

        space_balls = m.Account.objects.create(name="Space Balls")

        sw_source = m.DataSource.objects.create(name="Galactic Empire")
        cls.sw_source = sw_source
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version
        star_wars.save()
        cls.sw_version = sw_version

        cls.yop_solo = cls.create_user_with_profile(
            username="yop solo", account=space_balls, permissions=["iaso_submissions"]
        )

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_submissions"])

        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")

        cls.jedi_council_corruscant = m.OrgUnit.objects.create(name="Coruscant Jedi Council")

        cls.project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )

        cls.form_1 = m.Form.objects.create(name="Hydroponics study", period_type=m.MONTH, single_per_period=True)

        cls.create_form_instance(
            form=cls.form_1, period="202001", org_unit=cls.jedi_council_corruscant, project=cls.project, uuid=uuid.uuid4
        )
        cls.create_form_instance(
            form=cls.form_1, period="202002", org_unit=cls.jedi_council_corruscant, project=cls.project, uuid=uuid.uuid4
        )
        cls.create_form_instance(
            form=cls.form_1, period="202002", org_unit=cls.jedi_council_corruscant, project=cls.project, uuid=uuid.uuid4
        )
        cls.create_form_instance(
            form=cls.form_1, period="202003", org_unit=cls.jedi_council_corruscant, project=cls.project, uuid=uuid.uuid4
        )

        # form_2_file_mock = mock.MagicMock(spec=File)
        # form_2_file_mock.name = "test.xml"
        # cls.form_2.form_versions.create(file=form_2_file_mock, version_id="2020022401")
        # cls.form_2.org_unit_types.add(cls.jedi_council)
        # cls.create_form_instance(form=cls.form_2, period="202001", org_unit=cls.jedi_council_corruscant)
        # cls.form_2.save()
        #
        # # Instance saved without period
        # cls.form_3.form_versions.create(file=form_2_file_mock, version_id="2020022401")
        # cls.form_3.org_unit_types.add(cls.jedi_council)
        # cls.create_form_instance(form=cls.form_3, org_unit=cls.jedi_council_corruscant)
        # cls.form_3.save()
        #
        # # A deleted Instance
        # cls.form_4.form_versions.create(file=form_2_file_mock, version_id="2020022402")
        # cls.form_4.org_unit_types.add(cls.jedi_council)
        # cls.create_form_instance(form=cls.form_4, period="2020Q1", org_unit=cls.jedi_council_corruscant, deleted=True)
        # cls.form_4.save()
        #
        # cls.project.unit_types.add(cls.jedi_council)
        # cls.project.forms.add(cls.form_1)
        # cls.project.forms.add(cls.form_2)
        # cls.project.forms.add(cls.form_3)
        # cls.project.forms.add(cls.form_4)
        # sw_source.projects.add(cls.project)
        # cls.project.save()

    def test_create_single_entity(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
        )

        payload = {
            "name": "New Client",
            "entity_type": entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }

        response = self.client.post("/api/entity/", data=payload, format="json")

        self.assertEqual(response.status_code, 200)

    def test_create_multiples_entity(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant, form=self.form_1, period="202002", uuid=uuid.uuid4()
        )

        second_instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant, form=self.form_1, period="202002", uuid=uuid.uuid4()
        )

        payload = {
            "name": "New Client",
            "entity_type": entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }, {
            "name": "New Client 2",
            "entity_type": entity_type.pk,
            "attributes": second_instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }

        response = self.client.post("/api/entity/bulk_create/", data=payload, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)

    def test_create_entity_same_attributes(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant, form=self.form_1, period="202002", uuid=uuid.uuid4()
        )

        payload = {
            "name": "New Client",
            "entity_type": entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }, {
            "name": "New Client 2",
            "entity_type": entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }

        response = self.client.post("/api/entity/bulk_create/", data=payload, format="json")

        self.assertEqual(response.status_code, 400)

    def test_retrieve_entity(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1, account=self.star_wars)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant, form=self.form_1, period="202002", uuid=uuid.uuid4()
        )

        second_instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant, form=self.form_1, period="202002", uuid=uuid.uuid4()
        )

        payload = {
            "name": "New Client",
            "entity_type": entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }, {
            "name": "New Client 2",
            "entity_type": entity_type.pk,
            "attributes": second_instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }

        self.client.post("/api/entity/bulk_create/", data=payload, format="json")

        response = self.client.get("/api/entity/", format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)

    def test_get_entity_by_id(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
        )

        payload = {
            "name": "New Client",
            "entity_type": entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }

        self.client.post("/api/entity/", data=payload, format="json")

        response = self.client.get("/api/entity/{0}/".format(Entity.objects.last().pk, format="json"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], Entity.objects.last().pk)

    def test_handle_wrong_attributes(self):
        self.client.force_authenticate(self.yoda)
        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1)

        payload = {
            "name": "New Client",
            "entity_type": entity_type.pk,
            "attributes": 2324,
            "account": self.yoda.iaso_profile.account.pk,
        }

        response = self.client.post("/api/entity/", data=payload, format="json")

        self.assertEqual(response.status_code, 404)

    def test_update_entity(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant, form=self.form_1, period="202002", uuid=uuid.uuid4()
        )

        payload_post = {
            "name": "New Client",
            "entity_type": entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }

        self.client.post("/api/entity/", data=payload_post, format="json")

        payload = {"name": "New Client-2", "entity_type": entity_type.pk, "attributes": instance.pk}

        response = self.client.patch("/api/entity/{0}/".format(Entity.objects.last().pk), data=payload, format="json")

        self.assertEqual(response.status_code, 200)

    def test_retrieve_only_non_deleted_entity(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1, account=self.star_wars)

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant, form=self.form_1, period="202002", uuid=uuid.uuid4()
        )

        second_instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant, form=self.form_1, period="202002", uuid=uuid.uuid4()
        )

        payload = {
            "name": "New Client",
            "entity_type": entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }, {
            "name": "New Client 2",
            "entity_type": entity_type.pk,
            "attributes": second_instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }

        self.client.post("/api/entity/bulk_create/", data=payload, format="json")
        self.client.delete("/api/entity/{0}/".format(Entity.objects.last().pk), format="json")

        response = self.client.get("/api/entity/", format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 1)

    def test_cant_create_entity_without_attributes(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1)

        payload = {
            "name": "New Client",
            "entity_type": entity_type.pk,
            "attributes": None,
            "account": self.yoda.iaso_profile.account.pk,
        }

        response = self.client.post("/api/entity/", data=payload, format="json")

        self.assertEqual(response.status_code, 404)

    def test_retrieve_entity_only_same_account(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="Type 1", reference_form=self.form_1, account=self.star_wars)

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

        Entity.objects.create(
            name="New Client",
            entity_type=entity_type,
            attributes=instance,
            account=self.yop_solo.iaso_profile.account,
        )

        Entity.objects.create(
            name="New Client",
            entity_type=entity_type,
            attributes=second_instance,
            account=self.yoda.iaso_profile.account,
        )

        response = self.client.get("/api/entity/", format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 1)

    def test_export_entity(self):
        self.client.force_authenticate(self.yoda)
        entity_type = EntityType.objects.create(
            name="Type 1",
            reference_form=self.form_1,
            fields_detail_info_view=["something", "else"],
            fields_list_view=["something", "else"],
        )

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

        Entity.objects.create(
            name="New Client",
            entity_type=entity_type,
            attributes=instance,
            account=self.yop_solo.iaso_profile.account,
        )

        Entity.objects.create(
            name="New Client",
            entity_type=entity_type,
            attributes=second_instance,
            account=self.yoda.iaso_profile.account,
        )

        # export all entities type as csv
        response = self.client.get("/api/entity/?csv=true/")
        self.assertEqual(response.status_code, 200)
        self.assertEquals(response.get("Content-Disposition"), "attachment; filename=NEW CLIENT_ENTITY.csv")

        # export all entities type as xlsx
        response = self.client.get("/api/entity/?xlsx=true/")
        self.assertEqual(response.status_code, 200)
        self.assertEquals(response.get("Content-Disposition"), "attachment; filename=NEW CLIENT_ENTITY.xlsx")

        # export specific entity type as xlsx
        response = self.client.get(f"/api/entity/?entity_type_ids={entity_type.pk}&xlsx=true/")
        self.assertEqual(response.status_code, 200)
        self.assertEquals(response.get("Content-Disposition"), "attachment; filename=NEW CLIENT_ENTITY.xlsx")

        # export specific entity type as csv
        response = self.client.get(f"/api/entity/?entity_type_ids={entity_type.pk}&csv=true/")
        self.assertEqual(response.status_code, 200)
        self.assertEquals(response.get("Content-Disposition"), "attachment; filename=NEW CLIENT_ENTITY.csv")

    def test_handle_export_entity_type_empty_field_list(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(
            name="Type 1",
            reference_form=self.form_1,
        )

        instance = Instance.objects.create(
            org_unit=self.jedi_council_corruscant,
            form=self.form_1,
            period="202002",
        )

        Entity.objects.create(
            name="New Client",
            entity_type=entity_type,
            attributes=instance,
            account=self.yop_solo.iaso_profile.account,
        )

        response = self.client.get("/api/entity/?xlsx=true/")
        self.assertEqual(response.status_code, 200)
