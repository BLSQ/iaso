import io

from datetime import date, datetime, timezone

import openpyxl

from rest_framework import status

from iaso import models as m
from iaso.test import APITestCase
from plugins.wfp.models import Beneficiary, Journey, Step, Visit
from plugins.wfp.permissions import WFP_BENEFICIARY_EXPORT_PERMISSION


BENEFICIARIES_URL = "/api/wfp/beneficiaries/"
CODA_EXPORT_URL = f"{BENEFICIARIES_URL}export/coda/"
RAW_EXPORT_URL = f"{BENEFICIARIES_URL}export/raw/"


class BeneficiariesTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="WFP")
        cls.other_account = m.Account.objects.create(name="Other")
        cls.form = m.Form.objects.create(name="Reference", form_id="reference")
        cls.entity_type = m.EntityType.objects.create(name="Child", reference_form=cls.form, account=cls.account)
        cls.other_entity_type = m.EntityType.objects.create(
            name="Other child", reference_form=cls.form, account=cls.other_account
        )
        cls.user = cls.create_user_with_profile(
            username="user", account=cls.account, permissions=[WFP_BENEFICIARY_EXPORT_PERMISSION]
        )

        cls.reference = m.Instance.objects.create(form=cls.form, json={"first_name": "Amina", "household": {"size": 5}})
        cls.entity = m.Entity.objects.create(entity_type=cls.entity_type, account=cls.account, attributes=cls.reference)
        cls.reference.entity = cls.entity
        cls.reference.save()
        cls.visit_instance = m.Instance.objects.create(
            form=cls.form, entity=cls.entity, json={"muac": "13.1", "referrer_name": "Fatou"}
        )
        cls.beneficiary = Beneficiary.objects.create(
            entity=cls.entity, account=cls.account, birth_date=date(2024, 1, 1), gender="Female"
        )
        cls.journey = Journey.objects.create(
            beneficiary=cls.beneficiary, nutrition_programme="BSFP", programme_type="U5", start_date=date(2026, 5, 1)
        )
        cls.visit = Visit.objects.create(
            journey=cls.journey,
            date=datetime(2026, 5, 1, 12, tzinfo=timezone.utc),
            muac_size="13.1",
            instance_id=cls.visit_instance.id,
        )
        Step.objects.create(
            visit=cls.visit, assistance_type="lns", quantity_given=14, instance_id=cls.visit_instance.id
        )

        cls.other_entity = m.Entity.objects.create(entity_type=cls.other_entity_type, account=cls.other_account)
        cls.other_beneficiary = Beneficiary.objects.create(
            entity=cls.other_entity, account=cls.other_account, birth_date=date(2023, 1, 1), gender="Male"
        )

    def _beneficiaries(self, params=None):
        self.client.force_authenticate(self.user)
        return self.assertJSONResponse(self.client.get(BENEFICIARIES_URL, params or {}), status.HTTP_200_OK)

    def test_requires_authentication(self):
        for url in [BENEFICIARIES_URL, CODA_EXPORT_URL, RAW_EXPORT_URL]:
            with self.subTest(url):
                self.assertEqual(self.client.get(url).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_is_limited_to_the_user_account(self):
        data = self._beneficiaries()
        self.assertEqual([b["id"] for b in data["results"]], [self.beneficiary.id])
        self.assertEqual(data["results"][0]["uuid"], str(self.entity.uuid))

    def test_list_shows_visits_and_counts(self):
        [beneficiary] = self._beneficiaries()["results"]
        self.assertEqual((beneficiary["journeys_count"], beneficiary["visits_count"]), (1, 1))
        [visit] = beneficiary["journeys"][0]["visits"]
        self.assertEqual(visit["id"], self.visit.id)
        self.assertEqual(visit["instance_id"], self.visit_instance.id)
        self.assertEqual([(s["assistance_type"], s["quantity_given"]) for s in visit["steps"]], [("lns", 14.0)])

    def test_programme_filter_keeps_all_journeys_in_counts(self):
        Journey.objects.create(beneficiary=self.beneficiary, nutrition_programme="TSFP", programme_type="U5")
        data = self._beneficiaries({"programme": "BSFP"})
        self.assertEqual([b["journeys_count"] for b in data["results"]], [2])
        self.assertEqual(self._beneficiaries({"programme": "OTP"})["results"], [])

    def test_beneficiary_data_shows_reference_and_submissions(self):
        self.client.force_authenticate(self.user)
        data = self.assertJSONResponse(
            self.client.get(f"{BENEFICIARIES_URL}{self.entity.id}/data/"), status.HTTP_200_OK
        )
        self.assertIn({"key": "first_name", "value": "Amina"}, data["attributes"])
        self.assertIn({"key": "household/size", "value": 5}, data["attributes"])
        self.assertEqual({s["id"] for s in data["submissions"]}, {self.reference.id, self.visit_instance.id})
        visit_submission = next(s for s in data["submissions"] if s["id"] == self.visit_instance.id)
        self.assertIn({"key": "referrer_name", "value": "Fatou"}, visit_submission["rows"])

    def test_submission_fields(self):
        self.client.force_authenticate(self.user)
        data = self.assertJSONResponse(
            self.client.get(f"{BENEFICIARIES_URL}submissions/{self.visit_instance.id}/fields/"), status.HTTP_200_OK
        )
        self.assertEqual(data["submission"]["id"], self.visit_instance.id)
        self.assertIn({"key": "referrer_name", "value": "Fatou"}, data["rows"])


class ExportTestData:
    """An entity with a reference submission, a visit and a medical submission, plus one in another account.

    A mixin, so that it can be combined with `iaso.test.TestCase` or `iaso.test.APITestCase`.
    """

    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="WFP")
        cls.other_account = m.Account.objects.create(name="Other")
        cls.user = cls.create_user_with_profile(
            username="user", account=cls.account, permissions=[WFP_BENEFICIARY_EXPORT_PERMISSION]
        )
        cls.reference_form = m.Form.objects.create(name="Reference", form_id="reference")
        cls.visit_form = m.Form.objects.create(name="Visit", form_id="visit")
        # the medical form has a PII configuration: only `passing_urine` is not personal data
        cls.medical_form = m.Form.objects.create(name="Medical", form_id="medical", non_pii_fields=["passing_urine"])
        entity_type = m.EntityType.objects.create(name="Child", reference_form=cls.reference_form, account=cls.account)

        country = m.OrgUnit.objects.create(name="South Sudan")
        state = m.OrgUnit.objects.create(name="Unity", parent=country)
        cls.facility = m.OrgUnit.objects.create(name="Bentiu PHCC", parent=state)

        cls.entity = m.Entity.objects.create(entity_type=entity_type, account=cls.account)
        day = datetime(2026, 5, 1, 9, tzinfo=timezone.utc)
        reference = m.Instance.objects.create(
            form=cls.reference_form,
            entity=cls.entity,
            org_unit=cls.facility,
            source_created_at=day,
            json={"first_name": "Amina", "is_twin": "no"},
        )
        cls.entity.attributes = reference
        cls.entity.save()
        anchor = m.Instance.objects.create(
            form=cls.visit_form,
            entity=cls.entity,
            org_unit=cls.facility,
            source_created_at=day.replace(hour=10),
            json={"muac": "13.1", "weight_kgs": "9.5"},
        )
        m.Instance.objects.create(
            form=cls.medical_form,
            entity=cls.entity,
            org_unit=cls.facility,
            source_created_at=day.replace(hour=11),
            json={"Passing_Urine": "yes", "fever": "1"},
        )
        beneficiary = Beneficiary.objects.create(
            entity=cls.entity, account=cls.account, birth_date=date(2024, 1, 15), gender="Female", guidelines="NEW"
        )
        journey = Journey.objects.create(
            beneficiary=beneficiary,
            nutrition_programme="TSFP",
            programme_type="U5",
            admission_criteria="muac",
            start_date=date(2026, 5, 1),
            instance_id=anchor.id,
        )
        visit = Visit.objects.create(
            journey=journey, date=day, number=1, org_unit=cls.facility, muac_size="13.1", instance_id=anchor.id
        )
        Step.objects.create(visit=visit, assistance_type="Soap", quantity_given=1, instance_id=anchor.id)

        other_entity_type = m.EntityType.objects.create(
            name="Other", reference_form=cls.reference_form, account=cls.other_account
        )
        cls.other_entity = m.Entity.objects.create(entity_type=other_entity_type, account=cls.other_account)
        Beneficiary.objects.create(entity=cls.other_entity, account=cls.other_account, birth_date=date(2023, 1, 1))


class CodaExportTestCase(ExportTestData, APITestCase):
    def _export(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(CODA_EXPORT_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        workbook = openpyxl.load_workbook(io.BytesIO(b"".join(response.streaming_content)))
        rows = list(workbook.active.iter_rows(values_only=True))
        headers = rows[1]
        return [dict(zip(headers, row)) for row in rows[2:]], rows[0]

    def test_one_row_per_visit_of_the_account(self):
        rows, steps = self._export()
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
        rows, _ = self._export()
        self.assertEqual(rows[0]["passing Urine?"], "yes")

    def test_personal_data_is_not_exported(self):
        rows, _ = self._export()
        # `fever` is not whitelisted in the PII configuration of the medical form
        self.assertIsNone(rows[0]["fever"])

    def test_export_uses_the_filters_of_the_list(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(CODA_EXPORT_URL, {"programme": "OTP"})
        workbook = openpyxl.load_workbook(io.BytesIO(b"".join(response.streaming_content)))
        self.assertEqual(len(list(workbook.active.iter_rows())), 2)  # the two header rows only


class RawExportTestCase(ExportTestData, APITestCase):
    def _export(self, params=None):
        self.client.force_authenticate(self.user)
        response = self.client.get(RAW_EXPORT_URL, params or {})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        workbook = openpyxl.load_workbook(io.BytesIO(b"".join(response.streaming_content)))
        sheets = {}
        for sheet in workbook.worksheets:
            rows = list(sheet.iter_rows(values_only=True))
            sheets[sheet.title] = [dict(zip(rows[0], row)) for row in rows[1:]] if rows else []
        return sheets

    def test_sheets(self):
        sheets = self._export()
        self.assertEqual(
            list(sheets),
            ["README", "beneficiaries", "journeys", "visits", "steps", "medical", "reference", "visit", "forms"],
        )

    def test_etl_tables_of_the_account(self):
        sheets = self._export()
        self.assertEqual([row["entity_uuid"] for row in sheets["beneficiaries"]], [str(self.entity.uuid)])
        self.assertEqual(len(sheets["journeys"]), 1)
        self.assertEqual(len(sheets["visits"]), 1)
        self.assertEqual(sheets["steps"][0]["assistance_type"], "Soap")

    def test_submissions_are_tied_to_the_etl_rows(self):
        sheets = self._export()
        visit = sheets["visits"][0]
        submission = sheets["visit"][0]
        self.assertEqual(submission["instance_id"], visit["instance_id"])
        self.assertEqual(submission["beneficiary_id"], visit["beneficiary_id"])
        self.assertEqual(submission["entity_uuid"], str(self.entity.uuid))
        self.assertEqual(submission["muac"], "13.1")
        self.assertEqual(sheets["reference"][0]["first_name"], "Amina")

    def test_personal_data_is_not_exported(self):
        medical = self._export()["medical"]
        self.assertEqual(medical[0]["Passing_Urine"], "yes")
        self.assertNotIn("fever", medical[0])

    def test_export_uses_the_filters_of_the_list(self):
        sheets = self._export({"programme": "OTP"})
        self.assertEqual(sheets["beneficiaries"], [])
        self.assertEqual(sheets["forms"], [])


class OrgUnitScopeTestData(ExportTestData):
    """Bentiu PHCC is in the group of a partner, Rubkona PHCC is not.

    The beneficiary of `ExportTestData` gets a second visit in Rubkona, and another beneficiary only visits Rubkona.
    """

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        data_source = m.DataSource.objects.create(name="South Sudan")
        version = m.SourceVersion.objects.create(data_source=data_source, number=1)
        data_source.projects.set([m.Project.objects.create(name="CODA", app_id="coda", account=cls.account)])
        m.OrgUnit.objects.update(version=version)
        cls.other_facility = m.OrgUnit.objects.create(name="Rubkona PHCC", parent=cls.facility.parent, version=version)
        cls.group = m.Group.objects.create(name="Friendship", source_version=version)
        cls.group.org_units.set([cls.facility])

        day = datetime(2026, 5, 15, 10, tzinfo=timezone.utc)
        journey = Journey.objects.get(beneficiary__entity=cls.entity)
        cls.rubkona_instance = m.Instance.objects.create(
            form=cls.visit_form,
            entity=cls.entity,
            org_unit=cls.other_facility,
            source_created_at=day,
            json={"muac": "12.4"},
        )
        Visit.objects.create(
            journey=journey,
            date=day,
            number=2,
            org_unit=cls.other_facility,
            muac_size="12.4",
            instance_id=cls.rubkona_instance.id,
        )

        cls.rubkona_entity = m.Entity.objects.create(entity_type=cls.entity.entity_type, account=cls.account)
        rubkona_beneficiary = Beneficiary.objects.create(
            entity=cls.rubkona_entity, account=cls.account, birth_date=date(2025, 2, 1)
        )
        rubkona_journey = Journey.objects.create(beneficiary=rubkona_beneficiary, nutrition_programme="TSFP")
        Visit.objects.create(journey=rubkona_journey, date=day, number=1, org_unit=cls.other_facility)

        cls.partner = cls.create_user_with_profile(
            username="partner",
            account=cls.account,
            org_units=[cls.facility],
            permissions=[WFP_BENEFICIARY_EXPORT_PERMISSION],
        )


class OrgUnitScopeTestCase(OrgUnitScopeTestData, APITestCase):
    def _workbook(self, url, user, params=None):
        self.client.force_authenticate(user)
        response = self.client.get(url, params or {})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return openpyxl.load_workbook(io.BytesIO(b"".join(response.streaming_content)))

    def _coda_facilities(self, user, params=None):
        rows = list(self._workbook(CODA_EXPORT_URL, user, params).active.iter_rows(values_only=True))
        column = rows[1].index("health center name")
        return sorted(row[column] for row in rows[2:])

    def _raw_sheets(self, user, params=None):
        sheets = {}
        for sheet in self._workbook(RAW_EXPORT_URL, user, params).worksheets:
            rows = list(sheet.iter_rows(values_only=True))
            sheets[sheet.title] = [dict(zip(rows[0], row)) for row in rows[1:]] if rows else []
        return sheets

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
