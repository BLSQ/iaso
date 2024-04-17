from math import floor

from django.core.files.uploadedfile import UploadedFile
from django.utils import timezone

from iaso import models as m
from iaso.test import APITestCase


class DerivedInstancesTests(APITestCase):
    def floor_values(self, jsondata):
        result = {}
        for k in jsondata:
            result[k] = floor(jsondata[k]) if not isinstance(jsondata[k], str) else jsondata[k]
        return result

    def build_instance(self, form, score):
        instance = m.Instance()
        instance.org_unit = self.org_unit
        instance.period = "2018Q1"
        instance.json = {"satisfaction_score": score}

        instance.file = UploadedFile(open("iaso/tests/fixtures/hydroponics_test_upload.xml"))
        instance.form = form
        instance.project = self.project
        instance.save()
        return instance

    def setUp(self):
        self.maxDiff = None
        survey_form, created = m.Form.objects.get_or_create(
            form_id="satisfaction_survey",
            name="Client satisfaction survey",
            period_type="quarter",
            single_per_period=False,
        )
        self.survey_form = survey_form

        survey_form_version, created = m.FormVersion.objects.get_or_create(form=survey_form, version_id="1")

        self.survey_form = survey_form
        self.survey_form_version = survey_form_version

        account, account_created = m.Account.objects.get_or_create(name="Organisation Name")

        self.user = self.create_user_with_profile(
            username="Test User Name",
            email="testemail@bluesquarehub.com",
            account=account,
            permissions=["iaso_completeness"],
        )
        credentials, creds_created = m.ExternalCredentials.objects.get_or_create(
            name="Test export api", url="https://dhis2.com", login="admin", password="whocares", account=account
        )

        datasource, _ds_created = m.DataSource.objects.get_or_create(name="reference", credentials=credentials)
        self.datasource = datasource
        source_version, _created = m.SourceVersion.objects.get_or_create(number=1, data_source=datasource)
        self.source_version = source_version

        self.project = m.Project(name="Hyrule", app_id="magic.countries.hyrule.collect", account=account)
        self.project.save()

        datasource.projects.add(self.project)

        org_unit = m.OrgUnit()
        org_unit.validated = True
        org_unit.source_ref = "OU_DHIS2_ID"
        org_unit.version = source_version
        org_unit.save()

        self.org_unit = org_unit

        derived_form, created = m.Form.objects.get_or_create(
            form_id="satisfaction_stats",
            name="Client satisfaction statistics",
            period_type="quarter",
            single_per_period=True,
        )
        self.derived_form = derived_form

        derived_form_version, created = m.FormVersion.objects.get_or_create(form=derived_form, version_id="1")
        derived_form_mapping = m.Mapping(form=derived_form, data_source=self.datasource, mapping_type=m.DERIVED)
        derived_form_mapping.save()

        derived_form_mapping_version = m.MappingVersion(
            mapping=derived_form_mapping,
            form_version=derived_form_version,
            json={
                "formId": survey_form.form_id,
                "aggregations": [
                    {
                        "id": "satisfaction_score_avg",
                        "name": "Average statisfaction score",
                        "questionName": "satisfaction_score",
                        "aggregationType": "avg",
                    },
                    {
                        "id": "satisfaction_score_count",
                        "name": "Number of submissions with answered survey",
                        "questionName": "satisfaction_score",
                        "aggregationType": "count",
                    },
                    {
                        "id": "satisfaction_score_count_ten",
                        "name": "Number of submissions with answered survey with answer = 10",
                        "questionName": "satisfaction_score",
                        "aggregationType": "count",
                        "where": [
                            {
                                "questionName": "satisfaction_score",
                                "operator": "exact",
                                "value": 10,
                            }
                        ],
                    },
                    {
                        "id": "satisfaction_score_count_gt_eleven",
                        "name": "Number of submissions with answered survey with answer > 11",
                        "questionName": "satisfaction_score",
                        "aggregationType": "count",
                        "where": [
                            {
                                "questionName": "satisfaction_score",
                                "operator": "gt",
                                "value": 11,
                            }
                        ],
                    },
                    {
                        "id": "satisfaction_score_sum",
                        "name": "sum of budget",
                        "questionName": "satisfaction_score",
                        "aggregationType": "sum",
                        "defaultValue": 0,
                    },
                    {
                        "id": "satisfaction_score_sum_with_default",
                        "name": "sum of budget",
                        "questionName": "never_filled_question",
                        "aggregationType": "sum",
                        "defaultValue": 0,
                    },
                ],
            },
        )
        derived_form_mapping_version.save()
        self.derived_form_mapping_version = derived_form_mapping_version

        self.survey_form_version = derived_form_version

        derived_form.projects.add(self.project)
        self.survey_form.projects.add(self.project)

    def test_post_derived_instances_without_auth(self):
        """POST /derivedinstances/ without auth should result in a 401"""

        response = self.client.post("/api/derivedinstances/")
        self.assertEqual(401, response.status_code)
        self.assertEqual("application/json", response["Content-Type"])

    def test_post_derived_instances_with_updated(self):
        self.setup_5_instances()
        self.client.force_authenticate(self.user)

        self.trigger_generation_and_expect_stats({"new": 1, "updated": 0, "skipped": 0, "nullified": 0, "deleted": 0})

        derived_instance = self.derived_form.instances.all().first()

        self.assertEqual(
            self.floor_values(derived_instance.json),
            {
                "_version": "1",
                "satisfaction_score_avg": 54,
                "satisfaction_score_count": 4,
                "satisfaction_score_count_gt_eleven": 3,
                "satisfaction_score_count_ten": 1,
                "satisfaction_score_sum": 216,
                "satisfaction_score_sum_with_default": 0,
            },
        )

        # delete 2 submissions expect an update
        self.survey_form.instances.first().delete()
        self.survey_form.instances.first().delete()

        # expect to update the derived form
        self.trigger_generation_and_expect_stats({"new": 0, "updated": 1, "skipped": 0, "nullified": 0, "deleted": 0})
        derived_instance = self.derived_form.instances.all().first()

        self.assertEqual(
            self.floor_values(derived_instance.json),
            {
                "_version": "1",
                "satisfaction_score_avg": 86,
                "satisfaction_score_count": 2,
                "satisfaction_score_count_gt_eleven": 2,
                "satisfaction_score_count_ten": 0,
                "satisfaction_score_sum": 173,
                "satisfaction_score_sum_with_default": 0,
            },
        )

    def test_post_derived_instances_with_auth_deleted(self):
        self.setup_5_instances()
        self.client.force_authenticate(self.user)

        self.trigger_generation_and_expect_stats({"new": 1, "updated": 0, "skipped": 0, "nullified": 0, "deleted": 0})

        # delete all survey  submissions expect an update
        self.survey_form.instances.all().delete()

        self.trigger_generation_and_expect_stats({"new": 0, "updated": 0, "skipped": 0, "nullified": 0, "deleted": 1})
        # the instances should be deleted
        self.assertEqual(self.derived_form.instances.all().count(), 0)

    def test_post_derived_instances_with_auth_nullified(self):
        self.setup_5_instances()
        self.client.force_authenticate(self.user)

        self.trigger_generation_and_expect_stats({"new": 1, "updated": 0, "skipped": 0, "nullified": 0, "deleted": 0})
        # mark as already export the stats (need to remove them from dhis2)
        derived_instance = self.derived_form.instances.all().first()
        derived_instance.last_export_success_at = timezone.now()
        derived_instance.save()

        # delete all survey  submissions expect an update
        self.survey_form.instances.all().delete()

        self.trigger_generation_and_expect_stats({"new": 0, "updated": 0, "skipped": 0, "nullified": 1, "deleted": 0})
        # the instances should be nullified
        derived_instance = self.derived_form.instances.all().first()
        self.assertEqual(
            derived_instance.json,
            {
                "_version": "1",
                "satisfaction_score_avg": None,
                "satisfaction_score_sum": None,
                "satisfaction_score_count": None,
                "satisfaction_score_count_gt_eleven": None,
                "satisfaction_score_count_ten": None,
                "satisfaction_score_sum_with_default": None,
            },
        )
        self.assertEqual(derived_instance.last_export_success_at, None)

    def test_post_derived_instances_with_auth_computes_avg_sum_count(self):
        """POST /derivedinstances/ with auth should result in a 403"""

        self.client.force_authenticate(self.user)

        self.setup_5_instances()

        self.trigger_generation_and_expect_stats({"new": 1, "updated": 0, "skipped": 0, "nullified": 0, "deleted": 0})

        derived_instance = self.derived_form.instances.all().first()

        self.assertEqual(
            self.floor_values(derived_instance.json),
            {
                "_version": "1",
                "satisfaction_score_avg": 54,
                "satisfaction_score_count": 4,
                "satisfaction_score_count_gt_eleven": 3,
                "satisfaction_score_count_ten": 1,
                "satisfaction_score_sum": 216,
                "satisfaction_score_sum_with_default": 0,
            },
        )

    def setup_5_instances(self):
        self.build_instance(self.survey_form, 10)
        self.build_instance(self.survey_form, 33)
        self.build_instance(self.survey_form, 73.4156)
        self.build_instance(self.survey_form, 100)
        self.build_instance(self.survey_form, None)
        self.build_instance(self.survey_form, "")

    def trigger_generation_and_expect_stats(self, expected_stats):
        response = self.client.post(
            "/api/derivedinstances/",
            data={"periods": ["2018Q1"], "derived": [{"form_version__form_id": self.derived_form.id}]},
            format="json",
        )
        stats = response.json()["stats"][0]

        self.assertEqual(stats, expected_stats)
        self.assertEqual(201, response.status_code)
        self.assertEqual("application/json", response["Content-Type"])
