import datetime

import time_machine

from django.db import IntegrityError

from iaso import models as m
from iaso.test import TestCase
from plugins.polio import models as pm


DT = datetime.datetime(2024, 10, 29, 14, 0, 0, 0, tzinfo=datetime.timezone.utc)


@time_machine.travel(DT, tick=False)
class OutgoingStockMovementModelTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up data for the whole TestCase
        cls.now = DT
        cls.account = m.Account.objects.create(name="test_account")
        cls.project = m.Project.objects.create(name="Polio", app_id="polio.projects", account=cls.account)
        cls.org_unit_type_country = m.OrgUnitType.objects.create(name="COUNTRY", category="COUNTRY")
        cls.org_unit_type_country.projects.set([cls.project])
        cls.org_unit_type_country.save()
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.data_source.projects.set([cls.project])
        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)

        cls.country = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="Testland",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="TestlandRef",
        )

        cls.country_2 = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="Testland 2",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="TestlandRef2",
        )

        cls.campaign = pm.Campaign.objects.create(
            obr_name="Test Campaign",
            country=cls.country,
            account=cls.account,
        )

        cls.campaign_round_1 = pm.Round.objects.create(
            campaign=cls.campaign,
            started_at=datetime.date(2021, 1, 1),
            ended_at=datetime.date(2021, 1, 31),
            number=1,
        )

        cls.vaccine_request_form = pm.VaccineRequestForm.objects.create(
            campaign=cls.campaign,
            vaccine_type=pm.VACCINES[0][0],
            date_vrf_reception=cls.now - datetime.timedelta(days=30),
            date_vrf_signature=cls.now - datetime.timedelta(days=20),
            date_dg_approval=cls.now - datetime.timedelta(days=10),
            quantities_ordered_in_doses=500,
        )

        cls.vaccine_arrival_report = pm.VaccineArrivalReport.objects.create(
            request_form=cls.vaccine_request_form,
            arrival_report_date=cls.now - datetime.timedelta(days=5),
            doses_received=400,
            doses_shipped=400,
            po_number="PO123",
            lot_numbers=["LOT123", "LOT456"],
            expiration_date=cls.now + datetime.timedelta(days=180),
            # the Model on save will implicitly set doses_per_vial to pm.DOSES_PER_VIAL[vaccine_type]
            # and calculated vials_received and vials_shipped
        )

        cls.vaccine_stock = pm.VaccineStock.objects.create(
            account=cls.account,
            country=cls.country,
            vaccine=pm.VACCINES[0][0],
        )

        cls.vaccine_stock_2 = pm.VaccineStock.objects.create(
            account=cls.account,
            country=cls.country_2,
            vaccine=pm.VACCINES[0][0],
        )

        cls.outgoing_stock_movement = pm.OutgoingStockMovement.objects.create(
            campaign=cls.campaign,
            vaccine_stock=cls.vaccine_stock,
            report_date=cls.now - datetime.timedelta(days=3),
            form_a_reception_date=cls.now - datetime.timedelta(days=2),
            usable_vials_used=10,
            lot_numbers=["LOT123"],
            comment="Hello world",
        )

        cls.outgoing_stock_movement_2 = pm.OutgoingStockMovement.objects.create(
            campaign=cls.campaign,
            vaccine_stock=cls.vaccine_stock_2,
            report_date=cls.now - datetime.timedelta(days=3),
            form_a_reception_date=cls.now - datetime.timedelta(days=2),
            usable_vials_used=10,
        )

        cls.destruction_report = pm.DestructionReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            action="Destroyed due to expiration",
            rrt_destruction_report_reception_date=cls.now - datetime.timedelta(days=1),
            destruction_report_date=cls.now,
            unusable_vials_destroyed=3,
            lot_numbers=["LOT456"],
            comment="Goodbye World",
        )
        cls.incident_report = pm.IncidentReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            stock_correction=pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
            date_of_incident_report=cls.now - datetime.timedelta(days=4),
            incident_report_received_by_rrt=cls.now - datetime.timedelta(days=3),
            unusable_vials=1,  # 1 vial will be moved from usable to unusable
            usable_vials=0,
        )
        cls.incident_report = pm.IncidentReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            stock_correction=pm.IncidentReport.StockCorrectionChoices.BROKEN,
            date_of_incident_report=cls.now - datetime.timedelta(days=5),
            incident_report_received_by_rrt=cls.now - datetime.timedelta(days=4),
            unusable_vials=0,
            usable_vials=1,
        )
        cls.incident_report = pm.IncidentReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            stock_correction=pm.IncidentReport.StockCorrectionChoices.PHYSICAL_INVENTORY_ADD,
            date_of_incident_report=cls.now - datetime.timedelta(days=6),
            incident_report_received_by_rrt=cls.now - datetime.timedelta(days=5),
            unusable_vials=0,
            usable_vials=16,
        )
        cls.incident_report = pm.IncidentReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            stock_correction=pm.IncidentReport.StockCorrectionChoices.PHYSICAL_INVENTORY_ADD,
            date_of_incident_report=cls.now - datetime.timedelta(days=6),
            incident_report_received_by_rrt=cls.now - datetime.timedelta(days=5),
            unusable_vials=20,
            usable_vials=0,
        )

    def test_outgoing_stock_movement_model_constraint(self):
        """Test that the model constraint requiring either campaign or non_obr_name is enforced"""

        new_movement_with_campaign, created = pm.OutgoingStockMovement.objects.get_or_create(
            vaccine_stock=self.vaccine_stock,
            report_date=datetime.date(2025, 1, 1),
            form_a_reception_date=datetime.date(2025, 1, 1),
            usable_vials_used=10,
            campaign=self.campaign,
        )
        self.assertTrue(created)
        new_movement_with_custom_name, created = pm.OutgoingStockMovement.objects.get_or_create(
            vaccine_stock=self.vaccine_stock,
            report_date=datetime.date(2025, 1, 2),
            form_a_reception_date=datetime.date(2025, 1, 2),
            usable_vials_used=10,
            non_obr_name="Test Alternative Campaign Name",
        )
        self.assertTrue(created)

        # This should raise an IntegrityError since neither campaign nor non_obr_name is provided
        with self.assertRaises(IntegrityError):
            pm.OutgoingStockMovement.objects.create(
                vaccine_stock=self.vaccine_stock,
                report_date=datetime.date(2025, 1, 1),
                form_a_reception_date=datetime.date(2025, 1, 1),
                usable_vials_used=10,
                campaign=None,
                non_obr_name=None,
            )
