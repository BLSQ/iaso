import datetime
import logging

import time_machine

from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.core.cache import cache
from django.db.models import Q
from django.utils import timezone
from rest_framework import status

from iaso.api.org_units.pagination import SHAPE_RESULTS_MAX
from iaso.api.query_params import APP_ID, IDS, LIMIT, PAGE
from iaso.models import (
    Account,
    DataSource,
    FeatureFlag,
    Form,
    FormVersion,
    Group,
    Instance,
    InstanceFile,
    MissionForm,
    MissionOrgUnitType,
    OrgUnit,
    OrgUnitReferenceInstance,
    OrgUnitType,
    Planning,
    Project,
    SourceVersion,
    Team,
)
from iaso.permissions.core_permissions import CORE_ORG_UNITS_PERMISSION
from iaso.test import APITestCase


BASE_URL = "/api/mobile/orgunits/"
BOUNDINGXBOX_URL = "/api/mobile/orgunits/boundingbox/"
BASE_APP_ID = "dragon.ball.saiyans"


class MobileOrgUnitAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.account = account = Account.objects.create(name="Dragon Ball")
        cls.account2 = account2 = Account.objects.create(name="Saint Seiya")
        cls.project = project = Project.objects.create(
            name="Saiyans",
            app_id=BASE_APP_ID,
            account=account,
            needs_authentication=True,
        )
        cls.project2 = project2 = Project.objects.create(
            name="Nameks",
            app_id="dragon.ball.nameks",
            account=account,
            needs_authentication=False,
        )
        cls.project_other_account = Project.objects.create(
            name="project_other_account",
            app_id="project.other.account",
            account=account2,
            needs_authentication=False,
        )
        cls.user = user = cls.create_user_with_profile(
            username="user", account=account, permissions=[CORE_ORG_UNITS_PERMISSION]
        )
        cls.user2 = cls.create_user_with_profile(
            username="user2", account=account2, permissions=[CORE_ORG_UNITS_PERMISSION]
        )

        cls.team = Team.objects.create(project=cls.project, name="team1", manager=user)
        cls.team2 = Team.objects.create(project=cls.project2, name="team2", manager=cls.user2)

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

        cls.nameks = nameks = OrgUnitType.objects.create(name="Nameks")
        nameks.projects.add(project2)

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

        # creating missions

        # out

        cls.out = OrgUnitType.objects.create(name="out")
        cls.out_2 = OrgUnitType.objects.create(name="out2")
        cls.out_3 = OrgUnitType.objects.create(name="out2")

        cls.out.projects.add(cls.project)
        cls.out_2.projects.add(cls.project)

        # forms
        cls.form_1 = Form.objects.create(name="form_1")
        cls.form_2 = Form.objects.create(name="form_2")
        cls.form_3 = Form.objects.create(name="form_3")

        cls.form_1.projects.add(cls.project)
        cls.form_2.projects.add(cls.project)
        cls.form_3.projects.add(cls.project)

        # missions
        cls.mission_form_1 = MissionForm.objects.create(name="mission_form_1", account=cls.account)

        cls.mission_out_1 = MissionOrgUnitType.objects.create(
            name="mission_out_1", account=cls.account, org_unit_type=cls.out, min_cardinality=1, max_cardinality=3
        )
        cls.mission_soft_deleted = MissionOrgUnitType.objects.create(
            name="mission_out_soft_deleted",
            account=cls.account,
            org_unit_type=cls.out,
            min_cardinality=1,
            max_cardinality=3,
            deleted_at=timezone.now(),
        )
        cls.mission_out_2 = MissionOrgUnitType.objects.create(
            name="mission_out_2", account=cls.account2, org_unit_type=cls.out_2, min_cardinality=2, max_cardinality=4
        )

        # creating plannings
        cls.org_unit = OrgUnit.objects.create(name="ou")

        cls.planning = Planning.objects.create(
            name="Test Planning", project=cls.project, team=cls.team, org_unit=cls.org_unit
        )
        cls.soft_deleted_planning = Planning.objects.create(
            project=cls.project, team=cls.team, org_unit=cls.org_unit, deleted_at=timezone.now()
        )
        cls.other_account_planning = Planning.objects.create(
            name="Other planning", project=cls.project_other_account, team=cls.team2, org_unit=cls.org_unit
        )

    def setUp(self):
        super().setUp()
        logging.disable(logging.NOTSET)

    def tearDown(self):
        super().tearDown()
        logging.disable(logging.CRITICAL)

    def test_orgunits_list_without_auth_for_project_requiring_auth(self):
        """GET /mobile/orgunits/ without auth for project which requires it: 401"""

        response = self.client.get(BASE_URL, {APP_ID: self.project.app_id})
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_orgunits_list_with_wrong_auth_for_project_requiring_auth(self):
        """GET /mobile/orgunits/ with wrong auth for project which requires it: 401"""

        self.client.force_authenticate(user=self.user2)
        response = self.client.get(BASE_URL, {APP_ID: self.project.app_id})
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_orgunits_list_with_auth_for_project_requiring_auth(self):
        """GET /mobile/orgunits/ with auth for project which requires it: 200"""

        self.client.force_authenticate(user=self.user)
        response = self.client.get(BASE_URL, {APP_ID: self.project.app_id})
        self.assertJSONResponse(response, status.HTTP_200_OK)

    def test_orgunits_list_includes_code(self):
        self.bardock.code = "BARDOCK-01"
        self.bardock.save()

        self.client.force_authenticate(self.user)
        response = self.client.get(BASE_URL, data={APP_ID: BASE_APP_ID})
        self.assertJSONResponse(response, status.HTTP_200_OK)
        org_units_by_id = self.index_by_id(response.json()["orgUnits"])
        self.assertEqual(org_units_by_id[self.bardock.id]["code"], "BARDOCK-01")
        self.assertEqual(org_units_by_id[self.raditz.id]["code"], "")

    def test_org_unit_with_shapes_limited(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(BASE_URL, data={APP_ID: BASE_APP_ID, "shapes": True, "limit": 25000, "page": 1})
        self.assertEqual(response.json()["limit"], SHAPE_RESULTS_MAX)

        response = self.client.get(BASE_URL, data={APP_ID: BASE_APP_ID, "limit": 25000, "page": 1})

        self.assertEqual(response.json()["limit"], 25000)

    def test_org_unit_have_correct_parent_id_without_limit(self):
        self.client.force_authenticate(self.user)
        with self.assertNumQueries(14):
            # 1. SELECT "iaso_project" (permission / app lookup by app_id)
            # 2. SELECT "iaso_account"
            # 3. SELECT "iaso_orgunit" … profile roots (org_units M2M)
            # 4. SELECT "django_cache_table" (cache get)
            # 5. SELECT "iaso_project" LEFT JOIN "iaso_account" + "iaso_sourceversion"
            #    (Project.get_for_user_and_app_id — select_related avoids extra account/version queries)
            # 6. SELECT EXISTS "iaso_featureflag" (LIMIT_OU_DOWNLOAD_TO_ROOTS)
            # 7. SELECT "iaso_orgunit" … (main list + parent/org_unit_type joins for annotations)
            # 8. Prefetch org units → groups (M2M)
            # 9. Retrieve valid project unit type IDs (M2M via valid_org_unit_type_ids cached_property)
            # 10. SELECT COUNT(*) FROM "django_cache_table"
            # 11. SAVEPOINT (atomic cache write)
            # 12. SELECT "django_cache_table" (cache key)
            # 13. INSERT "django_cache_table"
            # 14. RELEASE SAVEPOINT
            response = self.client.get(BASE_URL, data={APP_ID: BASE_APP_ID})
        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual([self.raditz.id, self.goku.id], response_data["roots"])
        self.assertNotIn("count", response_data)
        self.assertNotIn("next", response_data)
        self.assertNotIn("previous", response_data)
        self.assert_parents_listed_before_children(response_data["orgUnits"])
        org_units = self.index_by_id(response_data["orgUnits"])
        self.assertCountEqual(org_units.keys(), [self.bardock.id, self.raditz.id, self.gohan.id, self.goten.id])

        bardock = org_units[self.bardock.id]
        self.assertEqual(bardock["name"], "Bardock")
        self.assertEqual(bardock["parent_id"], None)
        self.assertEqual(bardock["groups"], [self.group_2.id])

        raditz = org_units[self.raditz.id]
        self.assertEqual(raditz["name"], "Raditz")
        self.assertEqual(raditz["parent_id"], self.bardock.id)
        self.assertEqual(raditz["groups"], [])

        gohan = org_units[self.gohan.id]
        self.assertEqual(gohan["name"], "Son Gohan")
        self.assertEqual(gohan["parent_id"], None)  # parent (Goku) is not valid
        self.assertEqual(gohan["groups"], [])

        goten = org_units[self.goten.id]
        self.assertEqual(goten["name"], "Son Goten")
        self.assertEqual(goten["parent_id"], None)  # parent (Goku) is not valid
        self.assertEqual(goten["groups"], [])

    def test_org_unit_have_correct_parent_id_when_everything_is_fine_without_limit(self):
        self.goku.validation_status = OrgUnit.VALIDATION_VALID
        self.goku.save()
        self.client.force_authenticate(self.user)
        with self.assertNumQueries(14):
            # 1. SELECT "iaso_project" (permission / app lookup by app_id)
            # 2. SELECT "iaso_account"
            # 3. SELECT "iaso_orgunit" … profile roots (org_units M2M)
            # 4. SELECT "django_cache_table" (cache get)
            # 5. SELECT "iaso_project" LEFT JOIN "iaso_account" + "iaso_sourceversion"
            #    (Project.get_for_user_and_app_id — select_related avoids extra account/version queries)
            # 6. SELECT EXISTS "iaso_featureflag" (LIMIT_OU_DOWNLOAD_TO_ROOTS)
            # 7. SELECT "iaso_orgunit" … (main list + parent + org unit type)
            # 8. Prefetch org unit types → projects (M2M)
            # 9. Prefetch org units → groups
            # 10. SELECT COUNT(*) FROM "django_cache_table"
            # 11. SAVEPOINT (atomic cache write)
            # 12. SELECT "django_cache_table" (cache key)
            # 13. INSERT "django_cache_table"
            # 14. RELEASE SAVEPOINT
            response = self.client.get(BASE_URL, data={APP_ID: BASE_APP_ID})
        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual([self.raditz.id, self.goku.id], response_data["roots"])
        self.assertNotIn("count", response_data)
        self.assertNotIn("next", response_data)
        self.assertNotIn("previous", response_data)
        self.assert_parents_listed_before_children(response_data["orgUnits"])
        org_units = self.index_by_id(response_data["orgUnits"])
        self.assertCountEqual(
            org_units.keys(), [self.bardock.id, self.raditz.id, self.goku.id, self.gohan.id, self.goten.id]
        )

        bardock = org_units[self.bardock.id]
        self.assertEqual(bardock["name"], "Bardock")
        self.assertEqual(bardock["parent_id"], None)
        self.assertEqual(bardock["groups"], [self.group_2.id])

        raditz = org_units[self.raditz.id]
        self.assertEqual(raditz["name"], "Raditz")
        self.assertEqual(raditz["parent_id"], self.bardock.id)
        self.assertEqual(raditz["groups"], [])

        goku = org_units[self.goku.id]
        self.assertEqual(goku["name"], "Son Goku")
        self.assertEqual(goku["parent_id"], self.bardock.id)
        self.assertEqual(goku["groups"], [self.group_2.id])

        gohan = org_units[self.gohan.id]
        self.assertEqual(gohan["name"], "Son Gohan")
        self.assertEqual(gohan["parent_id"], self.goku.id)
        self.assertEqual(gohan["groups"], [])

        goten = org_units[self.goten.id]
        self.assertEqual(goten["name"], "Son Goten")
        self.assertEqual(goten["parent_id"], self.goku.id)
        self.assertEqual(goten["groups"], [])

    def test_org_unit_have_correct_parent_id_when_parent_wrong_type_without_limit(self):
        self.goku.validation_status = OrgUnit.VALIDATION_VALID
        self.goku.org_unit_type = self.nameks
        self.goku.save()
        self.client.force_authenticate(self.user)
        with self.assertNumQueries(14):
            # 1. SELECT "iaso_project" (permission / app lookup by app_id)
            # 2. SELECT "iaso_account"
            # 3. SELECT "iaso_orgunit" … profile roots (org_units M2M)
            # 4. SELECT "django_cache_table" (cache get)
            # 5. SELECT "iaso_project" LEFT JOIN "iaso_account" + "iaso_sourceversion"
            #    (Project.get_for_user_and_app_id — select_related avoids extra account/version queries)
            # 6. SELECT EXISTS "iaso_featureflag" (LIMIT_OU_DOWNLOAD_TO_ROOTS)
            # 7. SELECT "iaso_orgunit" … (main list + parent + org unit type)
            # 8. Prefetch org unit types → projects (M2M)
            # 9. Prefetch org units → groups
            # 10. SELECT COUNT(*) FROM "django_cache_table"
            # 11. SAVEPOINT (atomic cache write)
            # 12. SELECT "django_cache_table" (cache key)
            # 13. INSERT "django_cache_table"
            # 14. RELEASE SAVEPOINT
            response = self.client.get(BASE_URL, data={APP_ID: BASE_APP_ID})
        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual([self.raditz.id, self.goku.id], response_data["roots"])
        self.assertNotIn("count", response_data)
        self.assertNotIn("next", response_data)
        self.assertNotIn("previous", response_data)
        self.assert_parents_listed_before_children(response_data["orgUnits"])
        org_units = self.index_by_id(response_data["orgUnits"])
        self.assertCountEqual(org_units.keys(), [self.bardock.id, self.raditz.id, self.gohan.id, self.goten.id])

        bardock = org_units[self.bardock.id]
        self.assertEqual(bardock["name"], "Bardock")
        self.assertEqual(bardock["parent_id"], None)
        self.assertEqual(bardock["groups"], [self.group_2.id])

        raditz = org_units[self.raditz.id]
        self.assertEqual(raditz["name"], "Raditz")
        self.assertEqual(raditz["parent_id"], self.bardock.id)
        self.assertEqual(raditz["groups"], [])

        gohan = org_units[self.gohan.id]
        self.assertEqual(gohan["name"], "Son Gohan")
        self.assertEqual(gohan["parent_id"], None)  # parent (Goku) has the wrong org unit type
        self.assertEqual(gohan["groups"], [])

        goten = org_units[self.goten.id]
        self.assertEqual(goten["name"], "Son Goten")
        self.assertEqual(goten["parent_id"], None)  # parent (Goku) has the wrong org unit type
        self.assertEqual(goten["groups"], [])

    def test_org_unit_have_correct_parent_id_with_limit(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(BASE_URL, data={APP_ID: BASE_APP_ID, LIMIT: 1, PAGE: 1})
        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assert_page(response_data, count=4, limit=1, page=1, pages=4, has_next=True, has_previous=False)
        self.assertEqual([self.raditz.id, self.goku.id], response_data["roots"])
        self.assertEqual(len(response_data["orgUnits"]), 1)

        # Bardock is the only root: its path is a prefix of all the other paths, so it's always first
        bardock = response_data["orgUnits"][0]
        self.assertEqual(bardock["id"], self.bardock.id)
        self.assertEqual(bardock["name"], "Bardock")
        self.assertEqual(bardock["parent_id"], None)

        # The order of the next org units depends on their IDs (see `assert_parents_listed_before_children`),
        # so fetch all the pages and check the result as a whole.
        all_org_units = list(response_data["orgUnits"])
        for page in range(2, 5):
            response = self.client.get(BASE_URL, data={APP_ID: BASE_APP_ID, LIMIT: 1, PAGE: page})
            response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
            self.assert_page(response_data, count=4, limit=1, page=page, pages=4, has_next=page < 4, has_previous=True)
            self.assertNotIn("roots", response_data)
            self.assertEqual(len(response_data["orgUnits"]), 1)
            all_org_units += response_data["orgUnits"]

        # no duplicates and no missing org units across pages
        self.assertCountEqual(
            [org_unit["id"] for org_unit in all_org_units],
            [self.bardock.id, self.raditz.id, self.gohan.id, self.goten.id],
        )
        self.assert_parents_listed_before_children(all_org_units)
        org_units = self.index_by_id(all_org_units)
        self.assertEqual(org_units[self.raditz.id]["parent_id"], self.bardock.id)
        self.assertEqual(org_units[self.gohan.id]["parent_id"], None)  # parent (Goku) is not valid
        self.assertEqual(org_units[self.goten.id]["parent_id"], None)  # parent (Goku) is not valid
        for org_unit in all_org_units:
            self.assertNotIn("geojson", org_unit)

        # A different page size must return a consistent slice of the same ordering
        response = self.client.get(BASE_URL, data={APP_ID: BASE_APP_ID, LIMIT: 2, PAGE: 2})
        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assert_page(response_data, count=4, limit=2, page=2, pages=2, has_next=False, has_previous=True)
        self.assertNotIn("roots", response_data)
        self.assertEqual(
            [org_unit["id"] for org_unit in response_data["orgUnits"]],
            [org_unit["id"] for org_unit in all_org_units[2:4]],
        )

    def assert_page(self, json, count: int, limit: int, page: int, pages: int, has_next: bool, has_previous: bool):
        self.assertEqual(json["count"], count)
        self.assertEqual(json["limit"], limit)
        self.assertEqual(json["page"], page)
        self.assertEqual(json["pages"], pages)
        self.assertEqual(json["has_next"], has_next)
        self.assertEqual(json["has_previous"], has_previous)

    def index_by_id(self, org_units: list[dict]) -> dict[int, dict]:
        return {org_unit["id"]: org_unit for org_unit in org_units}

    def assert_parents_listed_before_children(self, org_units: list[dict], allow_missing_parent: bool = False):
        """
        The API orders org units by `path`, an ltree whose labels (org unit IDs) are compared as *text*
        (e.g. "100" < "99"). The relative order of siblings therefore depends on the IDs given by the DB sequence,
        which vary between test runs: tests must not rely on positions.
        The only guarantee is that a parent is always listed before its children.

        Org units whose `parent_id` is not in the list (e.g. `None` because the parent is invalid or has the wrong
        type) are ignored.
        """
        positions = {org_unit["id"]: index for index, org_unit in enumerate(org_units)}
        for org_unit in org_units:
            parent_id = org_unit["parent_id"]
            if parent_id in positions:
                self.assertLess(
                    positions[parent_id],
                    positions[org_unit["id"]],
                    f"Org unit {org_unit['id']} is listed before its parent {parent_id}",
                )
            elif parent_id and not allow_missing_parent:
                self.fail(
                    f"Org unit {org_unit['name']} ({org_unit['id']}) has parent_id {parent_id} which is not in the list of org units"
                )

    def test_org_unit_have_correct_parent_id_without_limit_with_shape(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(BASE_URL, data={APP_ID: BASE_APP_ID, "shapes": "true"}, format="json")
        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual([self.raditz.id, self.goku.id], response_data["roots"])
        self.assertNotIn("count", response_data)
        self.assertNotIn("next", response_data)
        self.assertNotIn("previous", response_data)
        self.assert_parents_listed_before_children(response_data["orgUnits"])
        org_units = self.index_by_id(response_data["orgUnits"])
        self.assertCountEqual(org_units.keys(), [self.bardock.id, self.raditz.id, self.gohan.id, self.goten.id])

        bardock = org_units[self.bardock.id]
        self.assertEqual(bardock["name"], "Bardock")
        self.assertEqual(bardock["parent_id"], None)
        self.assertEqual(
            bardock["geo_json"],
            {"type": "MultiPolygon", "coordinates": [[[[1, 2], [3, 4], [5, 6], [1, 2]]]]},
        )

        raditz = org_units[self.raditz.id]
        self.assertEqual(raditz["name"], "Raditz")
        self.assertEqual(raditz["parent_id"], self.bardock.id)
        self.assertEqual(raditz["geo_json"], None)

    def test_LIMIT_OU_DOWNLOAD_TO_ROOTS(self):
        self.user.iaso_profile.org_units.set([self.goku])
        self.goku.validation_status = OrgUnit.VALIDATION_VALID
        self.goku.save()
        self.client.force_authenticate(self.user)
        response = self.client.get(BASE_URL, data={APP_ID: BASE_APP_ID})
        j = self.assertJSONResponse(response, status.HTTP_200_OK)
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
        j = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual([self.goku.id], j["roots"])
        self.assertNotIn("count", j)
        self.assertNotIn("next", j)
        self.assertNotIn("previous", j)
        self.assertEqual(len(j["orgUnits"]), 3)

    def test_boundingbox(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(BOUNDINGXBOX_URL, data={APP_ID: BASE_APP_ID})
        j = self.assertJSONResponse(response, status.HTTP_200_OK)

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
        j = self.assertJSONResponse(response, status.HTTP_200_OK)
        # set limit on user
        bbox = j["results"][0]
        self.assertEqual(bbox, {"east": -5.024, "northern": -4.024, "south": -3.976, "west": -4.976})

    @time_machine.travel("2023-10-26T09:00:00.000Z", tick=False)
    def test_reference_instances(self):
        # Instance 1.
        form1 = Form.objects.create(name="Form 1")
        form_version1 = FormVersion.objects.create(form=form1, version_id=1)
        instance1 = Instance.objects.create(
            form=form1, org_unit=self.raditz, json={"key": "foo"}, form_version=form_version1
        )
        # Instance 2.
        form2 = Form.objects.create(name="Form 2")
        form_version2 = FormVersion.objects.create(form=form2, version_id=5)
        instance2 = Instance.objects.create(
            form=form2, org_unit=self.raditz, json={"key": "bar"}, form_version=form_version2
        )
        instance_file1 = InstanceFile.objects.create(instance=instance2, file="test1.jpg")
        # Instance 3. Form is soft-deleted
        form3 = Form.objects.create(name="Form 3", deleted_at=datetime.datetime.now(datetime.timezone.utc))
        form_version3 = FormVersion.objects.create(form=form3, version_id=9)
        instance3 = Instance.objects.create(
            form=form3, org_unit=self.raditz, json={"key": "foobar"}, form_version=form_version3
        )
        # Mark instances as reference instances.
        OrgUnitReferenceInstance.objects.create(org_unit=self.raditz, instance=instance1, form=form1)
        OrgUnitReferenceInstance.objects.create(org_unit=self.raditz, instance=instance2, form=form2)
        OrgUnitReferenceInstance.objects.create(org_unit=self.raditz, instance=instance3, form=form3)

        self.client.force_authenticate(self.user)

        params = {APP_ID: BASE_APP_ID}

        # Fetch OrgUnit by ID.
        response1 = self.client.get(f"{BASE_URL}{self.raditz.pk}/reference_instances/", data=params)
        response1_data = self.assertJSONResponse(response1, status.HTTP_200_OK)

        # Fetch OrgUnit by UUID.
        response2 = self.client.get(f"{BASE_URL}{self.raditz.uuid}/reference_instances/", data=params)
        response2_data = self.assertJSONResponse(response2, status.HTTP_200_OK)

        self.assertEqual(response1_data, response2_data)
        self.assertEqual(
            response1_data,
            {
                "count": 2,
                "instances": [
                    {
                        "id": instance1.pk,
                        "uuid": None,
                        "form_id": form1.id,
                        "form_version_id": form_version1.id,
                        "created_at": 1698310800.0,
                        "updated_at": 1698310800.0,
                        "json": {"key": "foo"},
                        "instance_files": [],
                    },
                    {
                        "id": instance2.pk,
                        "uuid": None,
                        "form_id": form2.id,
                        "form_version_id": form_version2.id,
                        "created_at": 1698310800.0,
                        "updated_at": 1698310800.0,
                        "json": {"key": "bar"},
                        "instance_files": [
                            {
                                "id": instance_file1.pk,
                                "instance_id": instance2.pk,
                                "file": "http://testserver/media/test1.jpg",
                                "created_at": 1698310800.0,
                                "file_type": "image/jpeg",
                                "name": None,
                                "submitted_at": 1698310800.0,
                                "org_unit": {
                                    "id": self.raditz.id,
                                    "name": self.raditz.name,
                                },
                                "form_name": form2.name,
                            },
                        ],
                    },
                ],
                "has_next": False,
                "has_previous": False,
                "page": 1,
                "pages": 1,
                "limit": 10,
            },
        )

        # Ensure soft deleted instances are not returned.

        instance2.deleted = True
        instance2.save()

        response = self.client.get(f"{BASE_URL}{self.raditz.pk}/reference_instances/", data=params)
        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(
            response_data,
            {
                "count": 1,
                "instances": [
                    {
                        "id": instance1.pk,
                        "uuid": None,
                        "form_id": form1.id,
                        "form_version_id": form_version1.id,
                        "created_at": 1698310800.0,
                        "updated_at": 1698310800.0,
                        "json": {"key": "foo"},
                        "instance_files": [],
                    },
                ],
                "has_next": False,
                "has_previous": False,
                "page": 1,
                "pages": 1,
                "limit": 10,
            },
        )

    def test_post_to_retrieve_list(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(
            BASE_URL, data={APP_ID: BASE_APP_ID, IDS: f"{self.goku.id},{self.gohan.id},{self.goten.id}"}
        )
        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assert_parents_listed_before_children(
            response_data["orgUnits"],
            allow_missing_parent=True,  # we don't ask for Goku's parent (Bardock) so we allow missing parent in this case
        )
        org_units = self.index_by_id(response_data["orgUnits"])
        self.assertCountEqual(org_units.keys(), [self.goku.id, self.gohan.id, self.goten.id])
        self.assertEqual(org_units[self.goku.id]["validation_status"], OrgUnit.VALIDATION_REJECTED)
        self.assertEqual(org_units[self.gohan.id]["validation_status"], OrgUnit.VALIDATION_VALID)
        self.assertEqual(org_units[self.goten.id]["validation_status"], OrgUnit.VALIDATION_VALID)

    def test_post_to_retrieve_list_with_wrong_id(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(BASE_URL, data={APP_ID: BASE_APP_ID, IDS: f"{self.goku.id},-1,{self.goten.id}"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_org_unit_not_authenticated_project_requires_authentication(self):
        count_before = OrgUnit.objects.count()
        response = self.client.post(
            f"{BASE_URL}?{APP_ID}={self.project.app_id}",
            data=[
                {
                    "id": "123",
                    "name": "My OrgUnit",
                    "time": 0,
                    "created_at": 1698310800.0,
                    "updated_at": 1698310800.0,
                }
            ],
        )
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(OrgUnit.objects.count(), count_before)
        self.assertFalse(OrgUnit.objects.filter(name="My OrgUnit").exists())

    def test_create_org_unit_authenticated_project_requires_authentication(self):
        count_before = OrgUnit.objects.count()
        self.client.force_authenticate(self.user)
        response = self.client.post(
            f"{BASE_URL}?{APP_ID}={self.project.app_id}",
            data=[
                {
                    "id": "123",
                    "name": "My OrgUnit",
                    "time": 0,
                    "created_at": 1698310800.0,
                    "updated_at": 1698310800.0,
                }
            ],
        )
        self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(OrgUnit.objects.count(), count_before + 1)
        self.assertTrue(OrgUnit.objects.filter(name="My OrgUnit").exists())

    def test_create_org_unit_not_authenticated_project_doesnt_require_authentication(self):
        count_before = OrgUnit.objects.count()
        response = self.client.post(
            f"{BASE_URL}?{APP_ID}={self.project2.app_id}",
            data=[
                {
                    "id": "123",
                    "name": "My OrgUnit",
                    "time": 0,
                    "created_at": 1698310800.0,
                    "updated_at": 1698310800.0,
                }
            ],
        )
        self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(OrgUnit.objects.count(), count_before + 1)
        self.assertTrue(OrgUnit.objects.filter(name="My OrgUnit").exists())

    def test_safe_api_import(self):
        self.client.force_authenticate(self.user)
        uuid = "61e1dbfe-a0fc-4075-bfa2-5f3201c918f3"
        name = "Hopital Sous Fifre"
        unit_body = [
            {
                "id": uuid,
                "latitude": 0,
                "created_at": 1565194077699,
                "updated_at": 1565194077800,
                "longitude": 0,
                "accuracy": 0,
                "altitude": 0,
                "time": 0,
                "name": name,
            }
        ]
        # No app id - An APIImport record with has_problem set to True should be created
        response = self.client.post("/api/mobile/orgunits/", data=unit_body, format="json")
        self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertAPIImport(
            "orgUnit",
            request_body=unit_body,
            has_problems=True,
            exception_contains_string="Could not find project for user",
            exception_contains_code="404",
        )

        # Wrong app id - An APIImport record with has_problem set to True should be created
        response = self.client.post("/api/mobile/orgunits/?app_id=1234", data=unit_body, format="json")
        self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertAPIImport(
            "orgUnit",
            request_body=unit_body,
            has_problems=True,
            exception_contains_string="Could not find project for user",
            exception_contains_code="404",
        )

    def test_create_org_unit_from_different_level_from_mobile(self):
        self.client.force_authenticate(self.user)

        ou_type = OrgUnitType.objects.create(name="Test_type")
        org_unit_parent = OrgUnit.objects.create(name="A_new_OU")
        count_of_orgunits = OrgUnit.objects.all().count()

        data = [
            {
                "id": "26668d58-7604-40bb-b783-71c2a2b3e6d1",
                "name": "A",
                "time": 1675099612000,
                "accuracy": 1.5,
                "altitude": 115.0,
                "latitude": 50.82521833333333,
                "longitude": 4.353595,
                "parent_id": "dd9360d0-3a2f-434d-a48f-298b3068b3a6",
                "created_at": 1675099611.938,
                "updated_at": 1675099611.938,
                "org_unit_type_id": ou_type.pk,
            },
            {
                "id": "5738b6b9-88f7-49ee-a211-632030f68f46",
                "name": "Bluesquare ",
                "time": 1674833629688,
                "accuracy": 15.67,
                "altitude": 127.80000305175781,
                "latitude": 50.8369448,
                "longitude": 4.3999539,
                "parent_id": str(org_unit_parent.pk),
                "created_at": 1674833640.146,
                "updated_at": 1674833640.146,
                "org_unit_type_id": ou_type.pk,
            },
            {
                "id": "76097602-92ed-45dd-a15a-a81c3fa44461",
                "name": "Saint+Luc",
                "time": 1675099739000,
                "accuracy": 2.2,
                "altitude": 113.6,
                "latitude": 50.825905,
                "longitude": 4.351918333333333,
                "parent_id": "dd9360d0-3a2f-434d-a48f-298b3068b3a6",
                "created_at": 1675099740.112,
                "updated_at": 1675099740.112,
                "org_unit_type_id": ou_type.pk,
            },
            {
                "id": "8818ed97-f238-4a9c-be90-19621af7edd5",
                "name": "Martin's place",
                "time": 1675099856000,
                "accuracy": 2.1,
                "altitude": 111.6,
                "latitude": 50.826703333333334,
                "longitude": 4.350505,
                "parent_id": "dd9360d0-3a2f-434d-a48f-298b3068b3a6",
                "created_at": 1675099855.568,
                "updated_at": 1675099855.568,
                "org_unit_type_id": ou_type.pk,
            },
            {
                "id": "8c646641-499d-4d65-aafb-5c98ef997e45",
                "name": "Delicelte",
                "time": 1675079431779,
                "accuracy": 11.483,
                "altitude": 110.5999984741211,
                "latitude": 50.8376697,
                "longitude": 4.3963584,
                "parent_id": str(org_unit_parent.pk),
                "created_at": 1675079445.755,
                "updated_at": 1675079445.755,
                "org_unit_type_id": ou_type.pk,
            },
            {
                "id": "98524cec-fc7d-4fcf-8353-b000786e765f",
                "name": "Crayon",
                "time": 1675099637000,
                "accuracy": 2.6,
                "altitude": 115.5,
                "latitude": 50.82513166666666,
                "longitude": 4.353408333333333,
                "parent_id": "dd9360d0-3a2f-434d-a48f-298b3068b3a6",
                "created_at": 1675099637.062,
                "updated_at": 1675099637.062,
                "org_unit_type_id": ou_type.pk,
            },
            {
                "id": "b579bba1-622c-4001-90bb-62f85a4ffbd1",
                "name": "mevan",
                "time": 1675079921000,
                "accuracy": 2.1,
                "altitude": 115.30000000000001,
                "latitude": 50.8376,
                "longitude": 4.396518333333333,
                "parent_id": str(org_unit_parent.pk),
                "created_at": 1675079920.602,
                "updated_at": 1675079920.602,
                "org_unit_type_id": ou_type.pk,
            },
            {
                "id": "b779e108-8f2a-48af-aa9e-7f1642cfe5bc",
                "name": "Pizza Mniam Mniam",
                "time": 1675079730000,
                "accuracy": 1.5,
                "altitude": 115.5,
                "latitude": 50.837444999999995,
                "longitude": 4.396443333333334,
                "parent_id": str(org_unit_parent.pk),
                "created_at": 1675079729.65,
                "updated_at": 1675079729.65,
                "org_unit_type_id": ou_type.pk,
            },
            {
                "id": "dd9360d0-3a2f-434d-a48f-298b3068b3a6",
                "name": "Some_New_STUF",
                "time": 1675099587000,
                "accuracy": 1.9,
                "altitude": 113.3,
                "latitude": 50.82527666666667,
                "longitude": 4.35383,
                "parent_id": str(org_unit_parent.pk),
                "created_at": 1675099586.754,
                "updated_at": 1675099586.755,
                "org_unit_type_id": ou_type.pk,
            },
        ]

        response = self.client.post(
            f"/api/mobile/orgunits/?app_id={BASE_APP_ID}",
            data=data,
            format="json",
        )
        new_count = OrgUnit.objects.all().count()

        result = self.assertJSONResponse(response, status.HTTP_200_OK)
        # ensure results are ordered by creation date ascending and that extra white spaces are trimmed
        self.assertIn(result[0]["name"], "Bluesquare")
        self.assertEqual(new_count, count_of_orgunits + 9)
        saved_org_unit = OrgUnit.objects.get(uuid="5738b6b9-88f7-49ee-a211-632030f68f46")
        self.assertEqual(saved_org_unit.name, "Bluesquare")
        self.assertEqual(saved_org_unit.source_created_at.timestamp(), 1674833640)

    def test_create_org_unit_mobile_already_exists(self):
        self.client.force_authenticate(self.user)

        ou_type = OrgUnitType.objects.create(name="Test_type")
        org_unit_parent = OrgUnit.objects.create(name="A_new_OU")
        starting_count = OrgUnit.objects.all().count()
        url = f"/api/mobile/orgunits/?app_id={BASE_APP_ID}"

        data = [
            {
                "id": "26668d58-7604-40bb-b783-71c2a2b3e6d1",
                "name": "A",
                "time": 1675099612000,
                "accuracy": 1.5,
                "altitude": 115.0,
                "latitude": 50.82521833333333,
                "longitude": 4.353595,
                "parent_id": None,
                "created_at": 1665099611.938,
                "updated_at": 1665099611.938,
                "org_unit_type_id": ou_type.pk,
            },
            {
                "id": "5738b6b9-88f7-49ee-a211-632030f68f46",
                "name": "Bluesquare ",
                "time": 1674833629688,
                "accuracy": 15.67,
                "altitude": 127.80000305175781,
                "latitude": 50.8369448,
                "longitude": 4.3999539,
                "parent_id": str(org_unit_parent.pk),
                "created_at": 1674833640.146,
                "updated_at": 1674833640.146,
                "org_unit_type_id": ou_type.pk,
            },
            {
                "id": "76097602-92ed-45dd-a15a-a81c3fa44461",
                "name": "Saint+Luc",
                "time": 1675099739000,
                "accuracy": 2.2,
                "altitude": 113.6,
                "latitude": 50.825905,
                "longitude": 4.351918333333333,
                "parent_id": None,
                "created_at": 1685099740.112,
                "updated_at": 1685099740.112,
                "org_unit_type_id": ou_type.pk,
            },
        ]

        data_single_unit = [data[1]]

        # post a single org unit
        response = self.client.post(url, data=data_single_unit, format="json")
        result = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertAPIImport("orgUnit", request_body=data_single_unit, has_problems=False)
        new_count = OrgUnit.objects.all().count()
        self.assertEqual(new_count, starting_count + 1)
        self.assertEqual(len(result), 1)

        # post the same org unit a second time
        response = self.client.post(url, data=data_single_unit, format="json")
        result = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertAPIImport("orgUnit", request_body=data_single_unit, has_problems=False)
        new_count = OrgUnit.objects.all().count()
        self.assertEqual(new_count, starting_count + 1)
        self.assertEqual(len(result), 0)

        # now do it again with all the data
        response = self.client.post(url, data=data, format="json")
        new_count = OrgUnit.objects.all().count()
        result = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertAPIImport("orgUnit", request_body=data, has_problems=False)
        self.assertEqual(new_count, starting_count + 3)
        # only the newly created org units will be returned in the api response
        self.assertEqual(len(result), 2)

    def test_create_with_mission_and_planning_id_raise_an_error_if_not_belonging_to_user(self):
        self.client.force_authenticate(self.user)

        with self.subTest("planning"):
            data = [
                {
                    "id": "123",
                    "name": "My OrgUnit",
                    "time": 0,
                    "created_at": 1698310800.0,
                    "updated_at": 1698310800.0,
                    "planning_id": self.other_account_planning.id,
                }
            ]
            response = self.client.post(
                f"{BASE_URL}?{APP_ID}={self.project.app_id}",
                data=data,
            )
            self.assertJSONResponse(response, status.HTTP_200_OK)
            self.assertAPIImport(
                "orgUnit", request_body=data, has_problems=True, exception_contains_string="planning_id"
            )

        with self.subTest("mission"):
            data = [
                {
                    "id": "123",
                    "name": "My OrgUnit",
                    "time": 0,
                    "created_at": 1698310800.0,
                    "updated_at": 1698310800.0,
                    "mission_id": self.mission_out_2.id,
                }
            ]
            response = self.client.post(
                f"{BASE_URL}?{APP_ID}={self.project.app_id}",
                data=data,
            )
            self.assertJSONResponse(response, status.HTTP_200_OK)
            self.assertAPIImport(
                "orgUnit", request_body=data, has_problems=True, exception_contains_string="mission_id"
            )

        # todo: kind of odd that the api returns a 200 but nothing is created ...
        self.assertFalse(
            OrgUnit.objects.filter(
                Q(planning_id=self.other_account_planning.id) | Q(mission_id=self.mission_out_2.id)
            ).exists()
        )

    def test_create_with_mission_and_planning_allows_soft_deleted(self):
        self.assertIsNotNone(self.soft_deleted_planning.deleted_at)
        self.assertIsNotNone(self.mission_soft_deleted.deleted_at)

        self.client.force_authenticate(self.user)
        data = [
            {
                "id": "123",
                "name": "My OrgUnit",
                "time": 0,
                "created_at": 1698310800.0,
                "updated_at": 1698310800.0,
                "mission_id": self.mission_soft_deleted.id,
                "planning_id": self.soft_deleted_planning.id,
            }
        ]
        response = self.client.post(
            f"{BASE_URL}?{APP_ID}={self.project.app_id}",
            data=data,
        )
        res_data = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertEqual(len(res_data), 1)
        ou = OrgUnit.objects.get(pk=res_data[0]["id"])
        self.assertEqual(ou.mission.id, self.mission_soft_deleted.id)
        self.assertEqual(ou.planning.id, self.soft_deleted_planning.id)

    def test_create_with_mission_and_planning_id_happy_path(self):
        self.client.force_authenticate(self.user)
        data = [
            {
                "id": "123",
                "name": "My OrgUnit",
                "time": 0,
                "created_at": 1698310800.0,
                "updated_at": 1698310800.0,
                "mission_id": self.mission_out_1.id,
                "planning_id": self.planning.id,
            }
        ]
        response = self.client.post(
            f"{BASE_URL}?{APP_ID}={self.project.app_id}",
            data=data,
        )
        res_data = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertEqual(len(res_data), 1)
        ou = OrgUnit.objects.get(pk=res_data[0]["id"])
        self.assertEqual(ou.mission.id, self.mission_out_1.id)
        self.assertEqual(ou.planning.id, self.planning.id)

    def test_create_with_wrong_mission_type_assert_log(self):
        self.client.force_authenticate(self.user)
        data = [
            {
                "id": "123",
                "name": "My OrgUnit",
                "time": 0,
                "created_at": 1698310800.0,
                "updated_at": 1698310800.0,
                "mission_id": self.mission_form_1.id,
            }
        ]
        with self.assertLogs(logger="iaso.api.org_units.serializers.misc", level="WARNING") as l:
            response = self.client.post(
                f"{BASE_URL}?{APP_ID}={self.project.app_id}",
                data=data,
            )

        log_record = l.records[-1]
        self.assertEqual(log_record.message, "Unexpected mission type")
        self.assertEqual(log_record.mission_id, self.mission_form_1.id)
        self.assertEqual(log_record.mission_type, self.mission_form_1.MISSION_TYPE)
        self.assertEqual(log_record.org_unit_uuid, "123")
        self.assertEqual(vars(log_record)["from"], "org_unit_creation")
        self.assertEqual(log_record.model, "OrgUnit")
        self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertTrue(OrgUnit.objects.filter(mission_id=self.mission_form_1.id).exists())
