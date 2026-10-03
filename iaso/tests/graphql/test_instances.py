from datetime import datetime, timezone

from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone as django_timezone

from iaso import models as m
from iaso.graphql.instances.filters import MAX_NEAR_METERS
from iaso.permissions.core_permissions import CORE_SUBMISSIONS_PERMISSION
from iaso.test import APITestCase


URL = "/api/graphql/"

DECLARATIONS = {"filters": "InstanceFilter", "order": "[InstanceOrder!]", "limit": "Int!", "offset": "Int!"}


def instance_queries(context):
    """The instance queries - leaving out authentication, permissions, `filter_for_user`'s own lookups and the
    `statement_timeout`, which don't depend on the query."""
    return [query["sql"] for query in context.captured_queries if 'FROM "iaso_instance"' in query["sql"]]


class InstanceGraphQLTestCase(APITestCase):
    """A Star Wars census (single per period) and survey, submitted across a country > region > district pyramid,
    and a Marvel account whose submissions the requesting user must never see."""

    @classmethod
    def setUpTestData(cls):
        cls.star_wars = star_wars = m.Account.objects.create(name="Star Wars")
        cls.project = project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )
        sw_source = m.DataSource.objects.create(name="Evil Empire")
        sw_source.projects.add(project)
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version
        star_wars.save()

        cls.country_type = m.OrgUnitType.objects.create(name="Country", short_name="Cnt")
        cls.country = m.OrgUnit.objects.create(
            org_unit_type=cls.country_type,
            version=sw_version,
            name="Naboo",
            geom=MultiPolygon(Polygon(((0, 0), (0, 10), (10, 10), (10, 0), (0, 0)))),
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        cls.region = m.OrgUnit.objects.create(
            version=sw_version,
            parent=cls.country,
            name="Theed",
            source_ref="region-ref",
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        cls.district = m.OrgUnit.objects.create(
            version=sw_version, parent=cls.region, name="Theed District", validation_status=m.OrgUnit.VALIDATION_NEW
        )

        cls.census = m.Form.objects.create(name="Census", single_per_period=True)
        cls.survey = m.Form.objects.create(name="Survey")
        cls.deleted_form = m.Form.objects.create(name="Old census", deleted_at=django_timezone.now())
        for form in (cls.census, cls.survey, cls.deleted_form):
            form.projects.add(project)

        cls.user = cls.create_user_with_profile(
            username="padme", account=star_wars, permissions=[CORE_SUBMISSIONS_PERMISSION]
        )
        cls.no_permission_user = cls.create_user_with_profile(username="jarjar", account=star_wars)

        def submit(form, org_unit, **fields):
            return m.Instance.objects.create(form=form, org_unit=org_unit, project=project, file="x.xml", **fields)

        # the census of January was submitted twice for Theed: both are duplicates
        cls.census_1 = submit(
            cls.census,
            cls.region,
            period="202401",
            location=Point(5, 5, 100),
            accuracy=3,
            json={"population": 120},
            created_by=cls.user,
            source_created_at=datetime(2024, 1, 2, tzinfo=timezone.utc),
        )
        cls.census_2 = submit(cls.census, cls.region, period="202401", location=Point(5.001, 5, 0), accuracy=40)
        # outside Naboo, exported
        cls.census_3 = submit(
            cls.census,
            cls.district,
            period="202402",
            location=Point(50, 50, 0),
            last_export_success_at=django_timezone.now(),
            source_created_at=datetime(2024, 2, 2, tzinfo=timezone.utc),
        )
        cls.survey_1 = submit(cls.survey, cls.district, period="")
        cls.deleted = submit(cls.survey, cls.country, period="2024Q1", deleted=True)
        cls.of_deleted_form = submit(cls.deleted_form, cls.region, period="202401")
        cls.visible = [cls.census_1, cls.census_2, cls.census_3, cls.survey_1]

        m.OrgUnitReferenceInstance.objects.create(org_unit=cls.region, form=cls.census, instance=cls.census_1)

        marvel = m.Account.objects.create(name="MCU")
        marvel_project = m.Project.objects.create(name="Wakanda outreach", app_id="marvel.app", account=marvel)
        cls.marvel_instance = m.Instance.objects.create(form=cls.census, project=marvel_project, file="x.xml")

    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.user)

    # -- helpers --

    def execute(self, query, variables=None):
        response = self.client.post(URL, {"query": query, "variables": variables or {}}, format="json")
        self.assertIn(response.status_code, (200, 400), response.content)
        return response.json()

    def data(self, query, variables=None):
        body = self.execute(query, variables)
        self.assertNotIn("errors", body, body.get("errors"))
        return body["data"]

    def error(self, query, variables=None):
        body = self.execute(query, variables)
        self.assertIn("errors", body)
        return body["errors"][0]["message"]

    def page(self, selection="items { id }", filters=None, **arguments):
        variables = {"filters": filters or {}, **arguments}
        signature = ", ".join(f"${name}: {DECLARATIONS[name]}" for name in variables)
        call = ", ".join(f"{name}: ${name}" for name in variables)
        return self.data(f"query ({signature}) {{ instances({call}) {{ {selection} }} }}", variables)["instances"]

    def items(self, selection="id", filters=None, **arguments):
        return self.page(f"items {{ {selection} }}", filters, **arguments)["items"]

    def ids(self, filters=None, **arguments):
        return [row["id"] for row in self.items("id", filters, **arguments)]

    def assertIds(self, filters, instances):
        self.assertEqual(sorted(self.ids(filters)), sorted(instance.id for instance in instances))

    def row(self, instance, selection):
        query = f"query ($id: Int!) {{ instance(id: $id) {{ {selection} }} }}"
        return self.data(query, {"id": instance.id})["instance"]

    def filter_error(self, filters):
        query = "query ($filters: InstanceFilter) { instances(filters: $filters) { items { id } } }"
        return self.error(query, {"filters": filters})

    # -- permissions and scoping --

    def test_requires_a_submissions_permission(self):
        self.client.force_authenticate(self.no_permission_user)
        self.assertIn("permission", self.error("{ instances { items { id } } }"))
        body = self.execute("{ instances { items { id } } }")
        self.assertEqual(body["errors"][0]["extensions"]["code"], "FORBIDDEN")
        self.client.force_authenticate(None)
        self.assertIn("not provided", self.error("{ instances { items { id } } }"))

    def test_only_the_users_account_without_deleted_ones(self):
        # nor the other account's, nor the deleted submission, nor the deleted form's
        self.assertIds({}, self.visible)
        self.assertIds({"deleted": True}, [self.deleted])
        self.assertIds({"deleted": False}, self.visible)
        self.assertIsNone(self.row(self.marvel_instance, "id"))
        self.assertIsNone(self.row(self.of_deleted_form, "id"))
        # a link to a deleted submission keeps working
        self.assertEqual(self.row(self.deleted, "deleted"), {"deleted": True})

    # -- fields --

    def test_fields(self):
        row = self.row(
            self.census_1,
            "formId orgUnitId projectId period createdById accuracy content sourceCreatedAt "
            "location { latitude longitude altitude }",
        )
        self.assertEqual(
            row,
            {
                "formId": self.census.id,
                "orgUnitId": self.region.id,
                "projectId": self.project.id,
                "period": "202401",
                "createdById": self.user.id,
                "accuracy": 3.0,
                "content": {"population": 120},
                "sourceCreatedAt": "2024-01-02T00:00:00+00:00",
                "location": {"latitude": 5.0, "longitude": 5.0, "altitude": 100.0},
            },
        )
        self.assertIsNone(self.row(self.survey_1, "location { latitude }")["location"])

    def test_relations_are_joined_in_one_query(self):
        selection = "form { name } orgUnit { name sourceRef } project { name } createdBy { username }"
        with CaptureQueriesContext(connection) as context:
            self.items(selection)
        (sql,) = instance_queries(context)
        self.assertEqual(sql.split(" WHERE ")[0].count("JOIN"), 4)
        self.assertEqual(
            self.row(self.census_1, selection),
            {
                "form": {"name": "Census"},
                "orgUnit": {"name": "Theed", "sourceRef": "region-ref"},
                "project": {"name": "Hydroponic gardens"},
                "createdBy": {"username": "padme"},
            },
        )
        self.assertIsNone(self.row(self.census_2, "createdBy { username }")["createdBy"])

    def test_org_unit_ancestors(self):
        selection = "accuracy orgUnit { id name ancestors { id name } }"
        with CaptureQueriesContext(connection) as context:
            rows = {row["orgUnit"]["name"]: row for row in self.items(selection, limit=50)}
        # the submissions, their org unit and its ancestors: one query
        self.assertEqual(len(instance_queries(context)), 1)
        self.assertEqual(
            rows["Theed District"]["orgUnit"]["ancestors"],
            [{"id": self.country.id, "name": "Naboo"}, {"id": self.region.id, "name": "Theed"}],
        )
        self.assertEqual(rows["Theed"]["orgUnit"]["ancestors"], [{"id": self.country.id, "name": "Naboo"}])
        message = self.error("{ instances(limit: 5000) { items { id orgUnit { ancestors { id } } } } }")
        self.assertIn("between 1 and 1000 when selecting orgUnit.ancestors", message)

    def test_content_is_only_loaded_when_selected(self):
        with CaptureQueriesContext(connection) as context:
            self.items("id period")
        (sql,) = instance_queries(context)
        self.assertEqual(sql.split(" FROM ")[0], 'SELECT "iaso_instance"."id", "iaso_instance"."period"')

    def test_status(self):
        statuses = {row["id"]: row["status"] for row in self.items("id status")}
        self.assertEqual(
            statuses,
            {
                self.census_1.id: "DUPLICATED",
                self.census_2.id: "DUPLICATED",
                self.census_3.id: "EXPORTED",
                self.survey_1.id: "READY",
            },
        )
        # a deleted duplicate doesn't count
        self.census_2.deleted = True
        self.census_2.save()
        self.assertEqual(self.row(self.census_1, "status"), {"status": "READY"})

    def test_reference_instance(self):
        self.assertEqual(self.row(self.census_1, "isReferenceInstance"), {"isReferenceInstance": True})
        self.assertEqual(self.row(self.census_2, "isReferenceInstance"), {"isReferenceInstance": False})
        self.assertIds({"isReferenceInstance": True}, [self.census_1])
        self.assertIds({"isReferenceInstance": False}, [self.census_2, self.census_3, self.survey_1])

    def test_no_query_per_row(self):
        selection = (
            "id uuid formId formVersionId orgUnitId projectId period status createdAt updatedAt sourceCreatedAt "
            "sourceUpdatedAt createdById lastModifiedById location { latitude longitude altitude } accuracy deviceId "
            "entityId planningId isReferenceInstance deleted fileName exportId content form { id name odkFormId periodType singlePerPeriod } formVersion { id versionId } "
            "orgUnit { id name sourceRef validationStatus orgUnitTypeId parentId ancestors { id name } } project { id name } "
            "createdBy { id username firstName lastName email } lastModifiedBy { id username }"
        )
        self.items("id")  # warms the user's permission and project caches, kept by `force_authenticate`
        counts = []
        for limit in (1, 4):
            with CaptureQueriesContext(connection) as context:
                self.assertEqual(len(self.items(selection, limit=limit)), limit)
            counts.append(len(context.captured_queries))
        self.assertEqual(counts[0], counts[1])

    # -- pagination and ordering --

    def test_newest_first_by_default(self):
        self.assertEqual(self.ids(), sorted(self.ids(), reverse=True))
        self.assertEqual(self.ids(order=["ID"]), sorted(self.ids()))
        periods = [row["period"] for row in self.items("period", order=["PERIOD_DESC"])]
        self.assertEqual(periods, ["202402", "202401", "202401", ""])

    def test_pages(self):
        self.assertEqual(self.page("totalCount hasNextPage", limit=3), {"totalCount": 4, "hasNextPage": True})
        self.assertEqual(self.ids(offset=1, limit=2), self.ids()[1:3])

    def test_content_lowers_the_limit(self):
        self.assertEqual(len(self.items("id", limit=5_000)), 4)
        message = self.error("{ instances(limit: 5000) { items { id content } } }")
        self.assertIn("between 1 and 1000 when selecting content", message)

    # -- filters --

    def test_form_and_org_unit_filters(self):
        self.assertIds({"formId": self.survey.id}, [self.survey_1])
        self.assertIds({"formIdIn": [self.census.id]}, [self.census_1, self.census_2, self.census_3])
        self.assertIds({"formNameIContains": "surv"}, [self.survey_1])
        self.assertIds({"orgUnitId": self.region.id}, [self.census_1, self.census_2])
        self.assertIds({"orgUnitNameIContains": "district"}, [self.census_3, self.survey_1])
        self.assertIds({"orgUnitSourceRef": "region-ref"}, [self.census_1, self.census_2])
        self.assertIds({"orgUnitValidationStatus": "NEW"}, [self.census_3, self.survey_1])
        self.assertIds({"orgUnitTypeId": self.country_type.id}, [])

    def test_org_unit_ancestor_includes_the_org_unit_itself(self):
        self.assertIds(
            {"orgUnitAncestorId": self.region.id}, [self.census_1, self.census_2, self.census_3, self.survey_1]
        )
        self.assertIds({"orgUnitAncestorId": self.district.id}, [self.census_3, self.survey_1])

    def test_period_status_and_dates(self):
        self.assertIds({"period": "202401"}, [self.census_1, self.census_2])
        self.assertIds({"periodIn": ["202402", ""]}, [self.census_3, self.survey_1])
        self.assertIds({"periodGte": "202402", "periodLte": "202412"}, [self.census_3])
        self.assertIds({"status": "EXPORTED"}, [self.census_3])
        self.assertIds({"status": "DUPLICATED"}, [self.census_1, self.census_2])
        self.assertIds({"statusIn": ["READY", "DUPLICATED"]}, [self.census_1, self.census_2, self.survey_1])
        self.assertIds({"sourceCreatedAtGte": "2024-02-01T00:00:00Z"}, [self.census_3])
        self.assertIds({"sourceCreatedAtLte": "2024-02-01T00:00:00Z"}, [self.census_1])
        self.assertIds({"createdAtLte": "2000-01-01T00:00:00Z"}, [])
        self.assertIds({"createdById": self.user.id}, [self.census_1])

    def test_location_filters(self):
        self.assertIds({"hasLocation": False}, [self.survey_1])
        self.assertIds({"accuracyLte": 10}, [self.census_1])
        self.assertIds({"locationWithinOrgUnit": self.country.id}, [self.census_1, self.census_2])
        self.assertIds({"locationOutsideOrgUnit": self.country.id}, [self.census_3])
        self.assertIds(
            {"locationWithinBbox": {"minx": 4, "miny": 4, "maxx": 6, "maxy": 6}}, [self.census_1, self.census_2]
        )
        self.assertIds({"locationOutsideBbox": {"minx": 4, "miny": 4, "maxx": 6, "maxy": 6}}, [self.census_3])
        # census_2 is 111 m east of census_1
        near = {"longitude": 5, "latitude": 5, "distanceMeters": 50}
        self.assertIds({"locationNear": near}, [self.census_1])
        self.assertIds({"locationNear": {**near, "distanceMeters": 200}}, [self.census_1, self.census_2])

    def test_invalid_location_filters(self):
        too_far = {"longitude": 5, "latitude": 5, "distanceMeters": MAX_NEAR_METERS + 1}
        self.assertIn("distanceMeters", self.filter_error({"locationNear": too_far}))
        self.assertIn("latitude", self.filter_error({"locationNear": {**too_far, "latitude": 91, "distanceMeters": 1}}))
        self.assertIn("has no geom", self.filter_error({"locationWithinOrgUnit": self.region.id}))

    def test_no_filter_on_unindexed_columns(self):
        for name in ("uuid", "exportId", "contentContains", "fileNameIContains", "periodIContains"):
            self.assertIn(f"Field '{name}' is not defined", self.filter_error({name: "x"}))

    # -- complexity --

    def test_one_instances_list_per_operation(self):
        message = self.error("{ a: instances { items { id } } b: instances { items { id } } }")
        self.assertIn("At most 1 `instances` per operation, got 2", message)
        # one list of each is fine
        data = self.data("{ instances { totalCount } orgUnits { totalCount } }")
        self.assertEqual(data["instances"]["totalCount"], 4)
