import time_machine

from django.contrib.gis.geos import Polygon, MultiPolygon, Point
from django.core.cache import cache

from iaso.api.query_params import APP_ID, LIMIT, PAGE
from iaso.models import (
    Account,
    DataSource,
    FeatureFlag,
    Form,
    Group,
    Instance,
    OrgUnit,
    OrgUnitReferenceInstance,
    OrgUnitType,
    Project,
    SourceVersion,
)
from iaso.test import APITestCase

BASE_URL = "/api/mobile/orgunits/"
BOUNDINGXBOX_URL = "/api/mobile/orgunits/boundingbox/"
BASE_APP_ID = "dragon.ball.saiyans"


class MobileOrgUnitAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = account = Account.objects.create(name="Dragon Ball")
        cls.project = project = Project.objects.create(name="Saiyans", app_id=BASE_APP_ID, account=account)
        cls.user = user = cls.create_user_with_profile(username="user", account=account, permissions=["iaso_org_units"])
        cls.sw_source = sw_source = DataSource.objects.create(name="Vegeta Planet")
        sw_source.projects.add(project)
        cls.sw_version_1 = sw_version_1 = SourceVersion.objects.create(data_source=sw_source, number=1)
        cls.sw_version_2 = sw_version_2 = SourceVersion.objects.create(data_source=sw_source, number=2)
        sw_version = sw_version_2
        account.default_version = sw_version
        account.save()

        cls.group_1 = Group.objects.create(name="Old parent", source_version=sw_version_1)
        cls.group_2 = group_2 = Group.objects.create(name="Parent", source_version=sw_version_2)

        cls.warriors = warriors = OrgUnitType.objects.create(name="Warriors")
        warriors.projects.add(project)

        cls.super_saiyans = super_saiyans = OrgUnitType.objects.create(name="Super Saiyans")
        super_saiyans.projects.add(project)
        warriors.sub_unit_types.add(super_saiyans)

        cls.on_earth = on_earth = OrgUnitType.objects.create(name="Born on Earth")
        on_earth.projects.add(project)
        super_saiyans.sub_unit_types.add(on_earth)

        cls.raditz = raditz = OrgUnit.objects.create(
            uuid="702dbae8-0f47-4065-ad0c-b2557f31cc96",
            org_unit_type=super_saiyans,
            version=sw_version,
            name="Raditz",
            validation_status=OrgUnit.VALIDATION_VALID,
        )

        cls.bardock = bardock = OrgUnit.objects.create(
            parent=None,
            org_unit_type=warriors,
            version=sw_version,
            name="Bardock",
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=MultiPolygon(Polygon([(1, 2), (3, 4), (5, 6), (1, 2)])),
        )

        raditz.parent = bardock
        raditz.save()

        # bardock
        #  -goku
        #    - gohan
        #    - goten

        cls.goku = goku = OrgUnit.objects.create(
            parent=bardock,
            org_unit_type=super_saiyans,
            version=sw_version,
            name="Son Goku",
            validation_status=OrgUnit.VALIDATION_REJECTED,
        )

        cls.gohan = OrgUnit.objects.create(
            parent=goku,
            org_unit_type=on_earth,
            version=sw_version,
            name="Son Gohan",
            validation_status=OrgUnit.VALIDATION_VALID,
        )

        cls.goten = OrgUnit.objects.create(
            parent=goku,
            org_unit_type=on_earth,
            version=sw_version,
            name="Son Goten",
            validation_status=OrgUnit.VALIDATION_VALID,
            location=Point(-4, -5, 0),
        )

        group_2.org_units.set([bardock, goku])
        user.iaso_profile.org_units.set([raditz, goku])

    def test_org_unit_have_correct_parent_id_without_limit(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(BASE_URL, data={APP_ID: BASE_APP_ID})
        self.assertJSONResponse(response, 200)
        self.assertEqual([self.raditz.id, self.goku.id], response.json()["roots"])
        self.assertNotIn("count", response.json())
        self.assertNotIn("next", response.json())
        self.assertNotIn("previous", response.json())
        self.assertEqual(len(response.json()["orgUnits"]), 4)
        self.assertEqual(response.json()["orgUnits"][0]["name"], "Bardock")
        self.assertEqual(response.json()["orgUnits"][0]["parent_id"], None)
        self.assertEqual(1, len(response.json()["orgUnits"][0]["groups"]))
        self.assertEqual(response.json()["orgUnits"][0]["groups"][0], self.group_2.id)
        self.assertEqual(response.json()["orgUnits"][1]["name"], "Raditz")
        self.assertEqual(response.json()["orgUnits"][1]["parent_id"], self.bardock.id)
        self.assertEqual(0, len(response.json()["orgUnits"][1]["groups"]))
        self.assertEqual(response.json()["orgUnits"][2]["name"], "Son Gohan")
        self.assertEqual(response.json()["orgUnits"][2]["parent_id"], None)
        self.assertEqual(0, len(response.json()["orgUnits"][2]["groups"]))
        self.assertEqual(response.json()["orgUnits"][3]["name"], "Son Goten")
        self.assertEqual(response.json()["orgUnits"][3]["parent_id"], None)
        self.assertEqual(0, len(response.json()["orgUnits"][3]["groups"]))

    def test_org_unit_have_correct_parent_id_with_limit(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(BASE_URL, data={APP_ID: BASE_APP_ID, LIMIT: 1, PAGE: 1})
        self.assertJSONResponse(response, 200)
        self.assert_page(response.json(), count=4, limit=1, page=1, pages=4, has_next=True, has_previous=False)
        self.assertEqual([self.raditz.id, self.goku.id], response.json()["roots"])
        self.assertEqual(len(response.json()["orgUnits"]), 1)
        self.assertEqual(response.json()["orgUnits"][0]["name"], "Bardock")
        self.assertEqual(response.json()["orgUnits"][0]["parent_id"], None)

        response = self.client.get(BASE_URL, data={APP_ID: BASE_APP_ID, LIMIT: 1, PAGE: 2})
        self.assertJSONResponse(response, 200)
        self.assert_page(response.json(), count=4, limit=1, page=2, pages=4, has_next=True, has_previous=True)
        self.assertNotIn("roots", response.json())
        self.assertEqual(len(response.json()["orgUnits"]), 1)
        self.assertEqual(response.json()["orgUnits"][0]["name"], "Raditz")
        self.assertEqual(response.json()["orgUnits"][0]["parent_id"], self.bardock.id)

        response = self.client.get(BASE_URL, data={APP_ID: BASE_APP_ID, LIMIT: 2, PAGE: 2})
        self.assertJSONResponse(response, 200)
        self.assert_page(response.json(), count=4, limit=2, page=2, pages=2, has_next=False, has_previous=True)
        self.assertNotIn("roots", response.json())
        self.assertEqual(len(response.json()["orgUnits"]), 2)
        self.assertEqual(response.json()["orgUnits"][0]["name"], "Son Gohan")
        self.assertEqual(response.json()["orgUnits"][0]["parent_id"], None)
        self.assertEqual(response.json()["orgUnits"][1]["name"], "Son Goten")
        self.assertEqual(response.json()["orgUnits"][1]["parent_id"], None)
        self.assertNotIn("geojson", response.json()["orgUnits"][1])

    def assert_page(self, json, count: int, limit: int, page: int, pages: int, has_next: bool, has_previous: bool):
        self.assertEqual(json["count"], count)
        self.assertEqual(json["limit"], limit)
        self.assertEqual(json["page"], page)
        self.assertEqual(json["pages"], pages)
        self.assertEqual(json["has_next"], has_next)
        self.assertEqual(json["has_previous"], has_previous)

    def test_org_unit_have_correct_parent_id_without_limit_with_shape(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(BASE_URL, data={APP_ID: BASE_APP_ID, "shapes": "true"}, format="json")
        self.assertJSONResponse(response, 200)
        self.assertEqual([self.raditz.id, self.goku.id], response.json()["roots"])
        self.assertNotIn("count", response.json())
        self.assertNotIn("next", response.json())
        self.assertNotIn("previous", response.json())
        self.assertEqual(len(response.json()["orgUnits"]), 4)
        self.assertEqual(response.json()["orgUnits"][0]["name"], "Bardock")
        self.assertEqual(response.json()["orgUnits"][0]["parent_id"], None)
        self.assertEqual(
            response.json()["orgUnits"][0]["geo_json"],
            {"type": "MultiPolygon", "coordinates": [[[[1, 2], [3, 4], [5, 6], [1, 2]]]]},
        )
        self.assertEqual(response.json()["orgUnits"][1]["name"], "Raditz")
        self.assertEqual(response.json()["orgUnits"][1]["parent_id"], self.bardock.id)
        self.assertEqual(response.json()["orgUnits"][1]["geo_json"], None)

    def test_LIMIT_OU_DOWNLOAD_TO_ROOTS(self):
        self.user.iaso_profile.org_units.set([self.goku])
        self.goku.validation_status = OrgUnit.VALIDATION_VALID
        self.goku.save()
        self.client.force_authenticate(self.user)
        response = self.client.get(BASE_URL, data={APP_ID: BASE_APP_ID})
        j = self.assertJSONResponse(response, 200)
        # set limit on user

        self.assertEqual([self.goku.id], j["roots"])
        self.assertNotIn("count", j)
        self.assertNotIn("next", j)
        self.assertNotIn("previous", j)
        self.assertEqual(len(j["orgUnits"]), 5)

        ff, _created = FeatureFlag.objects.get_or_create(
            code=FeatureFlag.LIMIT_OU_DOWNLOAD_TO_ROOTS
        )  # created via migrations
        self.project.feature_flags.add(ff)
        cache.clear()  # to fix cache don't clear when the feature flags are modified
        self.client.force_authenticate(self.user)
        response = self.client.get(BASE_URL, data={APP_ID: BASE_APP_ID})
        j = self.assertJSONResponse(response, 200)
        self.assertEqual([self.goku.id], j["roots"])
        self.assertNotIn("count", j)
        self.assertNotIn("next", j)
        self.assertNotIn("previous", j)
        self.assertEqual(len(j["orgUnits"]), 3)

    def test_boundingbox(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(BOUNDINGXBOX_URL, data={APP_ID: BASE_APP_ID})
        j = self.assertJSONResponse(response, 200)

        bbox = j["results"][0]
        self.assertEqual(bbox, {"east": -5.024, "northern": 1.0, "south": -3.976, "west": 6.0})

    def test_boundingbox_with_user_limit(self):
        ff, _created = FeatureFlag.objects.get_or_create(
            code=FeatureFlag.LIMIT_OU_DOWNLOAD_TO_ROOTS
        )  # created via migrations
        self.project.feature_flags.add(ff)
        cache.clear()  # to fix cache don't clear when the feature flags are modified
        self.user.iaso_profile.org_units.set([self.goten])
        self.client.force_authenticate(self.user)
        response = self.client.get(BOUNDINGXBOX_URL, data={APP_ID: BASE_APP_ID})
        j = self.assertJSONResponse(response, 200)
        # set limit on user
        bbox = j["results"][0]
        self.assertEqual(bbox, {"east": -5.024, "northern": -4.024, "south": -3.976, "west": -4.976})

    @time_machine.travel("2023-10-26T09:00:00.000Z", tick=False)
    def test_reference_instances(self):
        form1 = Form.objects.create(name="Form 1")
        form2 = Form.objects.create(name="Form 2")
        instance1 = Instance.objects.create(form=form1, org_unit=self.raditz, json={"key": "foo"})
        instance2 = Instance.objects.create(form=form2, org_unit=self.raditz, json={"key": "bar"})
        # Mark instances as reference instances.
        OrgUnitReferenceInstance.objects.create(org_unit=self.raditz, instance=instance1, form=form1)
        OrgUnitReferenceInstance.objects.create(org_unit=self.raditz, instance=instance2, form=form2)

        self.client.force_authenticate(self.user)

        params = {APP_ID: BASE_APP_ID, "limit": 10}

        # Fetch OrgUnit by ID.
        response1 = self.client.get(f"{BASE_URL}{self.raditz.pk}/reference_instances/", data=params)
        self.assertJSONResponse(response1, 200)

        # Fetch OrgUnit by UUID.
        response2 = self.client.get(f"{BASE_URL}{self.raditz.uuid}/reference_instances/", data=params)
        self.assertJSONResponse(response2, 200)

        self.assertEqual(response1.data, response2.data)
        self.assertEqual(
            response1.data,
            {
                "count": 2,
                "orgUnits": [
                    {
                        "org_unit_id": self.raditz.pk,
                        "org_unit_uuid": "702dbae8-0f47-4065-ad0c-b2557f31cc96",
                        "id": instance1.pk,
                        "uuid": None,
                        "form_id": form1.id,
                        "form_version_id": None,
                        "created_at": "2023-10-26T09:00:00Z",
                        "updated_at": "2023-10-26T09:00:00Z",
                        "json": {"key": "foo"},
                    },
                    {
                        "org_unit_id": self.raditz.pk,
                        "org_unit_uuid": "702dbae8-0f47-4065-ad0c-b2557f31cc96",
                        "id": instance2.pk,
                        "uuid": None,
                        "form_id": form2.id,
                        "form_version_id": None,
                        "created_at": "2023-10-26T09:00:00Z",
                        "updated_at": "2023-10-26T09:00:00Z",
                        "json": {"key": "bar"},
                    },
                ],
                "has_next": False,
                "has_previous": False,
                "page": 1,
                "pages": 1,
                "limit": 10,
            },
        )
