from datetime import date
from iaso.models.data_source import DataSource, SourceVersion
from iaso.models.data_store import JsonDataStore
from iaso.models.org_unit import OrgUnit, OrgUnitType
from iaso.models.project import Project
from iaso.test import APITestCase
import json
from iaso.models.base import Account, Group
from plugins.polio.api import (
    calculate_country_status,
    determine_status_for_district,
    get_data_for_round,
    get_latest_round_number,
    reduce_to_country_status,
)
from plugins.polio.models import Campaign, CampaignScope, Config, Round, RoundScope
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from django.contrib.gis.geos import Polygon, Point, MultiPolygon, GEOSGeometry


class PolioLqasAfroMapTestCase(APITestCase):
    authorized_user: User
    unauthorized_user: User
    account: Account
    projet: Project
    data_source: DataSource

    def setUp(cls) -> None:
        cls.account = Account.objects.create(name="Polio account")
        cls.authorized_user = cls.create_user_with_profile(username="authorized", account=cls.account)
        cls.unauthorized_user = cls.create_user_with_profile(username="unAuthorized", account=cls.account)
        cls.project = Project.objects.create(name="Polio", app_id="polio.rapid.outbreak.taskforce", account=cls.account)
        cls.data_source = DataSource.objects.create(name="Default source")
        cls.data_source.projects.add(cls.project)
        cls.data_source.save()
        cls.source_version = SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account.default_version = cls.source_version
        cls.account.save()
        cls.country = OrgUnitType.objects.create(name="Country", depth=1, category="COUNTRY")
        cls.country.projects.add(cls.project)
        cls.region = OrgUnitType.objects.create(name="Region", depth=2, category="REGION")
        cls.region.projects.add(cls.project)
        cls.district = OrgUnitType.objects.create(name="District", depth=3, category="DISTRICT")
        cls.district.projects.add(cls.project)
        cls.district.save()
        cls.region.sub_unit_types.add(cls.district)
        cls.region.save()
        cls.country.sub_unit_types.add(cls.region)
        cls.country.save()
        cls.country_1_geo_json = MultiPolygon(Polygon.from_bbox((1, 1, 5, 5)))
        cls.country_org_unit_1 = OrgUnit.objects.create(
            name="Country1",
            validation_status=OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
            org_unit_type=cls.country,
            version=cls.source_version,
            simplified_geom=cls.country_1_geo_json,
        )
        cls.country_2_geo_json = MultiPolygon(Polygon.from_bbox((6, 6, 9, 9)))
        cls.country_org_unit_2 = OrgUnit.objects.create(
            name="Country2",
            validation_status=OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
            org_unit_type=cls.country,
            version=cls.source_version,
            simplified_geom=cls.country_2_geo_json,
        )
        cls.region_org_unit_1 = OrgUnit.objects.create(
            name="Region1",
            validation_status=OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
            org_unit_type=cls.region,
            version=cls.source_version,
            parent=cls.country_org_unit_1,
        )
        cls.region_org_unit_2 = OrgUnit.objects.create(
            name="Region2",
            validation_status=OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
            org_unit_type=cls.region,
            version=cls.source_version,
            parent=cls.country_org_unit_2,
        )
        cls.district_1_geo_json = MultiPolygon(Polygon.from_bbox((2, 2, 3, 3)))
        cls.district_org_unit_1 = OrgUnit.objects.create(
            name="District1",
            validation_status=OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
            org_unit_type=cls.district,
            version=cls.source_version,
            simplified_geom=cls.district_1_geo_json,
            parent=cls.region_org_unit_1,
        )
        cls.district_2_geo_json = MultiPolygon(Polygon.from_bbox((4, 4, 5, 5)))
        cls.district_org_unit_2 = OrgUnit.objects.create(
            name="District2",
            validation_status=OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
            org_unit_type=cls.district,
            version=cls.source_version,
            simplified_geom=cls.district_2_geo_json,
            parent=cls.region_org_unit_1,
        )
        cls.district_3_geo_json = MultiPolygon(Polygon.from_bbox((6, 6, 7, 7)))
        cls.district_org_unit_3 = OrgUnit.objects.create(
            name="District3",
            validation_status=OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
            org_unit_type=cls.district,
            version=cls.source_version,
            simplified_geom=cls.district_3_geo_json,
            parent=cls.region_org_unit_2,
        )
        cls.district_4_geo_json = MultiPolygon(Polygon.from_bbox((8, 8, 9, 9)))
        cls.district_org_unit_4 = OrgUnit.objects.create(
            name="District4",
            validation_status=OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
            org_unit_type=cls.district,
            version=cls.source_version,
            simplified_geom=cls.district_4_geo_json,
            parent=cls.region_org_unit_2,
        )
        # Campaign 1. Scope at campaign level
        cls.campaign_1 = Campaign.objects.create(
            obr_name="CAMPAIGN1",
            account=cls.account,
            separate_scopes_per_round=False,
            initial_org_unit=cls.country_org_unit_1,
        )
        cls.campaign1_scope_group = Group.objects.create(
            name="campaign1scope", domain="POLIO", source_version=cls.source_version
        )
        cls.campaign1_scope_group.org_units.add(cls.district_org_unit_1)
        cls.campaign1_scope_group.org_units.add(cls.district_org_unit_2)
        cls.campaign1_scope_group.save()
        cls.campaign_1_scope = CampaignScope.objects.create(
            campaign=cls.campaign_1, vaccine="bOPV", group=cls.campaign1_scope_group
        )
        cls.campaign1_round1 = Round.objects.create(
            number=1, started_at="2023-05-05", ended_at="2023-05-10", campaign=cls.campaign_1
        )
        cls.campaign1_round2 = Round.objects.create(
            number=2, started_at="2023-06-05", ended_at="2023-06-10", campaign=cls.campaign_1
        )

        # Campaign 2. Scope at round level
        cls.campaign_2 = Campaign.objects.create(
            obr_name="CAMPAIGN2",
            account=cls.account,
            separate_scopes_per_round=True,
            initial_org_unit=cls.country_org_unit_2,
        )

        cls.campaign2_round1 = Round.objects.create(
            number=1, started_at="2023-04-05", ended_at="2023-04-10", campaign=cls.campaign_2
        )
        cls.campaign2_round1_scope_org_units = Group.objects.create(
            name="campaign2round1scope", domain="POLIO", source_version=cls.source_version
        )
        cls.campaign2_round1_scope_org_units.org_units.add(cls.district_org_unit_3)
        cls.campaign2_round1_scope_org_units.save()
        cls.campaign2_round1_scope = RoundScope.objects.create(
            round=cls.campaign2_round1, vaccine="bOPV", group=cls.campaign2_round1_scope_org_units
        )

        cls.campaign2_round2 = Round.objects.create(
            number=2, started_at="2023-06-01", ended_at="2023-06-04", campaign=cls.campaign_2
        )
        cls.campaign2_round2_scope_org_units = Group.objects.create(
            name="campaign2round2scope", domain="POLIO", source_version=cls.source_version
        )
        cls.campaign2_round2_scope_org_units.org_units.add(cls.district_org_unit_4)
        cls.campaign2_round2_scope_org_units.save()
        cls.campaign2_round2_scope = RoundScope.objects.create(
            round=cls.campaign2_round2, vaccine="nOPV2", group=cls.campaign2_round2_scope_org_units
        )
        # Creating a campign with round ending at date.max to check if it is exluded from results
        cls.excluded_campaign = Campaign.objects.create(
            obr_name="EXCLUDEDCAMPAIGN",
            account=cls.account,
            separate_scopes_per_round=False,
            initial_org_unit=cls.country_org_unit_2,
        )
        cls.excluded_campaign_round1 = Round.objects.create(
            number=1, started_at="2100-04-05", ended_at=date.max, campaign=cls.excluded_campaign
        )
        cls.country1_data_store_content = {
            "stats": {
                cls.campaign_1.obr_name: {
                    "country_name": cls.country_org_unit_1.name,
                    "country_id": cls.country_org_unit_1.id,
                    "rounds": [
                        {
                            "number": 1,
                            "data": {
                                cls.district_org_unit_1.name: {"total_child_checked": 60, "total_child_fmd": 60},
                                cls.district_org_unit_2.name: {"total_child_checked": 60, "total_child_fmd": 58},
                            },
                        },
                        {
                            "number": 2,
                            "data": {
                                cls.district_org_unit_1.name: {"total_child_checked": 60, "total_child_fmd": 40},
                                cls.district_org_unit_2.name: {"total_child_checked": 55, "total_child_fmd": 55},
                            },
                        },
                    ],
                }
            }
        }
        cls.country2_data_store_content = {
            "stats": {
                cls.campaign_2.obr_name: {
                    "country_name": cls.country_org_unit_2.name,
                    "country_id": cls.country_org_unit_2.id,
                    "rounds": [
                        {
                            "number": 1,
                            "data": {
                                cls.district_org_unit_3.name: {"total_child_checked": 60, "total_child_fmd": 58},
                                cls.district_org_unit_4.name: {"total_child_checked": 60, "total_child_fmd": 59},
                            },
                        },
                        {
                            "number": 2,
                            "data": {
                                cls.district_org_unit_3.name: {"total_child_checked": 60, "total_child_fmd": 60},
                                cls.district_org_unit_4.name: {"total_child_checked": 45, "total_child_fmd": 45},
                            },
                        },
                    ],
                }
            }
        }
        cls.datastore_country1 = JsonDataStore.objects.create(
            content=cls.country1_data_store_content, slug=f"lqas_{cls.country_org_unit_1.id}", account=cls.account
        )
        cls.datastore_country2 = JsonDataStore.objects.create(
            content=cls.country2_data_store_content, slug=f"lqas_{cls.country_org_unit_2.id}", account=cls.account
        )

    def test_authorized_user(self):
        c = APIClient()
        c.force_authenticate(user=self.authorized_user)
        response = c.get("/api/polio/lqasmap/global/?category=lqas", accept="application/json")
        self.assertEqual(response.status_code, 200)

    def test_determine_status_for_district(self):
        district_data = self.country1_data_store_content["stats"][self.campaign_1.obr_name]["rounds"][0]["data"][
            self.district_org_unit_1.name
        ]
        self.assertEqual(determine_status_for_district(district_data), "1lqasOK")
        district_data = self.country2_data_store_content["stats"][self.campaign_2.obr_name]["rounds"][1]["data"][
            self.district_org_unit_4.name
        ]
        self.assertEqual(determine_status_for_district(district_data), "2lqasDisqualified")
        district_data = {"total_child_checked": 60, "total_child_fmd": 45}
        self.assertEqual(determine_status_for_district(district_data), "3lqasFail")

    def test_reduce_to_country_status(self):
        total = {}
        lqasPass = "1lqasOK"
        lqasDisqualified = "2lqasDisqualified"
        lqasFail = "3lqasFail"
        inScope = "inScope"
        total = reduce_to_country_status(total, lqasPass)
        self.assertEqual(total["total"], 1)
        self.assertEqual(total["passed"], 1)
        total = reduce_to_country_status(total, lqasPass)
        self.assertEqual(total["total"], 2)
        self.assertEqual(total["passed"], 2)
        total = reduce_to_country_status(total, lqasDisqualified)
        self.assertEqual(total["total"], 3)
        self.assertEqual(total["passed"], 2)
        total = reduce_to_country_status(total, lqasFail)
        self.assertEqual(total["total"], 4)
        self.assertEqual(total["passed"], 2)
        total = reduce_to_country_status(total, inScope)
        self.assertEqual(total["total"], 5)
        self.assertEqual(total["passed"], 2)

    def test_get_latest_round_number(self):
        country_data = self.country1_data_store_content["stats"][self.campaign_1.obr_name]
        number_found = get_latest_round_number(country_data)
        self.assertEqual(number_found, 2)
        country_data = {"rounds": []}
        number_found = get_latest_round_number(country_data)
        self.assertEqual(number_found, None)

    def test_get_data_for_round(self):
        country_data = self.country1_data_store_content["stats"][self.campaign_1.obr_name]
        data_for_round_1 = get_data_for_round(country_data, 1)
        self.assertEqual(data_for_round_1["number"], 1)
        self.assertEqual(
            data_for_round_1["data"][self.district_org_unit_1.name], {"total_child_checked": 60, "total_child_fmd": 60}
        )
        country_data = {"rounds": []}
        result = get_data_for_round(country_data, 1)
        self.assertEquals(result["data"], {})

    def test_calculate_country_status(self):
        country_data = self.country1_data_store_content["stats"][self.campaign_1.obr_name]
        scope = self.campaign_1.get_all_districts()
        round_number = 1
        result = calculate_country_status(country_data, scope, round_number)
        self.assertEquals(result, "1lqasOK")
        result = calculate_country_status({}, scope, round_number)
        self.assertEquals(result, "inScope")
        result = calculate_country_status({}, CampaignScope.objects.filter(campaign__obr_name="NOTHING"), round_number)
        self.assertEquals(result, "inScope")
