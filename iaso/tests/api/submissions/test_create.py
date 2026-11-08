import uuid

from unittest import mock

from django.db import connection
from django.test import override_settings
from django.test.utils import CaptureQueriesContext
from lxml import etree
from rest_framework import status

from hat.audit.models import INSTANCE_API, Modification
from iaso import models as m
from iaso.api.submissions.creation import recheck_under_lock
from iaso.permissions.core_permissions import CORE_SUBMISSIONS_PERMISSION, CORE_SUBMISSIONS_UPDATE_PERMISSION
from iaso.tests.api.submissions.fixtures import URL, VERSION, SubmissionsTestCase, requires_odk_cli


class SubmissionsCreateTestCase(SubmissionsTestCase):
    def assertRefused(self, response, expected_results):
        """400, every submission's status and errors (`code`, `field`), and nothing saved."""
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            [
                (result["ref"], result["status"], [(e["code"], e["field"]) for e in result.get("errors", [])])
                for result in data["results"]
            ],
            expected_results,
        )
        self.assertFalse(m.Instance.objects.exists(), "a refused request must not save anything")
        self.assertResponseCompliantToSwagger(data, "SubmissionsResult")
        return data

    @requires_odk_cli
    def test_creates_a_submission(self):
        submission_uuid = str(uuid.uuid4())
        response = self.post(
            self.submission(
                uuid=submission_uuid,
                location={"latitude": 51.2, "longitude": 4.4, "altitude": 10, "accuracy": 5},
                source_created_at="2026-11-01T08:00:00Z",
                content={"child": [{"child_name": "Bob", "child_age": 4}, {"child_name": "Eve"}]},
            )
        )

        data = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        self.assertResponseCompliantToSwagger(data, "SubmissionsResult")
        instance = m.Instance.objects.get()
        self.assertEqual(data.pop("import_id"), instance.api_import_id)
        self.assertEqual(
            data,
            {
                "results": [
                    {
                        "ref": "row-1",
                        "status": "created",
                        "id": instance.id,
                        "uuid": submission_uuid,
                        "form_version": VERSION,
                    }
                ]
            },
        )
        self.assertEqual(instance.uuid, submission_uuid)
        self.assertEqual(
            (instance.form, instance.org_unit, instance.project, instance.period, instance.form_version),
            (self.form, self.antwerp, self.project, "202611", self.form_version),
        )
        self.assertEqual((instance.created_by, instance.last_modified_by), (self.user, self.user))
        self.assertEqual(instance.source_created_at.isoformat(), "2026-11-01T08:00:00+00:00")
        self.assertEqual((instance.location.y, instance.location.x, instance.location.z), (51.2, 4.4, 10))
        self.assertEqual(float(instance.accuracy), 5.0)
        self.assertEqual(instance.json["head_name"], "Alice")
        self.assertEqual(instance.json["population"], "3")
        self.assertEqual(instance.json["double_population"], "6")
        self.assertEqual(
            instance.json["child"],
            [{"child_name": "Bob", "child_age": "4"}, {"child_name": "Eve", "child_age": ""}],
        )
        self.assertEqual(instance.json["children_count"], "2")
        self.assertEqual(instance.json["instanceID"], f"uuid:{submission_uuid}")
        self.assertEqual(instance.json["_version"], VERSION)
        xml = etree.fromstring(instance.file.read())
        self.assertEqual(xml.findtext("meta/instanceID"), f"uuid:{submission_uuid}")
        modification = Modification.objects.get(object_id=str(instance.id))
        self.assertEqual((modification.source, modification.user), (INSTANCE_API, self.user))

    @requires_odk_cli
    def test_the_org_unit_context_is_injected(self):
        self.post(self.submission(org_unit_id=self.brussels.id, content={"district_code": "BXL"}))

        instance = m.Instance.objects.get()
        self.assertEqual(instance.json["current_ou_name"], "Brussels")
        # relevant because of it
        self.assertEqual(instance.json["district_code"], "BXL")

        response = self.post(self.submission(ref="antwerp", uuid=str(uuid.uuid4()), content={"district_code": "A"}))
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            data["results"][0]["errors"],
            [
                {
                    "code": "NOT_RELEVANT",
                    "field": "content.district_code",
                    "message": "Not relevant",
                    "question": "district_code",
                    "answer": "A",
                }
            ],
        )

    @requires_odk_cli
    def test_several_submissions_all_or_nothing(self):
        response = self.post(
            self.submission(),
            self.submission(ref="row-2", content={"child": [{"child_age": 7}]}),
            self.submission(ref="row-3", content={"population": -1}),
        )

        data = self.assertRefused(
            response,
            [
                ("row-1", "valid", []),
                (
                    "row-2",
                    "refused",
                    [("REQUIRED", "content.child[1].child_name"), ("CONSTRAINT", "content.child[1].child_age")],
                ),
                ("row-3", "refused", [("CONSTRAINT", "content.population")]),
            ],
        )
        self.assertEqual(
            data["results"][1]["errors"][1],
            {
                "code": "CONSTRAINT",
                "field": "content.child[1].child_age",
                "message": "Under 5 only",
                "question": "child/child_age",
                "answer": "7",
            },
        )

        response = self.post(self.submission(), self.submission(ref="row-2", content={"population": 4}))
        data = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        self.assertEqual([result["status"] for result in data["results"]], ["created", "created"])
        self.assertEqual(sorted(m.Instance.objects.values_list("json__population", flat=True)), ["3", "4"])

    @requires_odk_cli
    def test_calculates_are_accepted_when_they_match(self):
        response = self.post(self.submission(content={"double_population": "6.0", "children_count": 0}))
        self.assertJSONResponse(response, status.HTTP_201_CREATED)

        m.Instance.objects.all().delete()
        response = self.post(self.submission(content={"double_population": 7}))
        data = self.assertRefused(
            response, [("row-1", "refused", [("CALCULATION_MISMATCH", "content.double_population")])]
        )
        self.assertEqual(
            (data["results"][0]["errors"][0]["answer"], data["results"][0]["errors"][0]["expected"]), ("7", "6")
        )

    @requires_odk_cli
    def test_volatile_calculates_are_only_reported(self):
        response = self.post(self.submission(content={"visit_hour": "99"}))

        data = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        self.assertResponseCompliantToSwagger(data, "SubmissionsResult")
        warning = data["results"][0]["warnings"][0]
        self.assertEqual(
            (warning["code"], warning["field"], warning["answer"]), ("CALCULATION_IGNORED", "content.visit_hour", "99")
        )
        self.assertNotEqual(m.Instance.objects.get().json["visit_hour"], "99")

    @requires_odk_cli
    def test_envelope_problems(self):
        restricted = self.create_user_with_profile(
            username="brussels_editor",
            account=self.account,
            permissions=[CORE_SUBMISSIONS_UPDATE_PERMISSION],
            org_units=[self.brussels],
        )
        cases = [
            ({"form_id": self.france_form.id}, [("UNKNOWN_REFERENCE", "form_id")]),
            ({"org_unit_id": self.paris.id}, [("UNKNOWN_REFERENCE", "org_unit_id")]),
            ({"org_unit_id": self.flanders.id}, [("INVALID", "org_unit_id")]),
            ({"period": "2026Q4"}, [("INVALID", "period")]),
            ({"period": None}, [("INVALID", "period")]),
            ({"project_id": self.france_project.id}, [("UNKNOWN_REFERENCE", "project_id")]),
            ({"content": {"_version": "1999"}}, [("INVALID", "content._version")]),
            ({"content": {"nope": "1"}}, [("UNKNOWN_QUESTION", "content.nope")]),
            # nothing to remove in a new submission
            ({"content": {"child": None}}, [("INVALID", "content.child")]),
            ({"content": {"child": [{"child_name": "Bob"}, None]}}, [("INVALID", "content.child[2]")]),
            ({"content": {"instanceID": "uuid:other"}, "uuid": str(uuid.uuid4())}, [("INVALID", "content.instanceID")]),
            ({"orgunit_id": 1}, [("INVALID", "orgunit_id")]),
            ({"location": {"latitude": 91, "longitude": 4}}, [("INVALID", "location.latitude")]),
        ]
        for overrides, errors in cases:
            with self.subTest(overrides=overrides):
                self.assertRefused(self.post(self.submission(**overrides)), [("row-1", "refused", errors)])

        self.client.force_authenticate(restricted)
        self.assertRefused(
            self.post(self.submission(org_unit_id=self.antwerp.id)),
            [("row-1", "refused", [("UNKNOWN_REFERENCE", "org_unit_id")])],
        )

    @requires_odk_cli
    def test_refs_are_unique(self):
        response = self.post(self.submission(), self.submission(content={"head_name": "Bob"}))

        self.assertRefused(response, [("row-1", "valid", []), ("row-1", "refused", [("INVALID", "ref")])])

    def test_project_required_when_the_form_is_in_several(self):
        other_project = m.Project.objects.create(name="Belgium malaria", app_id="be.malaria", account=self.account)
        self.form.projects.add(other_project)
        self.district.projects.add(other_project)

        self.assertRefused(self.post(self.submission()), [("row-1", "refused", [("INVALID", "project_id")])])

        response = self.post(self.submission(project_id=other_project.id))
        self.assertJSONResponse(response, status.HTTP_201_CREATED)
        self.assertEqual(m.Instance.objects.get().project, other_project)

    @requires_odk_cli
    def test_a_form_of_none_of_the_users_projects(self):
        malaria = m.Project.objects.create(name="Belgium malaria", app_id="be.malaria", account=self.account)
        malaria_only = self.create_user_with_profile(
            username="malaria_editor",
            account=self.account,
            permissions=[CORE_SUBMISSIONS_UPDATE_PERMISSION],
            projects=[malaria],
        )
        self.client.force_authenticate(malaria_only)

        self.assertRefused(self.post(self.submission()), [("row-1", "refused", [("UNKNOWN_REFERENCE", "form_id")])])

    @requires_odk_cli
    def test_dry_run_saves_nothing(self):
        submission_uuid = str(uuid.uuid4())
        response = self.post(self.submission(uuid=submission_uuid), query="?dry_run=true")

        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertResponseCompliantToSwagger(data, "SubmissionsResult")
        self.assertIsInstance(data.pop("import_id"), int)
        self.assertEqual(
            data, {"results": [{"ref": "row-1", "status": "valid", "uuid": submission_uuid, "form_version": VERSION}]}
        )
        self.assertFalse(m.Instance.objects.exists())
        self.assertFalse(Modification.objects.exists())

    @requires_odk_cli
    def test_uuid_retry_and_conflicts(self):
        submission_uuid = str(uuid.uuid4())
        first = self.assertJSONResponse(self.post(self.submission(uuid=submission_uuid)), status.HTTP_201_CREATED)

        # a retry after a timeout
        again = self.assertJSONResponse(self.post(self.submission(uuid=submission_uuid)), status.HTTP_201_CREATED)
        self.assertEqual(
            (again["results"][0]["status"], again["results"][0]["id"]), ("unchanged", first["results"][0]["id"])
        )
        self.assertEqual(m.Instance.objects.count(), 1)

        response = self.post(self.submission(uuid=submission_uuid, content={"population": 4}))
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual([e["code"] for e in data["results"][0]["errors"]], ["CONFLICT"])

        response = self.post(
            self.submission(uuid=submission_uuid, ref="a"), self.submission(uuid=submission_uuid, ref="b")
        )
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual([(e["code"], e["field"]) for e in data["results"][1]["errors"]], [("INVALID", "uuid")])

        french = self.create_form_instance(form=self.france_form, project=self.france_project, uuid=str(uuid.uuid4()))
        response = self.post(self.submission(uuid=french.uuid))
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            data["results"][0]["errors"],
            [{"code": "UUID_NOT_AVAILABLE", "field": "uuid", "message": "This uuid can't be used"}],
        )

    def test_saved_meanwhile_by_a_concurrent_request(self):
        """A retry sent before the first request answered: both checked the uuid as free; the second one to save
        finds it taken under the lock."""
        submission_uuid = str(uuid.uuid4())

        def saved_meanwhile(content):
            competing = []

            def recheck(batch, prepared):
                if not competing:
                    competing.append("the other request, saving first")
                    self.assertJSONResponse(
                        self.post(self.submission(uuid=submission_uuid, content=content)), status.HTTP_201_CREATED
                    )
                return recheck_under_lock(batch, prepared)

            return mock.patch("iaso.api.submissions.views.recheck_under_lock", side_effect=recheck)

        with saved_meanwhile({"population": 4}):
            response = self.post(self.submission(uuid=submission_uuid))
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual([(e["code"], e["field"]) for e in data["results"][0]["errors"]], [("CONFLICT", "uuid")])
        instance = m.Instance.objects.get()
        self.assertEqual((str(instance.uuid), instance.json["population"]), (submission_uuid, "4"), "only the first")

        # the same content: as a retry, unchanged
        other_uuid = str(uuid.uuid4())
        submission_uuid = other_uuid
        with saved_meanwhile({}):
            response = self.post(self.submission(uuid=other_uuid))
        data = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        first = m.Instance.objects.get(uuid=other_uuid)
        self.assertEqual((data["results"][0]["status"], data["results"][0]["id"]), ("unchanged", first.id))

    def test_permissions(self):
        reader = self.create_user_with_profile(
            username="belgium_reader", account=self.account, permissions=[CORE_SUBMISSIONS_PERMISSION]
        )
        self.client.force_authenticate(reader)
        self.assertJSONResponse(self.post(self.submission()), status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(None)
        self.assertJSONResponse(self.post(self.submission()), status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(m.Instance.objects.exists())

    def test_request_shape(self):
        for body in ({}, {"submissions": []}, {"submissions": ["x"]}, {"submissions": [{}] * 101}):
            with self.subTest(body=body):
                response = self.client.post(URL, body, format="json")
                self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

    @override_settings(ODK_CLI_PATH="/nonexistent/odk_cli")
    def test_odk_cli_unavailable(self):
        response = self.post(self.submission())

        self.assertJSONResponse(response, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertFalse(m.Instance.objects.exists())

    @requires_odk_cli
    def test_queries_per_submission(self):
        def queries(count):
            with CaptureQueriesContext(connection) as context:
                response = self.post(*[self.submission(ref=str(i)) for i in range(count)])
            self.assertJSONResponse(response, status.HTTP_201_CREATED)
            return len(context.captured_queries)

        one, ten = queries(1), queries(10)

        # per submission: org unit (+ the user's org units), uuid lookup, form version of its XML, and the mobile
        # upload's save (insert, 3 updates, its form and project, the audit row); the form, its projects, versions
        # and attachments, the XForm file, once per request
        self.assertLessEqual(ten - one, 9 * 12, f"{one} queries for 1 submission, {ten} for 10")
