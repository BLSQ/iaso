from iaso.api.query_params import APP_ID, LIMIT, PAGE
from iaso.models import Account, OrgUnit, OrgUnitType, Project, SourceVersion, DataSource
from iaso.test import APITestCase

BASE_URL = "/api/mobile/orgunits/"


class MobileOrgUnitAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = account = Account.objects.create(name="Dragon Ball")
        cls.project = project = Project.objects.create(name="Saiyans", app_id="dragon.ball.saiyans", account=account)
        cls.user = user = cls.create_user_with_profile(username="user", account=account, permissions=["iaso_org_units"])
        cls.sw_source = sw_source = DataSource.objects.create(name="Vegeta Planet")
        sw_source.projects.add(project)
        cls.sw_version = sw_version = SourceVersion.objects.create(data_source=sw_source, number=1)
        account.default_version = sw_version
        account.save()

        cls.warriors = warriors = OrgUnitType.objects.create(name="Warriors")
        warriors.projects.add(project)

        cls.super_saiyans = super_saiyans = OrgUnitType.objects.create(name="Super Saiyans")
        super_saiyans.projects.add(project)
        warriors.sub_unit_types.add(super_saiyans)

        cls.on_earth = on_earth = OrgUnitType.objects.create(name="Born on Earth")
        on_earth.projects.add(project)
        super_saiyans.sub_unit_types.add(on_earth)

        cls.raditz = raditz = OrgUnit.objects.create(
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
        )

        raditz.parent = bardock
        raditz.save()

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
        )

        user.iaso_profile.org_units.set([raditz, goku])

    def test_org_unit_have_correct_parent_id_without_limit(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(BASE_URL, data={APP_ID: "dragon.ball.saiyans"})
        self.assertJSONResponse(response, 200)
        self.assertEqual([self.raditz.id, self.goku.id], response.json()["roots"])
        self.assertNotIn("count", response.json())
        self.assertNotIn("next", response.json())
        self.assertNotIn("previous", response.json())
        self.assertEqual(len(response.json()["orgUnits"]), 4)
        self.assertEqual(response.json()["orgUnits"][0]["name"], "Bardock")
        self.assertEqual(response.json()["orgUnits"][0]["parent_id"], None)
        self.assertEqual(response.json()["orgUnits"][1]["name"], "Raditz")
        self.assertEqual(response.json()["orgUnits"][1]["parent_id"], self.bardock.id)
        self.assertEqual(response.json()["orgUnits"][2]["name"], "Son Gohan")
        self.assertEqual(response.json()["orgUnits"][2]["parent_id"], None)
        self.assertEqual(response.json()["orgUnits"][3]["name"], "Son Goten")
        self.assertEqual(response.json()["orgUnits"][3]["parent_id"], None)

    def test_org_unit_have_correct_parent_id_with_limit(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(BASE_URL, data={APP_ID: "dragon.ball.saiyans", LIMIT: 1, PAGE: 1})
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.json()["count"], 4)
        self.assertEqual(response.json()["next"], 2)
        self.assertEqual(response.json()["previous"], None)
        self.assertEqual([self.raditz.id, self.goku.id], response.json()["roots"])
        self.assertEqual(len(response.json()["orgUnits"]), 1)
        self.assertEqual(response.json()["orgUnits"][0]["name"], "Bardock")
        self.assertEqual(response.json()["orgUnits"][0]["parent_id"], None)

        response = self.client.get(BASE_URL, data={APP_ID: "dragon.ball.saiyans", LIMIT: 1, PAGE: 2})
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.json()["count"], 4)
        self.assertEqual(response.json()["next"], 3)
        self.assertEqual(response.json()["previous"], 1)
        self.assertNotIn("roots", response.json())
        self.assertEqual(len(response.json()["orgUnits"]), 1)
        self.assertEqual(response.json()["orgUnits"][0]["name"], "Raditz")
        self.assertEqual(response.json()["orgUnits"][0]["parent_id"], self.bardock.id)

        response = self.client.get(BASE_URL, data={APP_ID: "dragon.ball.saiyans", LIMIT: 2, PAGE: 2})
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.json()["count"], 4)
        self.assertEqual(response.json()["next"], None)
        self.assertEqual(response.json()["previous"], 1)
        self.assertNotIn("roots", response.json())
        self.assertEqual(len(response.json()["orgUnits"]), 2)
        self.assertEqual(response.json()["orgUnits"][0]["name"], "Son Gohan")
        self.assertEqual(response.json()["orgUnits"][0]["parent_id"], None)
        self.assertEqual(response.json()["orgUnits"][1]["name"], "Son Goten")
        self.assertEqual(response.json()["orgUnits"][1]["parent_id"], None)
