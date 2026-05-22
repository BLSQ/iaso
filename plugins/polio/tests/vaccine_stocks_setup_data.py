import datetime

import time_machine

from django.contrib.auth.models import AnonymousUser

from iaso import models as m
from iaso.models.json_config import Config
from iaso.test import APITestCase
from plugins.polio import models as pm
from plugins.polio.models.base import DOSES_PER_VIAL_CONFIG_SLUG
from plugins.polio.permissions import (
    POLIO_VACCINE_STOCK_EARMARKS_ADMIN_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
)


BASE_URL = "/api/polio/vaccine/vaccine_stock/"

BASE_URL_SUB_RESOURCES = "/api/polio/vaccine/stock/"

DT = datetime.datetime(2024, 10, 29, 14, 0, 0, 0, tzinfo=datetime.timezone.utc)


@time_machine.travel(DT, tick=False)
class VaccineStockManagementAPITestBase(APITestCase):
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

        cls.anon = AnonymousUser()

        cls.user_rw_perms = cls.create_user_with_profile(
            username="user_rw_perms",
            account=cls.account,
            permissions=[
                POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
                POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
                POLIO_VACCINE_STOCK_EARMARKS_ADMIN_PERMISSION,
            ],
        )
        cls.user_ro_perms = cls.create_user_with_profile(
            username="user_ro_perms",
            account=cls.account,
            permissions=[POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION],
        )
        cls.user_read_only_perms = cls.create_user_with_profile(
            username="user_read_only_perms",
            account=cls.account,
            permissions=[POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION],
        )
        cls.user_no_perms = cls.create_user_with_profile(username="user_no_perms", account=cls.account, permissions=[])

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
            doses_per_vial=20,
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

        cls.empty_vaccine_stock = pm.VaccineStock.objects.create(
            account=cls.account,
            country=cls.country,
            vaccine=pm.VACCINES[2][0],
        )

        cls.outgoing_stock_movement = pm.OutgoingStockMovement.objects.create(
            campaign=cls.campaign,
            vaccine_stock=cls.vaccine_stock,
            report_date=cls.now - datetime.timedelta(days=3),
            form_a_reception_date=cls.now - datetime.timedelta(days=2),
            usable_vials_used=10,
            lot_numbers=["LOT123"],
            comment="Hello world",
            doses_per_vial=20,
        )

        cls.outgoing_stock_movement_2 = pm.OutgoingStockMovement.objects.create(
            campaign=cls.campaign,
            vaccine_stock=cls.vaccine_stock_2,
            report_date=cls.now - datetime.timedelta(days=3),
            form_a_reception_date=cls.now - datetime.timedelta(days=2),
            usable_vials_used=10,
            doses_per_vial=20,
        )

        cls.destruction_report = pm.DestructionReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            action="Destroyed due to expiration",
            rrt_destruction_report_reception_date=cls.now - datetime.timedelta(days=1),
            destruction_report_date=cls.now,
            unusable_vials_destroyed=3,
            lot_numbers=["LOT456"],
            comment="Goodbye World",
            doses_per_vial=20,
        )
        cls.incident_report = pm.IncidentReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            stock_correction=pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
            date_of_incident_report=cls.now - datetime.timedelta(days=4),
            incident_report_received_by_rrt=cls.now - datetime.timedelta(days=3),
            unusable_vials=1,  # 1 vial will be moved from usable to unusable
            usable_vials=0,
            doses_per_vial=20,
        )
        cls.incident_report = pm.IncidentReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            stock_correction=pm.IncidentReport.StockCorrectionChoices.BROKEN,
            date_of_incident_report=cls.now - datetime.timedelta(days=5),
            incident_report_received_by_rrt=cls.now - datetime.timedelta(days=4),
            unusable_vials=0,
            usable_vials=1,
            doses_per_vial=20,
        )
        cls.incident_report = pm.IncidentReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            stock_correction=pm.IncidentReport.StockCorrectionChoices.PHYSICAL_INVENTORY_ADD,
            date_of_incident_report=cls.now - datetime.timedelta(days=6),
            incident_report_received_by_rrt=cls.now - datetime.timedelta(days=5),
            unusable_vials=0,
            usable_vials=16,
            doses_per_vial=20,
        )
        cls.incident_report = pm.IncidentReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            stock_correction=pm.IncidentReport.StockCorrectionChoices.PHYSICAL_INVENTORY_ADD,
            date_of_incident_report=cls.now - datetime.timedelta(days=6),
            incident_report_received_by_rrt=cls.now - datetime.timedelta(days=5),
            unusable_vials=20,
            usable_vials=0,
            doses_per_vial=20,
        )
        # Remove from usable
        cls.incident_report = pm.IncidentReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            stock_correction=pm.IncidentReport.StockCorrectionChoices.PHYSICAL_INVENTORY_REMOVE,
            date_of_incident_report=cls.now - datetime.timedelta(days=6),
            incident_report_received_by_rrt=cls.now - datetime.timedelta(days=5),
            unusable_vials=0,
            usable_vials=1,
            doses_per_vial=20,
        )
        # remove from unusable
        cls.incident_report = pm.IncidentReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            stock_correction=pm.IncidentReport.StockCorrectionChoices.PHYSICAL_INVENTORY_REMOVE,
            date_of_incident_report=cls.now - datetime.timedelta(days=6),
            incident_report_received_by_rrt=cls.now - datetime.timedelta(days=5),
            unusable_vials=1,
            usable_vials=0,
            doses_per_vial=20,
        )

        cls.config = Config.objects.create(
            slug=DOSES_PER_VIAL_CONFIG_SLUG, content={"bOPV": [10, 20], "mOPV2": [20, 50], "nOPV2": [50]}
        )
