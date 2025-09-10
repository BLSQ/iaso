import datetime
import tempfile

from unittest import mock
from unittest.mock import patch
from uuid import uuid4

import duckdb
import pytz

from django.core.files import File

from iaso import models as m
from iaso.models import OrgUnitReferenceInstance


MOCK_DATE = datetime.datetime(2020, 2, 2, 2, 2, 2, tzinfo=pytz.utc)

from django.test import TransactionTestCase
from rest_framework.test import APIClient

from iaso.test import IasoTestCaseMixin


class BaseAPITransactionTestCase(TransactionTestCase, IasoTestCaseMixin):
    client_class = APIClient


# This test doesn't use the classic base test
# so that duckdb can see the commited fixtures vs nothing with the usual base test
class InstancesAPITestCase(BaseAPITransactionTestCase):
    @mock.patch("django.utils.timezone.now", lambda: MOCK_DATE)
    def setUp(cls):
        cls.maxDiff = None
        cls.star_wars = star_wars = m.Account.objects.create(name="Star Wars")

        sw_source = m.DataSource.objects.create(name="Galactic Empire")
        cls.sw_source = sw_source
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version
        star_wars.save()
        cls.sw_version = sw_version

        cls.yoda = cls.create_user_with_profile(
            username="yoda",
            last_name="Da",
            first_name="Yo",
            account=star_wars,
            permissions=["iaso_submissions", "iaso_org_units"],
        )
        cls.guest = cls.create_user_with_profile(username="guest", account=star_wars, permissions=["iaso_submissions"])
        cls.supervisor = cls.create_user_with_profile(
            username="supervisor", account=star_wars, permissions=["iaso_submissions", "iaso_forms"]
        )

        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")

        cls.jedi_council_corruscant_uuid = str(uuid4())
        cls.jedi_council_corruscant = m.OrgUnit.objects.create(
            name="Coruscant Jedi Council",
            source_ref="jedi_council_corruscant_ref",
            version=sw_version,
            validation_status="VALID",
            uuid=cls.jedi_council_corruscant_uuid,
        )
        cls.ou_top_1 = m.OrgUnit.objects.create(
            name="ou_top_1",
            source_ref="jedi_council_corruscant_ref",
            version=sw_version,
        )
        cls.ou_top_2 = m.OrgUnit.objects.create(
            name="ou_top_2",
            source_ref="jedi_council_corruscant_ref",
            parent=cls.ou_top_1,
            version=sw_version,
        )
        cls.ou_top_3 = m.OrgUnit.objects.create(
            name="ou_top_3",
            source_ref="jedi_council_corruscant_ref",
            parent=cls.ou_top_2,
            version=sw_version,
        )
        cls.jedi_council_endor = m.OrgUnit.objects.create(
            name="Endor Jedi Council",
            source_ref="jedi_council_endor_ref",
            version=sw_version,
        )
        cls.jedi_council_endor_region = m.OrgUnit.objects.create(
            name="Endor Region Jedi Council",
            parent=cls.jedi_council_endor,
            source_ref="jedi_council_endor_region_ref",
            version=sw_version,
        )

        cls.project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )

        cls.project_2 = m.Project.objects.create(name="Project number 2", app_id="project.two", account=star_wars)

        sw_source.projects.add(cls.project)

        cls.form_1 = m.Form.objects.create(name="Hydroponics study", period_type=m.MONTH, single_per_period=True)
        cls.form_5 = m.Form.objects.create(name="Form five", period_type=m.MONTH, single_per_period=True)
        date1 = datetime.datetime(2020, 2, 1, 0, 0, 5, tzinfo=pytz.UTC)
        date2 = datetime.datetime(2020, 2, 3, 0, 0, 5, tzinfo=pytz.UTC)
        date3 = datetime.datetime(2020, 2, 5, 0, 0, 5, tzinfo=pytz.UTC)

        with patch("django.utils.timezone.now", lambda: date1):
            cls.instance_1 = cls.create_form_instance(
                form=cls.form_1,
                period="202001",
                org_unit=cls.jedi_council_corruscant,
                project=cls.project,
                created_by=cls.yoda,
                export_id="Vzhn0nceudr",
                source_created_at=date1,
            )
        with patch("django.utils.timezone.now", lambda: date1):
            cls.instance_2 = cls.create_form_instance(
                form=cls.form_1,
                period="202002",
                org_unit=cls.jedi_council_corruscant,
                project=cls.project,
                created_by=cls.guest,
                source_created_at=date1,
            )
        with patch("django.utils.timezone.now", lambda: date2):
            cls.instance_3 = cls.create_form_instance(
                form=cls.form_1,
                period="202002",
                org_unit=cls.jedi_council_corruscant,
                project=cls.project,
                created_by=cls.supervisor,
                source_created_at=date2,
            )
        with patch("django.utils.timezone.now", lambda: date3):
            cls.instance_4 = cls.create_form_instance(
                form=cls.form_1,
                period="202003",
                org_unit=cls.jedi_council_corruscant,
                project=cls.project,
                created_by=cls.yoda,
                source_created_at=date3,
            )

        cls.form_2 = m.Form.objects.create(
            name="Hydroponic public survey",
            form_id="sample2",
            device_field="deviceid",
            location_field="geoloc",
            period_type="QUARTER",
            single_per_period=True,
        )

        # Form without period
        cls.form_3 = m.Form.objects.create(
            name="Hydroponic public survey III",
            form_id="sample34",
            device_field="deviceid",
            location_field="geoloc",
            # period_type="QUARTER",
            # single_per_period=True,
        )

        cls.form_4 = m.Form.objects.create(
            name="Hydroponic public survey IV",
            form_id="sample26",
            device_field="deviceid",
            location_field="geoloc",
            period_type="QUARTER",
            single_per_period=True,
        )

        form_2_file_mock = mock.MagicMock(spec=File)
        form_2_file_mock.name = "test.xml"
        cls.form_2.form_versions.create(file=form_2_file_mock, version_id="2020022401")
        cls.form_2.org_unit_types.add(cls.jedi_council)
        cls.instance_5 = cls.create_form_instance(
            form=cls.form_2,
            period="202001",
            org_unit=cls.jedi_council_corruscant,
            project=cls.project,
            created_by=cls.yoda,
        )
        cls.form_2.save()

        # Instance saved without period
        cls.form_3.form_versions.create(file=form_2_file_mock, version_id="2020022401")
        cls.form_3.org_unit_types.add(cls.jedi_council)
        cls.instance_6 = cls.create_form_instance(
            form=cls.form_3, org_unit=cls.jedi_council_corruscant, project=cls.project, created_by=cls.supervisor
        )
        cls.form_3.save()

        # A deleted Instance
        cls.form_4.form_versions.create(file=form_2_file_mock, version_id="2020022402")
        cls.form_4.org_unit_types.add(cls.jedi_council)
        cls.instance_7 = cls.create_form_instance(
            form=cls.form_4,
            period="2020Q1",
            org_unit=cls.jedi_council_corruscant,
            project=cls.project,
            deleted=True,
            created_by=cls.yoda,
        )
        cls.form_4.save()

        with patch("django.utils.timezone.now", lambda: date3):
            cls.instance_8 = cls.create_form_instance(
                form=cls.form_5,
                period="202003",
                org_unit=cls.jedi_council_corruscant,
                project=cls.project_2,
                created_by=cls.yoda,
                source_created_at=date3,
            )
        with patch("django.utils.timezone.now", lambda: datetime.datetime(2020, 2, 10, 0, 0, 5, tzinfo=pytz.UTC)):
            cls.instance_5.save()
            cls.instance_6.save()

        cls.project.unit_types.add(cls.jedi_council)
        cls.project.forms.add(cls.form_1)
        cls.project.forms.add(cls.form_2)
        cls.project.forms.add(cls.form_3)
        cls.project.forms.add(cls.form_4)
        sw_source.projects.add(cls.project)
        cls.project.save()

    def test_can_retrieve_instances_in_parquet_format(self):
        self.yoda.iaso_profile.projects.add(self.instance_1.project)
        self.client.force_authenticate(self.yoda)

        # Mark instance_1 as a reference instance.
        OrgUnitReferenceInstance.objects.create(
            org_unit=self.jedi_council_corruscant, instance=self.instance_1, form=self.form_1
        )
        with self.assertNumQueries(8):
            response = self.client.get(
                f"/api/instances/?form_ids={self.instance_1.form.id}&parquet=true", headers={"Content-Type": "text/csv"}
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response["Content-Type"], "application/octet-stream")
            with tempfile.NamedTemporaryFile(suffix=".parquet") as f:
                for chunk in response.streaming_content:
                    f.write(chunk)
                f.flush()
                f.seek(0)

                with duckdb.connect() as connection:
                    con = duckdb.connect()
                    result = con.execute(f"SELECT * FROM read_parquet('{f.name}')")
                    colnames = [d[0] for d in result.description]  # column names
                    rows = [dict(zip(colnames, row)) for row in result.fetchall()]

                    self.assertEqual(len(rows), 4)

    def test_bad_request_parquet_validates_unknown_query_param(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.get(
            f"/api/instances/?form_ids={self.instance_1.form.id}&parquet=true&unknown_unsupported_filter=bad_param"
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(
            response.json(),
            {
                "error": "Unsupported query parameters for parquet exports: unknown_unsupported_filter. Allowed parameters dateFrom, dateTo, endPeriod, form_ids, jsonContent, modificationDateFrom, modificationDateTo, orgUnitParentId, orgUnitTypeId, parquet, planningIds, project_ids, sentDateFrom, sentDateTo, showDeleted, startPeriod, status, userIds, withLocation"
            },
        )
