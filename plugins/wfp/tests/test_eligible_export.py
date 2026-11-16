import io

from datetime import date, datetime, timezone
from unittest import mock

import openpyxl

from rest_framework import status

from iaso import models as m
from iaso.test import APITestCase
from plugins.wfp.models import Beneficiary, Journey, Visit
from plugins.wfp.permissions import WFP_BENEFICIARY_EXPORT_PERMISSION
from plugins.wfp.utils.eligible_export import current_period


ELIGIBLE_EXPORT_URL = "/api/wfp/beneficiaries/export/eligible/"
TODAY = date(2026, 11, 13)  # period from 2026-10-26 to 2026-11-25


def _at(day, hour=12):
    return datetime(day.year, day.month, day.day, hour, tzinfo=timezone.utc)


class CurrentPeriodTestCase(APITestCase):
    def test_from_the_26th_of_the_previous_month_to_the_25th(self):
        self.assertEqual(current_period(date(2026, 11, 13)), (date(2026, 10, 26), date(2026, 11, 25)))
        self.assertEqual(current_period(date(2026, 1, 31)), (date(2025, 12, 26), date(2026, 1, 25)))


@mock.patch("plugins.wfp.utils.eligible_export.timezone.localdate", lambda: TODAY)
class EligibleExportTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="WFP")
        cls.user = cls.create_user_with_profile(
            username="user", account=cls.account, permissions=[WFP_BENEFICIARY_EXPORT_PERMISSION]
        )
        cls.child_form = m.Form.objects.create(name="Child registration", form_id="child_registration")
        cls.woman_form = m.Form.objects.create(name="PBWG registration", form_id="pbwg_registration")
        cls.visit_form = m.Form.objects.create(name="Visit", form_id="visit")
        cls.children = m.EntityType.objects.create(name="U5", reference_form=cls.child_form, account=cls.account)
        cls.women = m.EntityType.objects.create(name="PBWG", reference_form=cls.woman_form, account=cls.account)
        camp = m.OrgUnit.objects.create(name="Camp 1E")
        cls.inf = m.OrgUnit.objects.create(name="INF Kutupalong A", parent=camp)

    def _beneficiary(self, entity_type, form, json, birth_date, **journey):
        reference = m.Instance.objects.create(form=form, json=json)
        entity = m.Entity.objects.create(entity_type=entity_type, account=self.account, attributes=reference)
        beneficiary = Beneficiary.objects.create(
            entity=entity, account=self.account, birth_date=birth_date, gender="Female"
        )
        return Journey.objects.create(beneficiary=beneficiary, **journey)

    def _visit(self, journey, day, synced=None, json=None, **fields):
        instance = m.Instance.objects.create(
            form=self.visit_form, entity=journey.beneficiary.entity, org_unit=self.inf, json=json or {}
        )
        m.Instance.objects.filter(id=instance.id).update(created_at=synced or _at(day))
        return Visit.objects.create(
            journey=journey, date=_at(day), org_unit=self.inf, instance_id=instance.id, **fields
        )

    def _child(self, **journey):
        defaults = {"nutrition_programme": "BSFP", "programme_type": "U5"}
        return self._beneficiary(
            self.children,
            self.child_form,
            {"progress_id": "123456", "case_id": "CASE-1", "fcn_number": "FCN1", "camp": "Camp 1E"},
            date(2024, 1, 10),
            **{**defaults, **journey},
        )

    def _woman(self, physiology_status):
        return self._beneficiary(
            self.women,
            self.woman_form,
            {"progress_id": "654321", "case_id": "CASE-2", "fnc_number": "FCN2"},
            date(1996, 1, 1),
            nutrition_programme="BSFP",
            programme_type="PLW",
            physiology_status=physiology_status,
        )

    def _export(self, params):
        self.client.force_authenticate(self.user)
        response = self.client.get(ELIGIBLE_EXPORT_URL, params)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        workbook = openpyxl.load_workbook(io.BytesIO(b"".join(response.streaming_content)))
        sheets = {}
        for sheet in workbook.worksheets:
            rows = list(sheet.iter_rows(values_only=True))
            sheets[sheet.title] = [dict(zip(rows[0], row)) for row in rows[1:]]
        return sheets

    def test_requires_an_entity_type(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get(ELIGIBLE_EXPORT_URL).status_code, status.HTTP_400_BAD_REQUEST)

    def test_children_with_an_ongoing_journey_found_green(self):
        journey = self._child()
        self._visit(journey, date(2026, 9, 1), whz_color="Yellow")
        # the case id is only read from the registration form
        self._visit(
            journey, date(2026, 11, 5), synced=_at(date(2026, 11, 6)), whz_color="Green", json={"case_id": "OTHER"}
        )
        [row] = self._export({"entity_type": self.children.id})["BSFP"]
        self.assertEqual(row["Progress ID"], "123456")
        self.assertEqual(row["Entity ID"], journey.beneficiary.entity_id)
        self.assertEqual(row["UUID"], str(journey.beneficiary.entity.uuid))
        self.assertEqual(row["Case ID"], "CASE-1")
        self.assertEqual(row["FCN"], "FCN1")
        self.assertEqual(row["Date of Birth"].date(), date(2024, 1, 10))
        self.assertEqual(row["Age (months)"], 33)
        self.assertEqual(row["Sex"], "Female")
        self.assertEqual(row["Actual Visit Date"].date(), date(2026, 11, 5))
        self.assertEqual(row["Data Synchronisation Date"].date(), date(2026, 11, 6))
        self.assertEqual(row["Nutritional Status"], "Green")
        self.assertEqual(row["Name of INF"], "INF Kutupalong A")
        self.assertEqual(row["Beneficiary Location/Camp"], "Camp 1E")

    def test_not_eligible(self):
        exited = self._child(exit_type="cured")
        self._visit(exited, date(2026, 11, 5), whz_color="Green")
        yellow = self._child()
        self._visit(yellow, date(2026, 11, 5), whz_color="Yellow")
        late_sync = self._child()
        self._visit(late_sync, date(2026, 11, 5), synced=_at(date(2026, 11, 27)), whz_color="Green")
        self.assertEqual(self._export({"entity_type": self.children.id}), {"Eligible beneficiaries": []})

    def test_one_sheet_per_programme(self):
        self._visit(self._child(), date(2026, 11, 5), whz_color="Green")
        self._visit(self._child(nutrition_programme="NSEP"), date(2026, 11, 5), muac_size="13.0")
        sheets = self._export({"entity_type": self.children.id})
        self.assertEqual(sorted(sheets), ["BSFP", "NSEP"])
        self.assertEqual(sheets["NSEP"][0]["Nutritional Status"], "Normal")

    def test_women_visited_during_the_period_one_sheet_per_physiology_status(self):
        pregnant = self._woman("pregnant")
        self._visit(pregnant, date(2026, 11, 2), muac_size="24.1", json={"pregnancy_edd": "2027-01-15"})
        breastfeeding = self._woman("breastfeeding")
        self._visit(
            breastfeeding,
            date(2026, 10, 27),
            muac_size="23.5",
            json={"child_dob": "2026-08-01", "pregnancy_edd": "2026-07-30"},
        )
        before_the_period = self._woman("pregnant")
        self._visit(before_the_period, date(2026, 10, 20), muac_size="25.0")
        thin = self._woman("pregnant")
        self._visit(thin, date(2026, 11, 2), muac_size="22.0")

        sheets = self._export({"entity_type": self.women.id})
        self.assertEqual(sorted(sheets), ["BSFP Breastfeeding", "BSFP Pregnant"])
        [pregnant_row] = sheets["BSFP Pregnant"]
        self.assertEqual(pregnant_row["UUID"], str(pregnant.beneficiary.entity.uuid))
        self.assertEqual(pregnant_row["Case ID"], "CASE-2")
        self.assertEqual(pregnant_row["FCN"], "FCN2")
        self.assertEqual(pregnant_row["Age (years)"], 30)
        self.assertEqual(pregnant_row["Expected Date of Delivery (EDD)"].date(), date(2027, 1, 15))
        self.assertNotIn("Child Birth Date", pregnant_row)
        [breastfeeding_row] = sheets["BSFP Breastfeeding"]
        self.assertEqual(breastfeeding_row["UUID"], str(breastfeeding.beneficiary.entity.uuid))
        self.assertEqual(breastfeeding_row["Child Birth Date"].date(), date(2026, 8, 1))
        self.assertNotIn("Expected Date of Delivery (EDD)", breastfeeding_row)

    def test_the_colour_of_the_form_comes_before_the_thresholds(self):
        # Bangladesh: women are green from 21 cm
        green = self._woman("pregnant")
        self._visit(green, date(2026, 11, 2), muac_size="22.2", json={"_status": "green"})
        yellow = self._woman("pregnant")
        self._visit(yellow, date(2026, 11, 2), muac_size="23.5", json={"_status": "yellow"})
        [row] = self._export({"entity_type": self.women.id})["BSFP Pregnant"]
        self.assertEqual(row["UUID"], str(green.beneficiary.entity.uuid))
        self.assertEqual(row["Nutritional Status"], "Green")

    def test_bangladesh_forms(self):
        # the ETL found no physiology status: it is read from the visits, where it can change during the journey
        pregnant = self._woman(None)
        self._visit(pregnant, date(2026, 10, 1), json={"pregnancy_edd": "2027-06-22", "_status": "green"})
        self._visit(
            pregnant, date(2026, 11, 2), muac_size="21.0", json={"status_of_woman": "pregnant", "_status": "green"}
        )
        mother = self._woman(None)
        self._visit(
            mother,
            date(2026, 11, 3),
            muac_size="22.0",
            json={
                "status_of_woman": "breastfeeding",
                "_status": "green",
                "_final_child_dob": "2026-09-26T00:00:00.000+06:00",
            },
        )
        sheets = self._export({"entity_type": self.women.id})
        self.assertEqual(sorted(sheets), ["BSFP Breastfeeding", "BSFP Pregnant"])
        [pregnant_row] = sheets["BSFP Pregnant"]
        # the EDD is only asked at the first visit
        self.assertEqual(pregnant_row["Expected Date of Delivery (EDD)"].date(), date(2027, 6, 22))
        [mother_row] = sheets["BSFP Breastfeeding"]
        self.assertEqual(mother_row["Child Birth Date"].date(), date(2026, 9, 26))

    def test_period_given_by_start_and_end_dates(self):
        september = self._child()
        self._visit(september, date(2026, 9, 10), synced=_at(date(2026, 9, 12)), whz_color="Green")
        late_sync = self._child()
        self._visit(late_sync, date(2026, 9, 20), synced=_at(date(2026, 10, 2)), whz_color="Green")
        november = self._child()
        self._visit(november, date(2026, 11, 5), whz_color="Green")

        params = {"entity_type": self.children.id, "start_date": "2026-09-01", "end_date": "2026-09-30"}
        [row] = self._export(params)["BSFP"]
        self.assertEqual(row["UUID"], str(september.beneficiary.entity.uuid))
        self.assertEqual(row["Actual Visit Date"].date(), date(2026, 9, 10))
        # by default, the current period
        [row] = self._export({"entity_type": self.children.id})["BSFP"]
        self.assertEqual(row["UUID"], str(november.beneficiary.entity.uuid))

    def test_the_last_visit_of_the_period_is_exported(self):
        journey = self._child()
        self._visit(journey, date(2026, 9, 10), whz_color="Green")
        self._visit(journey, date(2026, 10, 10), whz_color="Yellow")
        params = {"entity_type": self.children.id, "start_date": "2026-09-01", "end_date": "2026-09-30"}
        self.assertEqual(len(self._export(params)["BSFP"]), 1)
        params["end_date"] = "2026-10-31"
        self.assertEqual(self._export(params), {"Eligible beneficiaries": []})

    def test_invalid_period(self):
        self.client.force_authenticate(self.user)
        for params in [{"start_date": "2026-10-01", "end_date": "2026-09-01"}, {"start_date": "01-09-2026"}]:
            with self.subTest(params):
                response = self.client.get(ELIGIBLE_EXPORT_URL, {"entity_type": self.children.id, **params})
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_no_future_date(self):
        self.client.force_authenticate(self.user)
        for params in [{"end_date": "2026-11-14"}, {"start_date": "2026-11-14"}]:
            with self.subTest(params):
                response = self.client.get(ELIGIBLE_EXPORT_URL, {"entity_type": self.children.id, **params})
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self._export({"entity_type": self.children.id, "end_date": TODAY.isoformat()})

    def test_the_default_period_ends_today_at_the_latest(self):
        # TODAY is the 13th: the visits made after it (e.g. planned ones) are not in the default period
        journey = self._child()
        self._visit(journey, date(2026, 11, 5), whz_color="Green")
        self._visit(journey, date(2026, 11, 20), synced=_at(date(2026, 11, 5)), whz_color="Yellow")
        [row] = self._export({"entity_type": self.children.id})["BSFP"]
        self.assertEqual(row["Actual Visit Date"].date(), date(2026, 11, 5))
