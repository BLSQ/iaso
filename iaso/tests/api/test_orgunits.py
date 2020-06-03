from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import Polygon, Point
from django.test import tag
import typing

from iaso import models as m
from hat.audit import models as am
from iaso.test import APITestCase


class OrgUnitAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")
        marvel = m.Account.objects.create(name="MCU")
        cls.project = m.Project.objects.create(
            name="Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics",
            account=star_wars,
        )
        sw_source = m.DataSource.objects.create(name="Evil Empire")
        sw_source.projects.add(cls.project)
        cls.sw_source = sw_source
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version
        star_wars.save()

        cls.yoda = cls.create_user_with_profile(
            username="yoda", account=star_wars, permissions=["iaso_org_units"]
        )
        cls.raccoon = cls.create_user_with_profile(
            username="raccoon", account=marvel, permissions=["iaso_org_units"]
        )

        cls.jedi_council = m.OrgUnitType.objects.create(
            name="Jedi Council", short_name="Cnc"
        )

        cls.mock_polygon = Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]])
        cls.mock_point = Point(x=4, y=50, z=100)

        cls.elite_group = m.Group.objects.create(name="Elite councils")
        cls.unofficial_group = m.Group.objects.create(name="Unofficial Jedi councils")

        cls.jedi_council_corruscant = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_council,
            version=sw_version,
            name="Corruscant Jedi Council",
            geom=cls.mock_polygon,
            simplified_geom=cls.mock_polygon,
            catchment=cls.mock_polygon,
            location=cls.mock_point,
            validated=True,
        )
        cls.jedi_council_corruscant.groups.set([cls.elite_group])

        cls.jedi_council_endor = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_council,
            version=sw_version,
            name="Endor Jedi Council",
            geom=cls.mock_polygon,
            simplified_geom=cls.mock_polygon,
            catchment=cls.mock_polygon,
            location=cls.mock_point,
            validated=True,
        )

        cls.jedi_council_brussels = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_council,
            version=sw_version,
            name="Brussels Jedi Council",
            geom=cls.mock_polygon,
            simplified_geom=cls.mock_polygon,
            catchment=cls.mock_polygon,
            location=cls.mock_point,
            validated=True,
        )

    @tag("iaso_only")
    def test_org_unit_bulkupdate_not_authenticated(self):
        """POST /orgunits/bulkupdate, no auth -> 403"""

        response = self.client.post(
            f"/api/orgunits/bulkupdate/",
            data={"select_all": True, "validated": False},
            format="json",
        )
        self.assertJSONResponse(response, 403)
        self.assertEqual(0, m.BulkOperation.objects.count())
        self.assertEqual(0, am.Modification.objects.count())

    @tag("iaso_only")
    def test_org_unit_bulkupdate_select_some_wrong_account(self):
        """POST /orgunits/bulkupdate (authenticated user, but no access to specified org units)"""

        self.client.force_authenticate(self.raccoon)
        response = self.client.post(
            f"/api/orgunits/bulkupdate/",
            data={
                "select_all": False,
                "selected_ids": [
                    self.jedi_council_brussels.pk,
                    self.jedi_council_endor.pk,
                ],
                "validated": False,
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)
        self.assertValidBulkupdateData(response.json())

        for jedi_council in [
            self.jedi_council_endor,
            self.jedi_council_brussels,
            self.jedi_council_corruscant,
        ]:
            jedi_council.refresh_from_db()
            self.assertTrue(jedi_council.validated)

        self.assertEqual(0, m.BulkOperation.objects.count())
        self.assertEqual(0, am.Modification.objects.count())

    @tag("iaso_only")
    def test_org_unit_bulkupdate_select_some(self):
        """POST /orgunits/bulkupdate happy path"""

        self.client.force_authenticate(self.yoda)
        operation_payload = {
            "select_all": False,
            "selected_ids": [
                self.jedi_council_brussels.pk,
                self.jedi_council_endor.pk,
            ],
            "groups_added": [self.unofficial_group.pk],
            "validated": False,
        }
        response = self.client.post(
            f"/api/orgunits/bulkupdate/", data=operation_payload, format="json",
        )
        self.assertJSONResponse(response, 201)
        self.assertValidBulkupdateData(response.json())

        for jedi_council in [self.jedi_council_endor, self.jedi_council_brussels]:
            jedi_council.refresh_from_db()
            self.assertFalse(jedi_council.validated)
            self.assertIn(self.unofficial_group, jedi_council.groups.all())

        self.jedi_council_corruscant.refresh_from_db()
        self.assertTrue(self.jedi_council_corruscant.validated)
        self.assertNotIn(
            self.unofficial_group, self.jedi_council_corruscant.groups.all()
        )

        self.assertEqual(1, m.BulkOperation.objects.count())
        self.assertEqual(2, am.Modification.objects.count())

        operation = m.BulkOperation.objects.first()
        self.assertEqual(
            ContentType.objects.get_for_model(m.OrgUnit), operation.content_type
        )
        self.assertEqual(operation_payload, operation.json_body)
        self.assertEqual(self.yoda, operation.user)
        self.assertEqual(
            m.BulkOperation.OPERATION_TYPE_UPDATE, operation.operation_type
        )
        self.assertEqual(2, operation.operation_count)

        modification_endor = am.Modification.objects.get(
            object_id=self.jedi_council_endor.pk
        )
        self.assertEqual(
            ContentType.objects.get_for_model(m.OrgUnit),
            modification_endor.content_type,
        )
        self.assertEqual(self.yoda, modification_endor.user)
        self.assertEqual(am.ORG_UNIT_API_BULK, modification_endor.source)
        self.assertEqual(True, modification_endor.past_value[0]["fields"]["validated"])
        self.assertEqual(False, modification_endor.new_value[0]["fields"]["validated"])

    @tag("iaso_only")
    def test_org_unit_bulkupdate_select_all(self):
        """POST /orgunits/bulkupdate happy path (select all)"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/orgunits/bulkupdate/",
            data={"select_all": True, "validated": False},
            format="json",
        )
        self.assertJSONResponse(response, 201)
        self.assertValidBulkupdateData(response.json())

        for jedi_council in [
            self.jedi_council_endor,
            self.jedi_council_corruscant,
            self.jedi_council_brussels,
        ]:
            jedi_council.refresh_from_db()
            self.assertFalse(jedi_council.validated)

        self.assertEqual(1, m.BulkOperation.objects.count())
        self.assertEqual(3, am.Modification.objects.count())

    @tag("iaso_only")
    def test_org_unit_bulkupdate_select_all_with_search(self):
        """POST /orgunits/bulkupdate happy path (select all, but with search)"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/orgunits/bulkupdate/",
            data={
                "select_all": True,
                "validated": False,
                "searches": [{"group": f"{self.elite_group.pk}"}],
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)
        self.assertValidBulkupdateData(response.json())

        self.jedi_council_corruscant.refresh_from_db()
        self.assertFalse(self.jedi_council_corruscant.validated)

        for jedi_council in [self.jedi_council_endor, self.jedi_council_brussels]:
            jedi_council.refresh_from_db()
            self.assertTrue(jedi_council.validated)

        self.assertEqual(1, m.BulkOperation.objects.count())
        self.assertEqual(1, am.Modification.objects.count())

    @tag("iaso_only")
    def test_org_unit_bulkupdate_select_all_but_some(self):
        """POST /orgunits/bulkupdate happy path (select all except some)"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/orgunits/bulkupdate/",
            data={
                "select_all": True,
                "validated": False,
                "unselected_ids": [
                    self.jedi_council_brussels.pk,
                    self.jedi_council_endor.pk,
                ],
                "groups_removed": [self.elite_group.pk],
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)
        self.assertValidBulkupdateData(response.json())

        self.jedi_council_corruscant.refresh_from_db()
        self.assertFalse(self.jedi_council_corruscant.validated)
        self.assertNotIn(self.elite_group, self.jedi_council_corruscant.groups.all())

        for jedi_council in [self.jedi_council_endor, self.jedi_council_brussels]:
            jedi_council.refresh_from_db()
            self.assertTrue(jedi_council.validated)

        self.assertEqual(1, m.BulkOperation.objects.count())
        self.assertEqual(1, am.Modification.objects.count())

    def assertValidBulkupdateData(self, bulkupdate_data: typing.Mapping):
        self.assertHasField(bulkupdate_data, "id", int)
