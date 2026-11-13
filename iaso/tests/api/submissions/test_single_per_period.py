import uuid

from unittest import mock

from rest_framework import status

from iaso import models as m
from iaso.api.submissions.creation import recheck_under_lock
from iaso.tests.api.submissions.fixtures import URL, SubmissionsTestCase, requires_odk_cli


@requires_odk_cli
class SubmissionsSinglePerPeriodTestCase(SubmissionsTestCase):
    """A form taking one submission per org unit and period (`single_per_period`): a second one is refused."""

    def setUp(self):
        super().setUp()
        self.form.single_per_period = True
        self.form.save()

    def errors(self, response, index=0):
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        return [(error["code"], error["field"]) for error in data["results"][index]["errors"]]

    def test_one_per_org_unit_and_period(self):
        first = self.create()

        self.assertEqual(self.errors(self.post(self.submission(content={"population": 4}))), [("CONFLICT", "period")])
        dry_run = self.post(self.submission(content={"population": 4}), query="?dry_run=true")
        self.assertEqual(self.errors(dry_run), [("CONFLICT", "period")])

        # another period, another org unit, the same submission sent again: fine
        self.assertJSONResponse(self.post(self.submission(period="202612")), status.HTTP_201_CREATED)
        self.assertJSONResponse(self.post(self.submission(org_unit_id=self.brussels.id)), status.HTTP_201_CREATED)
        again = self.assertJSONResponse(self.post(self.submission(uuid=first.uuid)), status.HTTP_201_CREATED)
        self.assertEqual((again["results"][0]["status"], again["results"][0]["id"]), ("unchanged", first.id))
        self.assertEqual(m.Instance.objects.filter(org_unit=self.antwerp, period="202611").count(), 1)

    def test_a_deleted_one_frees_the_slot(self):
        first = self.create()
        first.soft_delete()

        self.assertJSONResponse(self.post(self.submission()), status.HTTP_201_CREATED)

    def test_twice_in_one_request(self):
        response = self.post(self.submission(ref="a"), self.submission(ref="b", content={"population": 4}))

        self.assertEqual(self.errors(response, 1), [("CONFLICT", "period")])
        self.assertFalse(m.Instance.objects.exists())

    def test_saved_meanwhile_by_a_concurrent_request(self):
        competing = []

        def recheck(batch, prepared):
            if not competing:
                competing.append("another request, saving first")
                self.create(content={"population": 4})
            return recheck_under_lock(batch, prepared)

        with mock.patch("iaso.api.submissions.views.recheck_under_lock", side_effect=recheck):
            response = self.post(self.submission(uuid=str(uuid.uuid4())))

        self.assertEqual(self.errors(response), [("CONFLICT", "period")])
        self.assertEqual(m.Instance.objects.get().json["population"], "4", "only the first")

    def test_patch_into_a_taken_slot(self):
        first = self.create()
        other = self.create(period="202612")

        for body, field in (({"period": "202611"}, "period"), ({"org_unit_id": self.antwerp.id}, "org_unit_id")):
            with self.subTest(body=body):
                instance = other if field == "period" else self.create(org_unit_id=self.brussels.id)
                response = self.client.patch(f"{URL}{instance.id}/", body, format="json")
                data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
                self.assertEqual(
                    [(e["code"], e["field"], e["message"].split(" ")[1]) for e in data["errors"]],
                    [("CONFLICT", field, str(first.id))],
                )
        # a free slot
        self.assertJSONResponse(
            self.client.patch(f"{URL}{other.id}/", {"period": "202610"}, format="json"), status.HTTP_200_OK
        )

    def test_other_forms_take_several(self):
        self.form.single_per_period = False
        self.form.save()
        self.create()

        self.assertJSONResponse(self.post(self.submission(content={"population": 4})), status.HTTP_201_CREATED)
