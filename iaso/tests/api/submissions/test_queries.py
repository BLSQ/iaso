"""The queries and the storage calls (S3 round trips on a server) of the submissions endpoints, per table and per
method: a query added in the per-submission loop, or a file read for each submission instead of once per request, fails
here with the profiler's report."""

from django.core.files.base import ContentFile
from rest_framework import status

from iaso.tests.api.submissions.fixtures import URL, SubmissionsTestCase, requires_odk_cli
from iaso.tests.utils.query_profiler import QueryProfiler


# the first request of a test loads the user's permissions: not the endpoint's
PERMISSIONS = ("auth_permission", "django_content_type")
# a table counted per submission (`PER_SUBMISSION`), the others once per request whatever the number of submissions
PER_SUBMISSION = {
    # the uuid check (`_existing`); the mobile import's get_or_create by file name (select + insert) and its save;
    # `process_instance_file`'s two saves
    "iaso_instance": 6,
    # the org unit (`find_org_unit`) and the user's org units filter, again for each submission of the same org unit
    "iaso_orgunit": 2,
    # the org unit's version and project, in `find_org_unit`'s query
    "iaso_sourceversion": 1,
    "iaso_project": 0,
    # the version of the saved XML (`process_instance_file` doesn't get the request's form versions cache)
    "iaso_formversion": 1,
    "audit_modification": 1,
}
PER_REQUEST = {
    # the form and the latest version, its attachments (CSVs), the account, the org unit type
    "iaso_form": 2,
    "iaso_formversion": 2,
    "iaso_formattachment": 1,
    "iaso_account": 1,
    "iaso_orgunittype": 1,
    # the project (form, user, app id), the org unit's version, the uuid recheck and the slot locks (`unnest`)
    "iaso_project": 5,
    "iaso_sourceversion": 1,
    "iaso_instance": 3,
    "unnest": 1,
    # the request's audit (`APIImport`): created, then its result
    "vector_control_apiimport": 2,
    "iaso_orgunit": 0,
    "audit_modification": 0,
}


@requires_odk_cli
class SubmissionsQueriesTestCase(SubmissionsTestCase):
    def post_profiled(self, count, query=""):
        with QueryProfiler() as profiler:
            response = self.post(*[self.submission(ref=str(i)) for i in range(count)], query=query)
        return response, profiler

    def test_post(self):
        response, profiler = self.post_profiled(10)

        self.assertJSONResponse(response, status.HTTP_201_CREATED)
        with profiler.report_on_failure("submissions_post.md", title="POST /api/submissions/, 10 submissions"):
            profiler.assertLessEqualQueryCount(
                {
                    table: PER_REQUEST.get(table, 0) + 10 * PER_SUBMISSION.get(table, 0)
                    for table in {*PER_REQUEST, *PER_SUBMISSION}
                },
                exclude=PERMISSIONS,
            )
            # the XForm read once (its local copy made); per submission, its XML saved (`exists`: Django's available
            # name check)
            profiler.assertStorageCalls({"_open": [self.form_version.file.name]}, exclude=("_save", "exists"))
            profiler.assertStorageCounts({"_open": 1, "_save": 10, "exists": 10})
            profiler.assertFilesOpened([self.form_version.file.name])

    def test_post_reads_the_xform_once_per_server(self):
        self.post_profiled(1)
        response, profiler = self.post_profiled(1)

        self.assertJSONResponse(response, status.HTTP_201_CREATED)
        with profiler.report_on_failure("submissions_post_again.md"):
            profiler.assertFilesOpened([])
            profiler.assertStorageCounts({"_save": 1, "exists": 1})

        # a new version: new files, read once
        self.form_version.file.save("household.xml", ContentFile(self.form_version.file.read()))
        _, profiler = self.post_profiled(1)
        profiler.assertFilesOpened([self.form_version.file.name])

    def test_post_per_request_tables_dont_grow(self):
        _, one = self.post_profiled(1)
        _, ten = self.post_profiled(10)

        grown = {
            table: (one.table_counts()[table], ten.table_counts()[table])
            for table in PER_REQUEST
            if table not in PER_SUBMISSION and ten.table_counts()[table] > one.table_counts()[table]
        }
        self.assertEqual(grown, {}, "queried once per submission instead of once per request: (1, 10 submissions)")

    def test_dry_run_writes_nothing(self):
        response, profiler = self.post_profiled(1, query="?dry_run=true")

        self.assertJSONResponse(response, status.HTTP_200_OK)
        with profiler.report_on_failure("submissions_post_dry_run.md"):
            profiler.assertStorageCalls({"_open": [self.form_version.file.name]})
            self.assertEqual(profiler.table_counts()["audit_modification"], 0)
            self.assertEqual(profiler.table_counts()["iaso_instance"], 1, "the uuid check, no insert")

    def test_patch(self):
        instance = self.create()
        original_xml = instance.file.name

        with QueryProfiler() as profiler:
            response = self.client.patch(f"{URL}{instance.id}/", {"content": {"head_name": "Alicia"}}, format="json")

        self.assertJSONResponse(response, status.HTTP_200_OK)
        instance.refresh_from_db()
        with profiler.report_on_failure("submissions_patch.md", title="PATCH /api/submissions/{id}/"):
            profiler.assertLessEqualQueryCount(
                {
                    # the submission locked (`select_for_update ... OF`), its locks, then saved
                    "iaso_instance": 2,
                    "OF": 1,
                    "iaso_instancelock": 1,
                    # the user's access: profile, account, org units, project
                    "auth_user": 1,
                    "iaso_profile": 1,
                    "iaso_account": 1,
                    "iaso_orgunit": 1,
                    "iaso_project": 1,
                    # the version, the form's CSVs
                    "iaso_formversion": 2,
                    "iaso_formattachment": 1,
                    "audit_modification": 1,
                    "vector_control_apiimport": 2,
                },
                exclude=PERMISSIONS,
            )
            # read: the submission's XML only, the XForm's local copy made when it was created; a new XML saved next to
            # the old one
            profiler.assertStorageCalls({"_open": [original_xml]}, exclude=("_save", "exists"))
            profiler.assertStorageCounts({"_open": 1, "_save": 1, "exists": 2})
            self.assertEqual(profiler.storage_names("_save"), [instance.file.name])
            profiler.assertFilesOpened([original_xml])

    def test_get_reads_no_file(self):
        instance = self.create()

        with QueryProfiler() as profiler:
            response = self.client.get(f"{URL}{instance.id}/")

        self.assertJSONResponse(response, status.HTTP_200_OK)
        with profiler.report_on_failure("submissions_get.md"):
            profiler.assertLessEqualQueryCount({"iaso_instance": 1, "iaso_orgunit": 1}, exclude=PERMISSIONS)
            profiler.assertStorageCounts({}, exclude=())
