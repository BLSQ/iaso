import json
from io import StringIO
from os import environ

import responses
from django.contrib.gis.geos import Point, Polygon, MultiPolygon
from django.core import management
from django.test import TestCase

from iaso.models import OrgUnit, DataSource, SourceVersion, Group


class CommandTests(TestCase):
    def fixture_json(self, name):
        with open("./iaso/tests/fixtures/dhis2/" + name + ".json") as json_file:
            return json.load(json_file)

    def setup(self):
        self.maxDiff = None
        out = StringIO()
        responses.add(
            responses.GET,
            "https://play.dhis2.org/2.30/api/organisationUnits.json"
            "?fields=id,name,path,coordinates,geometry,parent,organisationUnitGroups[id,name],level"
            "&pageSize=500&page=1&totalPages=True",
            json=self.fixture_json("orgunits"),
            status=200,
        )

        responses.add(
            responses.GET,
            "https://play.dhis2.org/2.30/api/organisationUnitGroupSets.json"
            "?paging=false&fields=id,name,organisationUnitGroups[id,name]",
            json=self.fixture_json("groupsets"),
            status=200,
        )
        responses.add(
            responses.GET,
            "https://play.dhis2.org/2.30/api/organisationUnitLevels.json"
            "?fields=displayName&fields=id&fields=level&fields=name&pageSize=50&page=1&totalPages=True",
            json=self.fixture_json("organisationUnitLevels"),
            status=200,
        )

        management.call_command(
            "dhis2_ou_importer",
            stdout=out,
            dhis2_url="https://play.dhis2.org/2.30",
            dhis2_user="admin",
            dhis2_password="district",
            source_name="play",
            version_number=1,
            org_unit_type_csv_file="./iaso/tests/fixtures/empty_unit_types.csv",
        )

        management.call_command(
            "dhis2_ou_importer",
            stdout=out,
            dhis2_url="https://play.dhis2.org/2.30",
            dhis2_user="admin",
            dhis2_password="district",
            source_name="reference",
            version_number=1,
            org_unit_type_csv_file="./iaso/tests/fixtures/empty_unit_types.csv",
        )
        if environ.get("DEBUG_TEST") is not None:
            print(out.getvalue())

    def introduce_pyramid_changes(self, source_ref, version_ref):
        # change name
        parent = OrgUnit.objects.get(source_ref="kJq2mPyFEHo", version=version_ref)
        parent.name = "modified Gorama Mende"
        parent.save()

        # add new chiefdom
        org_unit_chief = OrgUnit()
        org_unit_chief.name = "new Chiefdom"
        org_unit_chief.sub_source = source_ref
        org_unit_chief.version = version_ref
        org_unit_chief.source_ref = None
        org_unit_chief.validated = False
        org_unit_chief.parent = parent
        org_unit_chief.simplified_geom = MultiPolygon([Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]])])
        org_unit_chief.save()

        group = Group.objects.get(source_ref="f25dqv3Y7Z0", source_version=version_ref)
        org_unit_chief.groups.add(group)

        # add new health center

        org_unit = OrgUnit()
        org_unit.name = "new children"
        org_unit.sub_source = source_ref
        org_unit.version = version_ref
        org_unit.source_ref = None
        org_unit.validated = False
        org_unit.parent = org_unit_chief
        org_unit.location = Point(-1.3596, 2.5317, 0)
        org_unit.save()

        # update existing chp coordinates
        chp = OrgUnit.objects.get(source_ref="LOpWauwwghf", version=version_ref)
        chp.location = Point(-13.3596, 9.5317, 0)
        chp.parent = parent
        chp.save()

    @responses.activate
    def test_command(self):
        self.setup()

        source_ref = DataSource.objects.get(name="reference")
        version_ref = SourceVersion.objects.get(number="1", data_source=source_ref)

        self.introduce_pyramid_changes(source_ref, version_ref)

        posted_request = []

        def request_callback(request):
            payload = json.loads(request.body)
            posted_request.append(payload)

            return (200, {}, json.dumps({}))

        responses.add_callback(
            responses.POST,
            "https://play.dhis2.org/2.30/api/organisationUnits",
            callback=request_callback,
            content_type="application/json",
        )

        gets_request = []

        def mock_orgunit_page(request):
            gets_request.append(1)
            fixture_name = "orgunits_page" + str(len(gets_request))

            return (200, {}, json.dumps(self.fixture_json(fixture_name)))

        responses.add_callback(
            responses.GET,
            "https://play.dhis2.org/2.30/api/organisationUnits",
            callback=mock_orgunit_page,
            content_type="application/json",
        )

        def request_callback_update(request):
            # print(json.loads(request.body))
            return (200, {}, json.dumps({"status": "OK"}))

        responses.add_callback(
            responses.POST,
            "https://play.dhis2.org/2.30/api/metadata",
            callback=request_callback_update,
            content_type="application/json",
        )

        for uid in ("Cbuj0VCyDjL", "Bpx0589u8y0", "J5jldMd8OHv", "uIuxlbV1vRT"):
            responses.add(
                responses.GET,
                "https://play.dhis2.org/2.30/api/organisationUnitGroups.json?fields=:all&filter=groupSets.id:eq:"
                + uid
                + "&paging=false",
                json=self.fixture_json("organisationUnitGroups-" + uid),
                status=200,
            )
        for group_id in ["f25dqv3Y7Z0"]:
            responses.add(
                responses.PUT,
                "https://play.dhis2.org/2.30/api/organisationUnitGroups/" + group_id,
                json="{}",
                status=200,
            )

        out = StringIO()
        management.call_command(
            "pyramid_exporter",
            stdout=out,
            source_name="play",
            version_number=1,
            source_name_ref="reference",
            version_number_ref=1,
            export="true",
            dhis2_url="https://play.dhis2.org/2.30",
            dhis2_user="admin",
            dhis2_password="district",
        )
        new_chief_dom = OrgUnit.objects.get(name="new Chiefdom", version=version_ref)
        new_children = OrgUnit.objects.get(name="new children", version=version_ref)

        self.assertEquals(
            posted_request,
            [
                {
                    "id": new_chief_dom.source_ref,
                    "name": "new Chiefdom",
                    "shortName": "new Chiefdom",
                    "openingDate": "1960-08-03T00:00:00.000",
                    "parent": {"id": "kJq2mPyFEHo"},
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [[[[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]]],
                    },
                    "coordinates": "[[[[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]]]",
                    "featureType": "MULTI_POLYGON",
                },
                {
                    "id": new_children.source_ref,
                    "name": "new children",
                    "shortName": "new children",
                    "openingDate": "1960-08-03T00:00:00.000",
                    "parent": {"id": new_chief_dom.source_ref},
                    "geometry": {"type": "Point", "coordinates": [-1.3596, 2.5317]},
                    "coordinates": "[-1.3596, 2.5317]",
                    "featureType": "POINT",
                },
            ],
        )
        if environ.get("DEBUG_TEST") is not None:
            print(out.getvalue())

        # TODO add assertion on "metadata" POST
