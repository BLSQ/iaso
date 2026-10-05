from iaso import models as m
from iaso.permissions.core_permissions import CORE_SUBMISSIONS_PERMISSION
from iaso.tests.graphql.base import GraphQLTestCase
from iaso.tests.graphql.fixtures import health_account


class SubmissionAttachmentsGraphQLTestCase(GraphQLTestCase):
    """The photos, video and report sent with the Ministry of Health's facility assessments, and a Partner NGO
    submission's photo the data manager must never see."""

    @classmethod
    def setUpTestData(cls):
        health = health_account()
        moh = health.account
        cls.facility = m.OrgUnit.objects.create(version=health.version, name="Kanda Health Center")
        cls.other_facility = m.OrgUnit.objects.create(version=health.version, name="North Clinic")
        cls.assessment = m.Form.objects.create(name="Facility assessment")
        cls.assessment.projects.add(health.project)

        def submit(org_unit, project=health.project, form=None, **fields):
            return m.Instance.objects.create(
                form=form or cls.assessment, org_unit=org_unit, project=project, file="x.xml", **fields
            )

        cls.submission = submit(cls.facility)
        cls.other_submission = submit(cls.other_facility)
        cls.deleted_submission = submit(cls.facility, deleted=True)

        def attach(submission, name, **fields):
            return m.InstanceFile.objects.create(instance=submission, name=name, file=f"instancefiles/{name}", **fields)

        cls.photo = attach(cls.submission, "front.JPG")
        cls.video = attach(cls.submission, "tour.mp4")
        cls.report = attach(cls.submission, "report.pdf")
        cls.recording = attach(cls.submission, "interview.m4a")
        cls.removed = attach(cls.submission, "blurry.jpg", deleted=True)
        cls.other_photo = attach(cls.other_submission, "entrance.png")
        cls.deleted_submission_photo = attach(cls.deleted_submission, "old.jpg")

        partner = health_account(
            name="Partner NGO", project="Outreach", app_id="partner.outreach", source="Partner registry"
        )
        partner_facility = m.OrgUnit.objects.create(version=partner.version, name="Partner post")
        partner_form = m.Form.objects.create(name="Outreach visit")
        partner_form.projects.add(partner.project)
        cls.partner_photo = attach(submit(partner_facility, partner.project, partner_form), "partner.jpg")

        cls.user = cls.create_user_with_profile(
            username="data_manager", account=moh, permissions=[CORE_SUBMISSIONS_PERMISSION]
        )
        cls.viewer = cls.create_user_with_profile(username="viewer", account=moh)

    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.user)

    def ids(self, **arguments):
        return super().ids("submissionAttachments", **arguments)

    def test_the_accounts_attachments_not_deleted(self):
        self.assertEqual(
            self.ids(),
            [
                self.photo.id,
                self.video.id,
                self.report.id,
                self.recording.id,
                self.other_photo.id,
                self.deleted_submission_photo.id,
            ],
        )

    def test_fields(self):
        row = self.row("submissionAttachment", self.photo.id, "id name url type createdAt updatedAt submissionId")
        self.assertEqual(row["name"], "front.JPG")
        self.assertTrue(row["url"].endswith("instancefiles/front.JPG"), row["url"])
        self.assertEqual(row["type"], "IMAGE")  # the extension's case doesn't matter
        self.assertEqual(row["submissionId"], self.submission.id)
        self.assertIsNotNone(row["createdAt"])

    def test_types(self):
        rows = self.items("submissionAttachments", "name type", filters={"submissionId": self.submission.id})
        self.assertEqual(
            {row["name"]: row["type"] for row in rows},
            {"front.JPG": "IMAGE", "tour.mp4": "VIDEO", "report.pdf": "DOCUMENT", "interview.m4a": "OTHER"},
        )

    def test_filters(self):
        self.assertEqual(self.ids(filters={"submissionId": self.other_submission.id}), [self.other_photo.id])
        self.assertEqual(self.ids(filters={"orgUnitId": self.other_facility.id}), [self.other_photo.id])
        self.assertEqual(
            self.ids(filters={"type": "IMAGE"}), [self.photo.id, self.other_photo.id, self.deleted_submission_photo.id]
        )
        self.assertEqual(self.ids(filters={"typeIn": ["VIDEO", "OTHER"]}), [self.video.id, self.recording.id])
        self.assertEqual(self.ids(filters={"typeIn": []}), [])
        self.assertEqual(self.ids(filters={"nameIContains": "TOUR"}), [self.video.id])
        self.assertEqual(self.ids(filters={"formId": self.assessment.id, "type": "DOCUMENT"}), [self.report.id])

    def test_order_and_pages(self):
        page = self.page(
            "submissionAttachments", "items { id } hasNextPage totalCount", order=["ID_DESC"], limit=2, offset=1
        )
        self.assertEqual(page["items"], [{"id": self.other_photo.id}, {"id": self.recording.id}])
        self.assertTrue(page["hasNextPage"])
        self.assertEqual(page["totalCount"], 6)

    def test_not_visible(self):
        self.assertIsNone(self.row("submissionAttachment", self.partner_photo.id, "id"))
        self.assertIsNone(self.row("submissionAttachment", self.removed.id, "id"))

    def test_needs_a_submissions_permission(self):
        self.client.force_authenticate(self.viewer)
        self.query_error("submissionAttachments", "items { id }", code="FORBIDDEN")

    def test_limit(self):
        self.assertIn(
            "limit must be between 1 and 1000", self.query_error("submissionAttachments", "items { id }", limit=0)
        )
