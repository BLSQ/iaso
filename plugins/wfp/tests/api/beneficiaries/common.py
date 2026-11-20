"""Test data and helpers shared by the tests of `/api/wfp/beneficiaries/`."""

import io

from datetime import UTC, date, datetime

import openpyxl

from django.db.models import Max
from rest_framework import status

from iaso import models as m
from plugins.wfp.models import Beneficiary, Journey, Step, Visit
from plugins.wfp.permissions import WFP_BENEFICIARY_EXPORT_PERMISSION


BENEFICIARIES_URL = "/api/wfp/beneficiaries/"
FACILITIES_URL = f"{BENEFICIARIES_URL}facilities/"
CODA_EXPORT_URL = f"{BENEFICIARIES_URL}export/coda/"
RAW_EXPORT_URL = f"{BENEFICIARIES_URL}export/raw/"
ELIGIBLE_EXPORT_URL = f"{BENEFICIARIES_URL}export/eligible/"

# values of an id query param that are not ids: rejected with a 400
INVALID_IDS = ("abc", "-1", "0", "1.5")


def load_workbook(response):
    """The xlsx workbook streamed by an export."""
    return openpyxl.load_workbook(io.BytesIO(b"".join(response.streaming_content)))


def sheets_as_dicts(workbook):
    """{sheet title: [row as {header: value}]}, for the sheets with their headers on the first row."""
    sheets = {}
    for sheet in workbook.worksheets:
        rows = list(sheet.iter_rows(values_only=True))
        sheets[sheet.title] = [dict(zip(rows[0], row, strict=False)) for row in rows[1:]] if rows else []
    return sheets


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

        cls.entity = m.Entity.objects.create(
            # fixed, starting with a letter: a random one starting with 8 digits would be searched as an entity id
            uuid="a3c5e7f9-1b2d-4f6a-8c9e-0d1f2a3b4c5d",
            entity_type=entity_type,
            account=cls.account,
        )
        day = datetime(2026, 5, 1, 9, tzinfo=UTC)
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

        day = datetime(2026, 5, 15, 10, tzinfo=UTC)
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


class BeneficiariesTestData(OrgUnitScopeTestData):
    """The data of `OrgUnitScopeTestData`, plus a group of the account with Rubkona only.

    Plus another account with its own project, pyramid, group and beneficiary, to check that its ids match nothing.
    Also gives the helpers to call the list of beneficiaries.
    """

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        # a group of the account with Rubkona only: outside the facilities of the partner
        cls.rubkona_group = m.Group.objects.create(name="Rubkona", source_version=cls.group.source_version)
        cls.rubkona_group.org_units.set([cls.other_facility])

        other_source = m.DataSource.objects.create(name="Other source")
        other_version = m.SourceVersion.objects.create(data_source=other_source, number=1)
        other_project = m.Project.objects.create(name="Other", app_id="other", account=cls.other_account)
        other_source.projects.set([other_project])
        other_facility = m.OrgUnit.objects.create(name="Other PHCC", version=other_version)
        cls.other_group = m.Group.objects.create(name="Other partner", source_version=other_version)
        cls.other_group.org_units.set([other_facility])
        other_journey = Journey.objects.create(
            beneficiary=Beneficiary.objects.get(entity=cls.other_entity), nutrition_programme="TSFP"
        )
        Visit.objects.create(
            journey=other_journey, date=datetime(2026, 5, 2, tzinfo=UTC), number=1, org_unit=other_facility
        )
        cls.other_instance = m.Instance.objects.create(
            form=cls.visit_form, entity=cls.other_entity, org_unit=other_facility, json={"muac": "11.0"}
        )
        cls.other_user = cls.create_user_with_profile(
            username="other", account=cls.other_account, permissions=[WFP_BENEFICIARY_EXPORT_PERMISSION]
        )

    @staticmethod
    def _missing_id(model):
        """An id that no row of `model` has."""
        return (model.objects.aggregate(Max("id"))["id__max"] or 0) + 1000

    def _beneficiaries(self, user, params=None):
        self.client.force_authenticate(user)
        response = self.client.get(BENEFICIARIES_URL, params or {})
        return self.assertJSONResponse(response, status.HTTP_200_OK)

    def _entity_ids(self, user, params=None):
        return sorted(b["entity_id"] for b in self._beneficiaries(user, params)["results"])
