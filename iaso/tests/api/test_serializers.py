import datetime
from collections import OrderedDict
from unittest import mock
from django.test import TestCase

import pytz
from django.contrib.gis.geos import Polygon, Point, MultiPolygon

from iaso import models as m
from iaso.api.query_params import APP_ID
from iaso.api.serializers import OrgUnitSearchSerializer, OrgUnitSmallSearchSerializer, AppIdSerializer
from iaso.test import APITestCase


class OrgUnitAPITestCase(APITestCase):
    # noinspection PyUnresolvedReferences
    @classmethod
    def setUpTestData(cls):
        # FIXME Copy pasted from orgunit api test should move to proper fixture
        mocked = datetime.datetime(2018, 4, 4, 0, 0, 0, tzinfo=pytz.utc)
        with mock.patch("django.utils.timezone.now", mock.Mock(return_value=mocked)):
            cls.star_wars = star_wars = m.Account.objects.create(name="Star Wars")
            marvel = m.Account.objects.create(name="MCU")
            cls.project = m.Project.objects.create(
                name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
            )
            sw_source = m.DataSource.objects.create(name="Evil Empire")
            sw_source.projects.add(cls.project)
            cls.sw_source = sw_source
            sw_version_1 = m.SourceVersion.objects.create(data_source=sw_source, number=1)
            sw_version_2 = m.SourceVersion.objects.create(data_source=sw_source, number=2)
            star_wars.default_version = sw_version_1
            star_wars.save()
            cls.jedi_squad = m.OrgUnitType.objects.create(name="Jedi Squad", short_name="Jds")

            cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
            cls.jedi_council.sub_unit_types.add(cls.jedi_squad)

            cls.mock_multipolygon = MultiPolygon(Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]))
            cls.mock_point = Point(x=4, y=50, z=100)

            cls.elite_group = m.Group.objects.create(name="Elite councils", source_version=sw_version_1)
            cls.unofficial_group = m.Group.objects.create(name="Unofficial Jedi councils")
            cls.another_group = m.Group.objects.create(name="Another group")

            cls.jedi_council_corruscant = m.OrgUnit.objects.create(
                created_at=1627636541.781024,
                org_unit_type=cls.jedi_council,
                version=sw_version_1,
                name="Corruscant Jedi Council",
                geom=cls.mock_multipolygon,
                simplified_geom=cls.mock_multipolygon,
                catchment=cls.mock_multipolygon,
                location=cls.mock_point,
                validation_status=m.OrgUnit.VALIDATION_VALID,
                source_ref="PvtAI4RUMkr",
            )
            cls.jedi_council_corruscant.groups.set([cls.elite_group])

            cls.jedi_council_endor = m.OrgUnit.objects.create(
                org_unit_type=cls.jedi_council,
                version=sw_version_1,
                name="Endor Jedi Council",
                geom=cls.mock_multipolygon,
                simplified_geom=cls.mock_multipolygon,
                catchment=cls.mock_multipolygon,
                location=cls.mock_point,
                validation_status=m.OrgUnit.VALIDATION_VALID,
            )
            cls.jedi_squad_endor = m.OrgUnit.objects.create(
                parent=cls.jedi_council_endor,
                org_unit_type=cls.jedi_squad,
                version=sw_version_1,
                name="Endor Jedi Squad 1",
                geom=cls.mock_multipolygon,
                simplified_geom=cls.mock_multipolygon,
                catchment=cls.mock_multipolygon,
                location=cls.mock_point,
                validation_status=m.OrgUnit.VALIDATION_VALID,
                source_ref="F9w3VW1cQmb",
            )
            cls.jedi_squad_endor = m.OrgUnit.objects.create(
                parent=cls.jedi_council_endor,
                org_unit_type=cls.jedi_squad,
                version=sw_version_1,
                name="Endor Jedi Squad 1",
                geom=cls.mock_multipolygon,
                simplified_geom=cls.mock_multipolygon,
                catchment=cls.mock_multipolygon,
                location=cls.mock_point,
                validation_status=m.OrgUnit.VALIDATION_VALID,
            )

            cls.jedi_council_brussels = m.OrgUnit.objects.create(
                org_unit_type=cls.jedi_council,
                version=sw_version_2,
                name="Brussels Jedi Council",
                geom=cls.mock_multipolygon,
                simplified_geom=cls.mock_multipolygon,
                catchment=cls.mock_multipolygon,
                location=cls.mock_point,
                validation_status=m.OrgUnit.VALIDATION_VALID,
            )

            cls.yoda = cls.create_user_with_profile(
                username="yoda",
                first_name="master",
                last_name="yoda",
                account=star_wars,
                permissions=["iaso_org_units"],
            )
            cls.luke = cls.create_user_with_profile(
                username="luke", account=star_wars, permissions=["iaso_org_units"], org_units=[cls.jedi_council_endor]
            )
            cls.raccoon = cls.create_user_with_profile(
                username="raccoon", account=marvel, permissions=["iaso_org_units"]
            )

            cls.form_1 = m.Form.objects.create(name="Hydroponics study", period_type=m.MONTH, single_per_period=True)

            cls.create_form_instance(
                form=cls.form_1, period="202001", org_unit=cls.jedi_council_corruscant, project=cls.project
            )

            cls.create_form_instance(
                form=cls.form_1, period="202001", org_unit=cls.jedi_council_corruscant, project=cls.project
            )

            cls.create_form_instance(
                form=cls.form_1, period="202003", org_unit=cls.jedi_council_corruscant, project=cls.project
            )

    def test_serialize_search(self):
        orgunit = m.OrgUnit.objects.first()
        res = OrgUnitSearchSerializer(orgunit).data
        self.maxDiff = None
        self.assertDictEqual(
            res,
            {
                "aliases": None,
                "created_at": 1522800000.0,
                "creator": None,
                "groups": [
                    OrderedDict(
                        [
                            ("id", orgunit.groups.first().id),
                            ("name", "Elite councils"),
                            ("source_ref", None),
                            ("source_version", orgunit.version_id),
                            (
                                "created_at",
                                1522800000.0,
                            ),
                            ("updated_at", 1522800000.0),
                        ]
                    )
                ],
                "has_geo_json": True,
                "id": orgunit.id,
                "instances_count": 3,
                "name": "Corruscant Jedi Council",
                "org_unit_type": OrderedDict(
                    [
                        ("id", orgunit.org_unit_type_id),
                        ("name", "Jedi Council"),
                        ("short_name", "Cnc"),
                        (
                            "created_at",
                            1522800000.0,
                        ),
                        ("updated_at", 1522800000.0),
                        ("depth", None),
                    ]
                ),
                "org_unit_type_id": orgunit.org_unit_type_id,
                "org_unit_type_name": "Jedi Council",
                "parent": None,
                "parent_id": None,
                "parent_name": None,
                "search_index": None,
                "source": "Evil Empire",
                "source_id": orgunit.version.data_source_id,
                "source_ref": "PvtAI4RUMkr",
                "sub_source": None,
                "updated_at": 1522800000.0,
                "validation_status": "VALID",
                "latitude": 50.0,
                "longitude": 4.0,
                "altitude": 100.0,
            },
        )

        orgunit = self.jedi_squad_endor
        res = OrgUnitSearchSerializer(orgunit).data
        self.assertDictEqual(
            res,
            {
                "aliases": None,
                "created_at": 1522800000.0,
                "groups": [],
                "has_geo_json": True,
                "id": orgunit.id,
                "instances_count": 0,
                "name": "Endor Jedi Squad 1",
                "org_unit_type": OrderedDict(
                    [
                        ("id", orgunit.org_unit_type_id),
                        ("name", "Jedi Squad"),
                        ("short_name", "Jds"),
                        (
                            "created_at",
                            1522800000.0,
                        ),
                        ("updated_at", 1522800000.0),
                        ("depth", None),
                    ]
                ),
                "org_unit_type_id": orgunit.org_unit_type_id,
                "org_unit_type_name": "Jedi Squad",
                "parent": OrderedDict([("id", orgunit.parent_id), ("name", "Endor Jedi Council"), ("parent", None)]),
                "parent_id": orgunit.parent_id,
                "parent_name": "Endor Jedi Council",
                "search_index": None,
                "source": "Evil Empire",
                "source_id": orgunit.version.data_source_id,
                "source_ref": None,
                "sub_source": None,
                "updated_at": 1522800000.0,
                "validation_status": "VALID",
                "latitude": 50.0,
                "longitude": 4.0,
                "altitude": 100.0,
                "creator": None,
            },
        )

    def test_small_search(self):
        orgunit = m.OrgUnit.objects.first()
        res = OrgUnitSmallSearchSerializer(orgunit).data
        self.maxDiff = None
        self.assertDictEqual(
            res,
            {
                "id": orgunit.id,
                "name": "Corruscant Jedi Council",
                "org_unit_type_name": "Jedi Council",
                "parent": None,
                "creator": None,
                "parent_id": None,
                "parent_name": None,
                "search_index": None,
                "source": "Evil Empire",
                "source_ref": "PvtAI4RUMkr",
                "validation_status": "VALID",
            },
        )

        orgunit = self.jedi_squad_endor
        res = OrgUnitSmallSearchSerializer(orgunit).data
        self.assertDictEqual(
            res,
            {
                "creator": None,
                "id": orgunit.id,
                "name": "Endor Jedi Squad 1",
                "org_unit_type_name": "Jedi Squad",
                "parent": {
                    "creator": None,
                    "id": orgunit.parent_id,
                    "name": "Endor Jedi Council",
                    "parent_id": None,
                    "validation_status": "VALID",
                    "parent_name": None,
                    "search_index": None,
                    "source": "Evil Empire",
                    "source_ref": None,
                    "org_unit_type_name": "Jedi Council",
                    "parent": None,
                },
                "parent_id": orgunit.parent_id,
                "parent_name": "Endor Jedi Council",
                "search_index": None,
                "source": "Evil Empire",
                "source_ref": None,
                "validation_status": "VALID",
            },
        )

    def test_creator_org_unit(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/orgunits/create_org_unit/",
            format="json",
            data={
                "id": None,
                "name": "test_creator_ou",
                "org_unit_type_id": self.jedi_council.pk,
                "groups": [],
                "sub_source": "",
                "status": False,
                "aliases": ["my alias"],
                "validation_status": "NEW",
                "parent_id": "",
                "source_ref": "",
                "creation_source": "dashboard",
            },
        )
        self.assertJSONResponse(response, 200)

        self.assertEqual(
            f"{self.yoda.username} ({self.yoda.first_name} {self.yoda.last_name})", response.json().get("creator")
        )


class AppIdSerializerTestCase(TestCase):
    def test_app_id_serializer(self):
        query_params = {}
        app_id_serializer = AppIdSerializer(data=query_params)
        self.assertFalse(app_id_serializer.is_valid())
        self.assertEqual(str(app_id_serializer.errors[APP_ID][0]), "This field is required.")

        query_params = {"app_id": ""}
        app_id_serializer = AppIdSerializer(data=query_params)
        self.assertFalse(app_id_serializer.is_valid())
        self.assertEqual(str(app_id_serializer.errors[APP_ID][0]), "This field may not be blank.")

        query_params = {"app_id": "foo.bar"}
        app_id_serializer = AppIdSerializer(data=query_params)
        self.assertTrue(app_id_serializer.is_valid())
        self.assertEqual(app_id_serializer.validated_data[APP_ID], "foo.bar")
