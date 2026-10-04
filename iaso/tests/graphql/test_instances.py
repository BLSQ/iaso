from datetime import datetime, timezone

from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone as django_timezone

from iaso import models as m
from iaso.graphql.instances.filters import MAX_NEAR_METERS
from iaso.permissions.core_permissions import CORE_SUBMISSIONS_PERMISSION
from iaso.tests.graphql.base import GraphQLTestCase
from iaso.tests.graphql.fixtures import health_account


def instance_queries(context):
    """The instance queries - leaving out authentication, permissions, `filter_for_user`'s own lookups and the
    `statement_timeout`, which don't depend on the query."""
    return [query["sql"] for query in context.captured_queries if 'FROM "iaso_instance"' in query["sql"]]


class InstanceGraphQLTestCase(GraphQLTestCase):
    """The Ministry of Health's census (single per period) and survey, submitted across a country > region > district
    pyramid, and a Partner NGO account whose submissions the requesting data manager must never see."""

    @classmethod
    def setUpTestData(cls):
        health = health_account()
        cls.moh = moh = health.account
        cls.project = project = health.project
        moh_version = health.version

        cls.country_type = m.OrgUnitType.objects.create(name="Country", short_name="CTY")
        cls.country = m.OrgUnit.objects.create(
            org_unit_type=cls.country_type,
            version=moh_version,
            name="Kanda",
            geom=MultiPolygon(Polygon(((0, 0), (0, 10), (10, 10), (10, 0), (0, 0)))),
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        cls.region = m.OrgUnit.objects.create(
            version=moh_version,
            parent=cls.country,
            name="North Region",
            source_ref="region-ref",
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        cls.district = m.OrgUnit.objects.create(
            version=moh_version, parent=cls.region, name="North District", validation_status=m.OrgUnit.VALIDATION_NEW
        )

        cls.census = m.Form.objects.create(name="Census", single_per_period=True)
        cls.survey = m.Form.objects.create(name="Survey")
        cls.deleted_form = m.Form.objects.create(name="Old census", deleted_at=django_timezone.now())
        for form in (cls.census, cls.survey, cls.deleted_form):
            form.projects.add(project)

        cls.user = cls.create_user_with_profile(
            username="data_manager", account=moh, permissions=[CORE_SUBMISSIONS_PERMISSION]
        )
        cls.no_permission_user = cls.create_user_with_profile(username="viewer", account=moh)

        def submit(form, org_unit, **fields):
            return m.Instance.objects.create(form=form, org_unit=org_unit, project=project, file="x.xml", **fields)

        # the census of January was submitted twice for the North Region: both are duplicates
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
        # outside Kanda, exported
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

        partner_ngo = m.Account.objects.create(name="Partner NGO")
        partner_project = m.Project.objects.create(
            name="Partner outreach", app_id="partner.outreach", account=partner_ngo
        )
        cls.partner_instance = m.Instance.objects.create(form=cls.census, project=partner_project, file="x.xml")

    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.user)

    # -- helpers --

    def assertIds(self, filters, instances):
        self.assertEqual(
            sorted(self.ids("submissions", filters=filters)), sorted(instance.id for instance in instances)
        )

    def filter_error(self, filters):
        return self.query_error("submissions", "items { id }", filters=filters)

    # -- permissions and scoping --

    def test_requires_a_submissions_permission(self):
        self.client.force_authenticate(self.no_permission_user)
        self.assertIn("permission", self.error("{ submissions { items { id } } }"))
        body = self.execute("{ submissions { items { id } } }")
        self.assertEqual(body["errors"][0]["extensions"]["code"], "FORBIDDEN")
        self.client.force_authenticate(None)
        self.assertIn("not provided", self.error("{ submissions { items { id } } }"))

    def test_only_the_users_account_without_deleted_ones(self):
        # nor the other account's, nor the deleted submission, nor the deleted form's
        self.assertIds({}, self.visible)
        self.assertIds({"deleted": True}, [self.deleted])
        self.assertIds({"deleted": False}, self.visible)
        self.assertIsNone(self.row("submission", self.partner_instance.id, "id"))
        self.assertIsNone(self.row("submission", self.of_deleted_form.id, "id"))
        # a link to a deleted submission keeps working
        self.assertEqual(self.row("submission", self.deleted.id, "deleted"), {"deleted": True})

    # -- fields --

    def test_fields(self):
        row = self.row(
            "submission",
            self.census_1.id,
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
        self.assertIsNone(self.row("submission", self.survey_1.id, "location { latitude }")["location"])

    def test_relations_are_joined_in_one_query(self):
        selection = "form { name } orgUnit { name sourceRef } project { name } createdBy { username }"
        with CaptureQueriesContext(connection) as context:
            self.items("submissions", selection)
        (sql,) = instance_queries(context)
        self.assertEqual(sql.split(" WHERE ")[0].count("JOIN"), 4)
        self.assertEqual(
            self.row("submission", self.census_1.id, selection),
            {
                "form": {"name": "Census"},
                "orgUnit": {"name": "North Region", "sourceRef": "region-ref"},
                "project": {"name": "Health facility monitoring"},
                "createdBy": {"username": "data_manager"},
            },
        )
        self.assertIsNone(self.row("submission", self.census_2.id, "createdBy { username }")["createdBy"])

    def test_org_unit_ancestors(self):
        selection = "accuracy orgUnit { id name ancestors { id name } }"
        with CaptureQueriesContext(connection) as context:
            rows = {row["orgUnit"]["name"]: row for row in self.items("submissions", selection, limit=50)}
        # the submissions, their org unit and its ancestors: one query
        self.assertEqual(len(instance_queries(context)), 1)
        self.assertEqual(
            rows["North District"]["orgUnit"]["ancestors"],
            [{"id": self.country.id, "name": "Kanda"}, {"id": self.region.id, "name": "North Region"}],
        )
        self.assertEqual(rows["North Region"]["orgUnit"]["ancestors"], [{"id": self.country.id, "name": "Kanda"}])
        message = self.error("{ submissions(limit: 5000) { items { id orgUnit { ancestors { id } } } } }")
        self.assertIn("between 1 and 1000 when selecting orgUnit.ancestors", message)

    def test_content_is_only_loaded_when_selected(self):
        with CaptureQueriesContext(connection) as context:
            self.items("submissions", "id period")
        (sql,) = instance_queries(context)
        self.assertEqual(sql.split(" FROM ")[0], 'SELECT "iaso_instance"."id", "iaso_instance"."period"')

    def test_status(self):
        statuses = {row["id"]: row["status"] for row in self.items("submissions", "id status")}
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
        self.assertEqual(self.row("submission", self.census_1.id, "status"), {"status": "READY"})

    def test_reference_instance(self):
        self.assertEqual(
            self.row("submission", self.census_1.id, "isReferenceSubmission"), {"isReferenceSubmission": True}
        )
        self.assertEqual(
            self.row("submission", self.census_2.id, "isReferenceSubmission"), {"isReferenceSubmission": False}
        )
        self.assertIds({"isReferenceSubmission": True}, [self.census_1])
        self.assertIds({"isReferenceSubmission": False}, [self.census_2, self.census_3, self.survey_1])

    def test_no_query_per_row(self):
        selection = (
            "id uuid formId formVersionId orgUnitId projectId period status createdAt updatedAt sourceCreatedAt "
            "sourceUpdatedAt createdById lastModifiedById location { latitude longitude altitude } accuracy deviceId "
            "entityId planningId isReferenceSubmission deleted fileName exportId content form { id name odkFormId periodType singlePerPeriod } formVersion { id versionId } "
            "orgUnit { id name sourceRef validationStatus orgUnitTypeId parentId ancestors { id name } } project { id name } "
            "createdBy { id username firstName lastName email } lastModifiedBy { id username }"
        )
        one, rows = self.profiled(lambda: self.items("submissions", selection, limit=1))
        four, more_rows = self.profiled(lambda: self.items("submissions", selection, limit=4))
        self.assertEqual((len(rows), len(more_rows)), (1, 4))
        four.assertSameQueryCounts(one)

    # -- pagination and ordering --

    def test_newest_first_by_default(self):
        self.assertEqual(self.ids("submissions"), sorted(self.ids("submissions"), reverse=True))
        self.assertEqual(self.ids("submissions", order=["ID"]), sorted(self.ids("submissions")))
        periods = [row["period"] for row in self.items("submissions", "period", order=["PERIOD_DESC"])]
        self.assertEqual(periods, ["202402", "202401", "202401", ""])

    def test_pages(self):
        self.assertEqual(
            self.page("submissions", "totalCount hasNextPage", limit=3), {"totalCount": 4, "hasNextPage": True}
        )
        self.assertEqual(self.ids("submissions", offset=1, limit=2), self.ids("submissions")[1:3])

    def test_content_lowers_the_limit(self):
        self.assertEqual(len(self.items("submissions", "id", limit=5_000)), 4)
        message = self.error("{ submissions(limit: 5000) { items { id content } } }")
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
        message = self.error("{ a: submissions { items { id } } b: submissions { items { id } } }")
        self.assertIn("At most 1 `submissions` per operation, got 2", message)
        # one list of each is fine
        data = self.data("{ submissions { totalCount } orgUnits { totalCount } }")
        self.assertEqual(data["submissions"]["totalCount"], 4)
