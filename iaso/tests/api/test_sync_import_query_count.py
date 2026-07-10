from iaso import models as m
from iaso.test import APITestCase
from iaso.tests.utils.query_profiler import QueryProfiler


class SyncImportQueryCountTest(APITestCase):
    """
    Baseline for the one-by-one sync import path (POST /api/instances/ then
    POST /sync/form_upload/), mirroring the bulk-upload baseline in
    test_process_mobile_bulk_upload.py - see IA perf investigation notes.

    Unlike the bulk zip fixture (4 instances, 2 shared (form, version) pairs), this is a
    single instance - so the per-batch org_unit/entity caching added to import_data() has
    nothing to cache across and shouldn't move the numbers here. The per-instance fixes
    (Instance.save() FormVersion memoization, id-vs-object comparison in import_data())
    should still show up, since they apply per instance regardless of batch size.
    """

    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Sync perf account")
        cls.project = m.Project.objects.create(
            name="Sync perf project", app_id="sync.perf.project", account=cls.account
        )
        cls.org_unit_type = m.OrgUnitType.objects.create(name="Health facility", short_name="HF")
        cls.org_unit = m.OrgUnit.objects.create(name="Facility A", org_unit_type=cls.org_unit_type)
        cls.form = m.Form.objects.create(name="Land Speeder", form_id="sample1")
        # Matches the `version=` attribute in iaso/tests/fixtures/land_speeder.xml, so the
        # FormVersion lookup path in Instance.save()/xml_file_to_json is actually exercised.
        m.FormVersion.objects.create(form=cls.form, version_id="201911280919")

    def test_one_by_one_sync_import_query_count(self):
        uuid = "4b7c3954-f69a-4b99-83b1-db73957b32d2"
        file_name = "land_speeder.xml"
        instance_body = [
            {
                "id": uuid,
                "latitude": 4.4,
                "created_at": 1565258153704,
                "updated_at": 1565258153704,
                "orgUnitId": self.org_unit.id,
                "formId": self.form.id,
                "longitude": 4.4,
                "accuracy": 10,
                "altitude": 100,
                "file": f"/storage/emulated/0/odk/instances/{file_name}",
                "name": file_name,
            }
        ]

        with QueryProfiler(
            trace_tables=["iaso_formversion", "iaso_form", "iaso_orgunit", "iaso_entity", "iaso_entitytype"]
        ) as profiler:
            response = self.client.post(
                f"/api/instances/?app_id={self.project.app_id}", data=instance_body, format="json"
            )
            self.assertEqual(response.status_code, 200)

            with open(f"iaso/tests/fixtures/{file_name}") as fp:
                self.client.post("/sync/form_upload/", {"xml_submission_file": fp}, format="multipart")

        self.assertEqual(m.Instance.objects.count(), 1)
        instance = m.Instance.objects.get(uuid=uuid)
        self.assertIsNotNone(instance.form_version)
        self.assertEqual(instance.form_version.version_id, "201911280919")

        counts = profiler.table_counts()
        # No entityUuid/entityTypeId in this payload, and orgUnitId is given as a numeric id
        # (skipping the org_unit_cache lookup entirely) - so none of those tables are touched.
        self.assertEqual(counts.get("iaso_orgunit", 0), 0)
        self.assertEqual(counts.get("iaso_entity", 0), 0)
        self.assertEqual(counts.get("iaso_entitytype", 0), 0)
        # 1 form lookup from import_data()'s batch prefetch + 1 from xml_file_to_json while
        # processing the attached XML file; same breakdown for iaso_formversion (the memoized
        # Instance.save() lookup + xml_file_to_json's own lookup).
        self.assertLessEqual(counts["iaso_form"], 2)
        self.assertLessEqual(counts["iaso_formversion"], 2)
        self.assertLessEqual(profiler.total_queries(), 30)

        profiler.print_report()
        path = profiler.write_markdown_report(
            "sync_import_form_version.md", title="One-by-one sync import — FormVersion/Form query report"
        )
        print(f"Markdown report written to {path}")
