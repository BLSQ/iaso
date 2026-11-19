import io

from datetime import date, datetime, timezone
from unittest import mock

import openpyxl

from rest_framework import status

from iaso import models as m
from iaso.test import APITestCase, TestCase
from plugins.wfp.api.beneficiaries.serializers import EligibleExportParamsSerializer
from plugins.wfp.models import NUTRITION_PROGRAMMES, PROGRAMME_TYPE, Beneficiary, Journey, Visit
from plugins.wfp.permissions import WFP_BENEFICIARY_EXPORT_PERMISSION
from plugins.wfp.programmes_by_country import (
    PROGRAMMES_BY_COUNTRY,
    PROGRAMMES_BY_ENTITY_TYPE,
    EntityTypeProgrammes,
)
from plugins.wfp.utils.eligible_export import PBWG, U5, _sheet_name, current_period


ELIGIBLE_EXPORT_URL = "/api/wfp/beneficiaries/export/eligible/"
TODAY = date(2026, 11, 13)  # period from 2026-10-26 to 2026-11-25


def _at(day, hour=12):
    return datetime(day.year, day.month, day.day, hour, tzinfo=timezone.utc)


class CurrentPeriodTestCase(TestCase):
    def test_from_the_26th_of_the_previous_month_to_the_25th(self):
        # in the middle of the month
        expected = (date(2026, 10, 26), date(2026, 11, 25))
        actual = current_period(date(2026, 11, 13))
        self.assertEqual(actual, expected)

        # end of January: the period of the calendar month, started in December of the previous year
        expected = (date(2025, 12, 26), date(2026, 1, 25))
        actual = current_period(date(2026, 1, 31))
        self.assertEqual(actual, expected)


class SheetNameTestCase(TestCase):
    def test_programme_postfixed_with_the_entity_type_and_the_physiology_status(self):
        taken = set()
        self.assertEqual(_sheet_name("BSFP", "Child Under 5", U5, "", taken), "BSFP Child Under 5")
        self.assertEqual(_sheet_name("BSFP", "PBWG", PBWG, "pregnant", taken), "BSFP PBWG Pregnant")
        self.assertEqual(_sheet_name("BSFP", "PBWG", PBWG, "", taken), "BSFP PBWG Unknown status")

    def test_names_are_short_and_unique(self):
        taken = set()
        long_type = "Pregnant and breastfeeding women and girls"
        first = _sheet_name("TSFP", long_type, PBWG, "pregnant", taken)
        second = _sheet_name("TSFP", long_type, PBWG, "breastfeeding", taken)
        self.assertEqual(first, "TSFP Pregnant and breastfeeding")
        self.assertEqual(second, "TSFP Pregnant and breastfeedi 2")
        self.assertTrue(all(len(name) <= 31 for name in (first, second)))


class ProgrammesByCountryTestCase(TestCase):
    def test_only_known_programmes_and_programme_types(self):
        programmes = {value for value, _ in NUTRITION_PROGRAMMES}
        programme_types = {value for value, _ in PROGRAMME_TYPE}
        for country, entity_types in PROGRAMMES_BY_COUNTRY.items():
            for code, configured in entity_types.items():
                with self.subTest(country=country, code=code):
                    self.assertIn(configured.programme_type, programme_types)
                    self.assertLessEqual(set(configured.programmes), programmes)


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
        cls.children = m.EntityType.objects.create(
            name="Child Under 5", reference_form=cls.child_form, account=cls.account
        )
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

    def _export(self, params=None):
        self.client.force_authenticate(self.user)
        response = self.client.get(ELIGIBLE_EXPORT_URL, params or {})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        workbook = openpyxl.load_workbook(io.BytesIO(b"".join(response.streaming_content)))
        sheets = {}
        for sheet in workbook.worksheets:
            rows = list(sheet.iter_rows(values_only=True))
            sheets[sheet.title] = [dict(zip(rows[0], row)) for row in rows[1:]]
        return sheets

    def test_without_entity_type_children_and_women_are_exported(self):
        child = self._child()
        self._visit(child, date(2026, 11, 5), whz_color="Green")
        woman = self._woman("pregnant")
        self._visit(woman, date(2026, 11, 2), muac_size="24.1")

        sheets = self._export()
        # the programme has both kinds of beneficiaries: one sheet per kind, as their columns differ
        self.assertEqual(sorted(sheets), ["BSFP Child Under 5", "BSFP PBWG Pregnant"])
        [child_row] = sheets["BSFP Child Under 5"]
        self.assertEqual(child_row["Entity ID"], child.beneficiary.entity_id)
        self.assertIn("Date of Birth", child_row)
        [woman_row] = sheets["BSFP PBWG Pregnant"]
        self.assertEqual(woman_row["Entity ID"], woman.beneficiary.entity_id)
        self.assertIn("Expected Date of Delivery (EDD)", woman_row)

        # with an entity type, only its beneficiaries
        expected = ["BSFP Child Under 5"]
        actual = sorted(self._export({"entity_type": self.children.id}))
        self.assertEqual(actual, expected)

        expected = ["BSFP PBWG Pregnant"]
        actual = sorted(self._export({"entity_type": self.women.id}))
        self.assertEqual(actual, expected)

    def test_children_with_an_ongoing_journey_found_green(self):
        journey = self._child()
        self._visit(journey, date(2026, 9, 1), whz_color="Yellow")
        # the case id is only read from the registration form
        self._visit(
            journey, date(2026, 11, 5), synced=_at(date(2026, 11, 6)), whz_color="Green", json={"case_id": "OTHER"}
        )
        [row] = self._export({"entity_type": self.children.id})["BSFP Child Under 5"]
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
        self.assertEqual(sorted(sheets), ["BSFP Child Under 5", "NSEP Child Under 5"])
        self.assertEqual(sheets["NSEP Child Under 5"][0]["Nutritional Status"], "Normal")

    def _entity_ids_by_sheet(self, params=None):
        """[(sheet name, entity ids of its rows)], both in the order of the file."""
        return [(name, [row["Entity ID"] for row in rows]) for name, rows in self._export(params).items()]

    @mock.patch("plugins.wfp.utils.eligible_export.BATCH_SIZE", 2)  # the rows of a sheet span several batches
    def test_order_of_the_sheets_and_rows_with_filters(self):
        # created interleaved: the beneficiaries of a sheet are not created one after the other
        child_1 = self._child()
        self._visit(child_1, date(2026, 11, 5), whz_color="Green")
        pregnant_1 = self._woman("pregnant")
        self._visit(pregnant_1, date(2026, 11, 2), muac_size="24.1")
        nsep_child = self._child(nutrition_programme="NSEP")
        self._visit(nsep_child, date(2026, 11, 3), muac_size="13.0")
        child_2 = self._child()
        self._visit(child_2, date(2026, 10, 28), whz_color="Green")
        yellow_child = self._child()  # not eligible: never in the export
        self._visit(yellow_child, date(2026, 11, 4), whz_color="Yellow")
        breastfeeding = self._woman("breastfeeding")
        self._visit(breastfeeding, date(2026, 11, 1), muac_size="23.5")
        pregnant_2 = self._woman("pregnant")
        self._visit(pregnant_2, date(2026, 10, 27), muac_size="24.5")
        child_3 = self._child()
        self._visit(child_3, date(2026, 11, 10), whz_color="Green")

        def ids(*journeys):
            return [journey.beneficiary.entity_id for journey in journeys]

        # no filter: the sheets sorted by programme, entity type and physiology status, the rows by beneficiary
        expected = [
            ("BSFP Child Under 5", ids(child_1, child_2, child_3)),
            ("BSFP PBWG Breastfeeding", ids(breastfeeding)),
            ("BSFP PBWG Pregnant", ids(pregnant_1, pregnant_2)),
            ("NSEP Child Under 5", ids(nsep_child)),
        ]
        actual = self._entity_ids_by_sheet()
        self.assertEqual(actual, expected)

        # entity type: only the children, in the same order
        expected = [
            ("BSFP Child Under 5", ids(child_1, child_2, child_3)),
            ("NSEP Child Under 5", ids(nsep_child)),
        ]
        actual = self._entity_ids_by_sheet({"entity_type": self.children.id})
        self.assertEqual(actual, expected)

        # programme and entity type: the BSFP women
        expected = [
            ("BSFP PBWG Breastfeeding", ids(breastfeeding)),
            ("BSFP PBWG Pregnant", ids(pregnant_1, pregnant_2)),
        ]
        actual = self._entity_ids_by_sheet({"programme": "BSFP", "entity_type": self.women.id})
        self.assertEqual(actual, expected)

        # visit period: without the beneficiaries last visited in October (child 2 and pregnant 2)
        expected = [
            ("BSFP Child Under 5", ids(child_1, child_3)),
            ("BSFP PBWG Breastfeeding", ids(breastfeeding)),
            ("BSFP PBWG Pregnant", ids(pregnant_1)),
            ("NSEP Child Under 5", ids(nsep_child)),
        ]
        actual = self._entity_ids_by_sheet({"visit_date_after": "2026-11-01", "visit_date_before": "2026-11-13"})
        self.assertEqual(actual, expected)

        # every filter at once
        expected = [("BSFP Child Under 5", ids(child_1, child_3))]
        actual = self._entity_ids_by_sheet(
            {
                "entity_type": self.children.id,
                "programme": "BSFP",
                "visit_date_after": "2026-11-01",
                "visit_date_before": "2026-11-13",
            }
        )
        self.assertEqual(actual, expected)

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
        self.assertEqual(sorted(sheets), ["BSFP PBWG Breastfeeding", "BSFP PBWG Pregnant"])
        [pregnant_row] = sheets["BSFP PBWG Pregnant"]
        self.assertEqual(pregnant_row["UUID"], str(pregnant.beneficiary.entity.uuid))
        self.assertEqual(pregnant_row["Case ID"], "CASE-2")
        self.assertEqual(pregnant_row["FCN"], "FCN2")
        self.assertEqual(pregnant_row["Age (years)"], 30)
        self.assertEqual(pregnant_row["Expected Date of Delivery (EDD)"].date(), date(2027, 1, 15))
        self.assertNotIn("Child Birth Date", pregnant_row)
        [breastfeeding_row] = sheets["BSFP PBWG Breastfeeding"]
        self.assertEqual(breastfeeding_row["UUID"], str(breastfeeding.beneficiary.entity.uuid))
        self.assertEqual(breastfeeding_row["Child Birth Date"].date(), date(2026, 8, 1))
        self.assertNotIn("Expected Date of Delivery (EDD)", breastfeeding_row)

    def test_the_colour_of_the_form_comes_before_the_thresholds(self):
        # Bangladesh: women are green from 21 cm
        green = self._woman("pregnant")
        self._visit(green, date(2026, 11, 2), muac_size="22.2", json={"_status": "green"})
        yellow = self._woman("pregnant")
        self._visit(yellow, date(2026, 11, 2), muac_size="23.5", json={"_status": "yellow"})
        [row] = self._export({"entity_type": self.women.id})["BSFP PBWG Pregnant"]
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
        self.assertEqual(sorted(sheets), ["BSFP PBWG Breastfeeding", "BSFP PBWG Pregnant"])
        [pregnant_row] = sheets["BSFP PBWG Pregnant"]
        # the EDD is only asked at the first visit
        self.assertEqual(pregnant_row["Expected Date of Delivery (EDD)"].date(), date(2027, 6, 22))
        [mother_row] = sheets["BSFP PBWG Breastfeeding"]
        self.assertEqual(mother_row["Child Birth Date"].date(), date(2026, 9, 26))

    def test_period_given_by_start_and_end_dates(self):
        september = self._child()
        self._visit(september, date(2026, 9, 10), synced=_at(date(2026, 9, 12)), whz_color="Green")
        late_sync = self._child()
        self._visit(late_sync, date(2026, 9, 20), synced=_at(date(2026, 10, 2)), whz_color="Green")
        november = self._child()
        self._visit(november, date(2026, 11, 5), whz_color="Green")

        params = {"entity_type": self.children.id, "visit_date_after": "2026-09-01", "visit_date_before": "2026-09-30"}
        [row] = self._export(params)["BSFP Child Under 5"]
        self.assertEqual(row["UUID"], str(september.beneficiary.entity.uuid))
        self.assertEqual(row["Actual Visit Date"].date(), date(2026, 9, 10))
        # by default, the current period
        [row] = self._export({"entity_type": self.children.id})["BSFP Child Under 5"]
        self.assertEqual(row["UUID"], str(november.beneficiary.entity.uuid))

    def test_the_last_visit_of_the_period_is_exported(self):
        journey = self._child()
        self._visit(journey, date(2026, 9, 10), whz_color="Green")
        self._visit(journey, date(2026, 10, 10), whz_color="Yellow")
        params = {"entity_type": self.children.id, "visit_date_after": "2026-09-01", "visit_date_before": "2026-09-30"}
        self.assertEqual(len(self._export(params)["BSFP Child Under 5"]), 1)
        params["visit_date_before"] = "2026-10-31"
        self.assertEqual(self._export(params), {"Eligible beneficiaries": []})

    def _period_errors(self, **params):
        """The errors of the eligible export for an invalid period, by field."""
        response = self.client.get(ELIGIBLE_EXPORT_URL, {"entity_type": self.children.id, **params})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        return response.json()

    def test_invalid_date_format(self):
        self.client.force_authenticate(self.user)
        for field in ["visit_date_after", "visit_date_before"]:
            with self.subTest(field):
                self.assertEqual(
                    self._period_errors(**{field: "01-09-2026"}),
                    {field: ["Date has wrong format. Use one of these formats instead: YYYY-MM-DD."]},
                )

    def test_end_date_before_start_date(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(
            self._period_errors(visit_date_after="2026-10-01", visit_date_before="2026-09-01"),
            {"visit_date_before": ["The end date must be after the start date."]},
        )

    def test_no_future_date(self):
        self.client.force_authenticate(self.user)
        future = "The date cannot be in the future."
        for field in ["visit_date_after", "visit_date_before"]:
            with self.subTest(field):
                self.assertEqual(self._period_errors(**{field: "2026-11-14"}), {field: [future]})
        # both dates in the future: each field gets its own error
        self.assertEqual(
            self._period_errors(visit_date_after="2026-11-14", visit_date_before="2026-11-15"),
            {"visit_date_after": [future], "visit_date_before": [future]},
        )

    def test_period_error_codes(self):
        # the codes identify each error, whatever the language of the message
        for data, codes in [
            ({"visit_date_after": "2026-11-14"}, {"visit_date_after": ["future_date"]}),
            ({"visit_date_before": "2026-11-14"}, {"visit_date_before": ["future_date"]}),
            (
                {"visit_date_after": "2026-10-01", "visit_date_before": "2026-09-01"},
                {"visit_date_before": ["end_before_start"]},
            ),
            ({"visit_date_after": "01-09-2026"}, {"visit_date_after": ["invalid"]}),
        ]:
            with self.subTest(data):
                period = EligibleExportParamsSerializer(data=data)
                self.assertFalse(period.is_valid())
                self.assertEqual(
                    {key: [error.code for error in errors] for key, errors in period.errors.items()}, codes
                )

    def test_visit_date_filters_give_the_period_of_the_export(self):
        period = EligibleExportParamsSerializer(
            data={"visit_date_after": "2026-09-01", "visit_date_before": "2026-09-30", "search": "ignored"}
        )
        self.assertTrue(period.is_valid())
        self.assertEqual(period.validated_data, {"start_date": date(2026, 9, 1), "end_date": date(2026, 9, 30)})

    def test_the_default_period_ends_today_at_the_latest(self):
        # TODAY is the 13th: the visits made after it (e.g. planned ones) are not in the default period
        journey = self._child()
        self._visit(journey, date(2026, 11, 5), whz_color="Green")
        self._visit(journey, date(2026, 11, 20), synced=_at(date(2026, 11, 5)), whz_color="Yellow")
        [row] = self._export({"entity_type": self.children.id})["BSFP Child Under 5"]
        self.assertEqual(row["Actual Visit Date"].date(), date(2026, 11, 5))

    def _with_etl_codes(self):
        """The entity types of the ETL (known by their code) have the sheets of the programmes of their country.

        A fixed configuration, so that the tests don't depend on the one of the real countries.
        """
        configuration = {
            "test_under5": EntityTypeProgrammes("U5", ["BSFP", "NSEP"]),
            "test_pbwg": EntityTypeProgrammes("PLW", ["BSFP", "NSEP"]),
        }
        patcher = mock.patch.dict(PROGRAMMES_BY_ENTITY_TYPE, configuration, clear=True)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.children.code = "test_under5"
        self.children.save()
        self.women.code = "test_pbwg"
        self.women.save()
        # not an entity type of the ETL: no sheet without data
        m.EntityType.objects.create(name="Household", account=self.account, code="household")

    def test_the_programmes_of_the_country_have_their_sheets_even_without_data(self):
        self._with_etl_codes()
        journey = self._child()
        self._visit(journey, date(2026, 11, 5), whz_color="Green")
        expected = [
            "BSFP Child Under 5",
            "BSFP PBWG Breastfeeding",
            "BSFP PBWG Pregnant",
            "NSEP Child Under 5",
            "NSEP PBWG Breastfeeding",
            "NSEP PBWG Pregnant",
        ]
        sheets = self._export()
        self.assertEqual(list(sheets), expected)
        [row] = sheets["BSFP Child Under 5"]
        self.assertEqual(row["Entity ID"], journey.beneficiary.entity_id)
        [empty] = sheets["NSEP PBWG Pregnant"]
        self.assertEqual(empty["Entity ID"], "No data")
        self.assertIn("Expected Date of Delivery (EDD)", empty)
        [empty] = sheets["NSEP Child Under 5"]
        self.assertEqual(empty["Entity ID"], "No data")

    def test_a_programme_out_of_the_country_still_has_its_data(self):
        self._with_etl_codes()
        journey = self._child(nutrition_programme="TSFP")
        self._visit(journey, date(2026, 11, 5), whz_color="Green")
        sheets = self._export({"entity_type": self.children.id})
        expected = ["TSFP Child Under 5", "BSFP Child Under 5", "NSEP Child Under 5"]
        self.assertEqual(list(sheets), expected)

    def test_only_the_sheets_of_the_selected_programme_and_entity_type(self):
        self._with_etl_codes()
        sheets = self._export({"programme": "BSFP"})
        expected = ["BSFP Child Under 5", "BSFP PBWG Breastfeeding", "BSFP PBWG Pregnant"]
        self.assertEqual(list(sheets), expected)
        self.assertEqual([[row["Entity ID"] for row in rows] for rows in sheets.values()], [["No data"]] * 3)

        sheets = self._export({"programme": "NSEP", "entity_type": self.children.id})
        self.assertEqual(list(sheets), ["NSEP Child Under 5"])
        self.assertEqual(self._export({"programme": "TSFP"}), {"Eligible beneficiaries": []})
