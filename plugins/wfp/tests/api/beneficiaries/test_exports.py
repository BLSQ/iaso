from datetime import datetime, timezone
from unittest import mock

from rest_framework import status

from iaso import models as m
from iaso.test import APITestCase
from plugins.wfp.models import Journey, Visit
from plugins.wfp.tests.api.beneficiaries.common import (
    CODA_EXPORT_URL,
    RAW_EXPORT_URL,
    BeneficiariesTestData,
    ExportTestData,
    OrgUnitScopeTestData,
    load_workbook,
    sheets_as_dicts,
)


class ExportsTestMixin:
    def _workbook(self, url, user, params=None):
        self.client.force_authenticate(user)
        response = self.client.get(url, params or {})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return load_workbook(response)

    def _coda_rows(self, user, params=None):
        """The rows of the CODA export (after its two header rows) and its first header row (the steps)."""
        rows = list(self._workbook(CODA_EXPORT_URL, user, params).active.iter_rows(values_only=True))
        headers = rows[1]
        return [dict(zip(headers, row)) for row in rows[2:]], rows[0]

    def _coda_facilities(self, user, params=None):
        rows, _ = self._coda_rows(user, params)
        return sorted(row["health center name"] for row in rows)

    def _raw_sheets(self, user, params=None):
        return sheets_as_dicts(self._workbook(RAW_EXPORT_URL, user, params))


class CodaExportTestCase(ExportsTestMixin, ExportTestData, APITestCase):
    def test_one_row_per_visit_of_the_account(self):
        rows, steps = self._coda_rows(self.user)
        self.assertEqual(steps[0], "Beneficiary details")
        self.assertEqual(len(rows), 1)
        row = rows[0]
        self.assertEqual(row["beneficiary unique Identification"], str(self.entity.uuid))
        self.assertEqual(row["gender"], "Female")
        self.assertEqual(row["age (months for children, years for women)"], 27)
        self.assertEqual(row["health center name"], "Bentiu PHCC")
        self.assertEqual(row["state"], "Unity")
        self.assertEqual(row["State"], "Unity")
        self.assertEqual(row["programme"], "TSFP")
        self.assertEqual(row["treatment protocol"], "NEW")
        self.assertEqual(row["Is  registration visit"], "yes")
        self.assertEqual(row["MUAC"], "13.1")
        self.assertEqual(row["weight"], "9.5")
        self.assertEqual(row["soap"], "yes")
        self.assertEqual(row["Is twin?"], "no")

    def test_answers_of_the_visit_submissions_are_matched_loosely(self):
        rows, _ = self._coda_rows(self.user)
        self.assertEqual(rows[0]["passing Urine?"], "yes")

    def test_personal_data_is_not_exported(self):
        rows, _ = self._coda_rows(self.user)
        # `fever` is not whitelisted in the PII configuration of the medical form
        self.assertIsNone(rows[0]["fever"])

    def test_export_uses_the_filters_of_the_list(self):
        rows, _ = self._coda_rows(self.user, {"programme": "OTP"})
        self.assertEqual(rows, [])  # the two header rows only


class RawExportTestCase(ExportsTestMixin, ExportTestData, APITestCase):
    def test_sheets(self):
        sheets = self._raw_sheets(self.user)
        self.assertEqual(
            list(sheets),
            ["README", "beneficiaries", "journeys", "visits", "steps", "medical", "reference", "visit", "forms"],
        )

    def test_etl_tables_of_the_account(self):
        sheets = self._raw_sheets(self.user)
        self.assertEqual([row["entity_uuid"] for row in sheets["beneficiaries"]], [str(self.entity.uuid)])
        self.assertEqual(len(sheets["journeys"]), 1)
        self.assertEqual(len(sheets["visits"]), 1)
        self.assertEqual(sheets["steps"][0]["assistance_type"], "Soap")

    def test_submissions_are_tied_to_the_etl_rows(self):
        sheets = self._raw_sheets(self.user)
        visit = sheets["visits"][0]
        submission = sheets["visit"][0]
        self.assertEqual(submission["instance_id"], visit["instance_id"])
        self.assertEqual(submission["beneficiary_id"], visit["beneficiary_id"])
        self.assertEqual(submission["entity_uuid"], str(self.entity.uuid))
        self.assertEqual(submission["muac"], "13.1")
        self.assertEqual(sheets["reference"][0]["first_name"], "Amina")

    def test_personal_data_is_not_exported(self):
        medical = self._raw_sheets(self.user)["medical"]
        self.assertEqual(medical[0]["Passing_Urine"], "yes")
        self.assertNotIn("fever", medical[0])

    def test_export_uses_the_filters_of_the_list(self):
        sheets = self._raw_sheets(self.user, {"programme": "OTP"})
        self.assertEqual(sheets["beneficiaries"], [])
        self.assertEqual(sheets["forms"], [])


class OrgUnitScopeTestCase(ExportsTestMixin, OrgUnitScopeTestData, APITestCase):
    def test_coda_export_keeps_the_visits_in_the_group(self):
        self.assertEqual(self._coda_facilities(self.user), ["Bentiu PHCC", "Rubkona PHCC", "Rubkona PHCC"])
        self.assertEqual(self._coda_facilities(self.user, {"org_unit_group": self.group.id}), ["Bentiu PHCC"])

    def test_raw_export_keeps_the_visits_and_submissions_in_the_group(self):
        sheets = self._raw_sheets(self.user, {"org_unit_group": self.group.id})
        self.assertEqual([row["entity_id"] for row in sheets["beneficiaries"]], [self.entity.id])
        self.assertEqual(len(sheets["journeys"]), 1)
        self.assertEqual([row["org_unit_name"] for row in sheets["visits"]], ["Bentiu PHCC"])
        self.assertEqual(len(sheets["steps"]), 1)
        self.assertEqual([row["org_unit_name"] for row in sheets["visit"]], ["Bentiu PHCC"])

    def test_coda_export_keeps_the_visits_of_the_facility(self):
        params = {"org_unit_group": self.group.id, "facility": self.facility.id}
        self.assertEqual(self._coda_facilities(self.user, params), ["Bentiu PHCC"])
        self.assertEqual(self._coda_facilities(self.user, {"facility": self.other_facility.id}), ["Rubkona PHCC"] * 2)
        # a facility outside the selected partner: nothing
        params = {"org_unit_group": self.group.id, "facility": self.other_facility.id}
        self.assertEqual(self._coda_facilities(self.user, params), [])

    def test_raw_export_keeps_the_visits_and_submissions_of_the_facility(self):
        sheets = self._raw_sheets(self.user, {"facility": self.other_facility.id})
        self.assertEqual(
            sorted(row["entity_id"] for row in sheets["beneficiaries"]),
            sorted([self.entity.id, self.rubkona_entity.id]),
        )
        self.assertEqual([row["org_unit_name"] for row in sheets["visits"]], ["Rubkona PHCC"] * 2)
        self.assertEqual([row["instance_id"] for row in sheets["visit"]], [self.rubkona_instance.id])

    def test_raw_export_orders_the_visits_by_number(self):
        # a visit numbered after the others but dated before them
        journey = Journey.objects.get(beneficiary__entity=self.entity)
        Visit.objects.create(
            journey=journey, date=datetime(2026, 4, 1, 10, tzinfo=timezone.utc), number=3, org_unit=self.facility
        )
        sheets = self._raw_sheets(self.user)
        numbers = [row["number"] for row in sheets["visits"] if row["entity_id"] == self.entity.id]
        self.assertEqual(numbers, [1, 2, 3])

    def test_restricted_user_only_exports_their_facilities(self):
        self.assertEqual(self._coda_facilities(self.partner), ["Bentiu PHCC"])
        sheets = self._raw_sheets(self.partner)
        self.assertEqual([row["org_unit_name"] for row in sheets["visits"]], ["Bentiu PHCC"])
        self.assertNotIn(self.rubkona_instance.id, [row["instance_id"] for row in sheets["visit"]])

    def test_exports_have_the_groups_of_the_org_units(self):
        other_group = m.Group.objects.create(name="Bentiu county", source_version=self.group.source_version)
        other_group.org_units.set([self.facility])
        expected = {
            "Bentiu PHCC": (
                f"{other_group.id}, {self.group.id}",
                "Bentiu county (South Sudan), Friendship (South Sudan)",
            ),
            "Rubkona PHCC": (None, None),
        }

        rows = list(self._workbook(CODA_EXPORT_URL, self.user).active.iter_rows(values_only=True))
        headers = rows[1]
        self.assertEqual(
            headers[headers.index("health center name") + 1 : headers.index("health center name") + 3],
            ("health center group name", "health center group id"),
        )
        for row in rows[2:]:
            row = dict(zip(headers, row))
            group_id, group_name = expected[row["health center name"]]
            self.assertEqual((row["health center group id"], row["health center group name"]), (group_id, group_name))

        sheets = self._raw_sheets(self.user)
        for sheet in ("visits", "visit"):
            self.assertEqual(
                list(sheets[sheet][0])[list(sheets[sheet][0]).index("org_unit_id") :][:4],
                ["org_unit_id", "org_unit_name", "org_unit_group_id", "org_unit_group_name"],
            )
            for row in sheets[sheet]:
                self.assertEqual((row["org_unit_group_id"], row["org_unit_group_name"]), expected[row["org_unit_name"]])


class ExportResponseTestCase(ExportsTestMixin, BeneficiariesTestData, APITestCase):
    """The exports are downloaded right away (no background task), whatever their size."""

    def test_coda_export_is_downloaded_right_away(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(CODA_EXPORT_URL, {"org_unit_group": self.group.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('filename="coda-2-export-', response["Content-Disposition"])
        rows = list(load_workbook(response).active.iter_rows(values_only=True))
        column = rows[1].index("health center name")
        self.assertEqual([row[column] for row in rows[2:]], ["Bentiu PHCC"])
        self.assertFalse(m.Task.objects.exists())

    @mock.patch("plugins.wfp.utils.coda_export.BATCH_SIZE", 1)
    def test_coda_export_of_several_batches(self):
        self.assertEqual(self._coda_facilities(self.user), ["Bentiu PHCC", "Rubkona PHCC", "Rubkona PHCC"])

    def test_raw_export_is_downloaded_right_away(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(RAW_EXPORT_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('filename="wfp-raw-data-', response["Content-Disposition"])
        self.assertEqual(len(sheets_as_dicts(load_workbook(response))["visits"]), 3)

    def test_exports_do_not_contain_personal_data(self):
        workbook = self._workbook(RAW_EXPORT_URL, self.user)
        values = {
            str(value) for sheet in workbook.worksheets for row in sheet.iter_rows(values_only=True) for value in row
        }
        self.assertNotIn("fever", values)

    def test_exports_with_a_group_of_another_account_are_empty(self):
        params = {"org_unit_group": self.other_group.id}
        rows, _ = self._coda_rows(self.user, params)
        self.assertEqual(rows, [])  # the two header rows only
        self.assertEqual(self._raw_sheets(self.user, params)["visits"], [])
