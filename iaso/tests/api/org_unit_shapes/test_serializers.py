from django.contrib.gis.geos import MultiPolygon, Polygon
from rest_framework.exceptions import ValidationError
from rest_framework.renderers import JSONRenderer
from rest_framework.test import APIRequestFactory

from hat.audit import models as audit_models
from iaso import models as m
from iaso.api.org_unit_shapes.serializers import OrgUnitShapeSerializer
from iaso.test import TestCase


class OrgUnitShapeSerializerTestCase(TestCase):
    """
    Test `OrgUnitShapeSerializer`.
    """

    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Data source")
        cls.source_version = m.SourceVersion.objects.create(number=1, data_source=cls.data_source)
        cls.geom = MultiPolygon(Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]))
        cls.org_unit = m.OrgUnit.objects.create(
            name="Org Unit",
            geom=cls.geom,
            version=cls.source_version,
        )
        cls.account = m.Account.objects.create(name="Account", default_version=cls.source_version)
        cls.user = cls.create_user_with_profile(username="User", account=cls.account, permissions=["iaso_org_units"])

    def test_serialize_ok(self):
        serializer = OrgUnitShapeSerializer(self.org_unit)
        json = JSONRenderer().render(serializer.data)
        expected_json = {
            "id": self.org_unit.pk,
            "name": self.org_unit.name,
            "geom": "SRID=4326;MULTIPOLYGON (((-1.3 2.5, -1.7 2.8, -1.1 4.1, -1.3 2.5)))",
            "simplified_geom": None,
        }
        self.assertJSONEqual(json, expected_json)

    def test_deserialize_ok(self):
        request = APIRequestFactory().get("/")
        request.user = self.user

        with open("iaso/tests/fixtures/geometry/cameroon_multipolygon.txt") as multipolygon_file:
            # Use a big shape to ensure `simplify_geom` works as expected.
            geom_string = multipolygon_file.read()

        data = {"geom": geom_string}
        serializer = OrgUnitShapeSerializer(self.org_unit, data=data, context={"request": request})
        self.assertTrue(serializer.is_valid())
        serializer.save()

        self.org_unit.refresh_from_db()
        self.assertEqual(self.org_unit.geom.num_coords, 38547)
        self.assertEqual(self.org_unit.simplified_geom.num_coords, 678)

        modification_log = audit_models.Modification.objects.get(object_id=self.org_unit.pk)
        self.assertEqual(modification_log.source, audit_models.ORG_UNIT_API_SHAPE)
        self.assertEqual(modification_log.user, self.user)
        past_values = modification_log.past_value[0]["fields"]
        self.assertEqual(past_values["geom"], self.geom)
        self.assertEqual(past_values["simplified_geom"], None)
        new_values = modification_log.new_value[0]["fields"]
        self.assertEqual(new_values["geom"], self.org_unit.geom)
        self.assertEqual(new_values["simplified_geom"], self.org_unit.simplified_geom)

    def test_validate(self):
        data = {"geom": "foo bar baz"}
        serializer = OrgUnitShapeSerializer(data=data)
        with self.assertRaises(ValidationError) as error:
            serializer.is_valid(raise_exception=True)
        self.assertEqual(error.exception.detail["geom"][0], "Invalid geometry.")
