from beanstalk_worker.services import TestTaskService
from iaso.tests.tasks.task_api_test_case import TaskAPITestCase
import datetime

from django.contrib.auth.models import AnonymousUser
from django.utils.timezone import now

import hat.menupermissions.models as permissions
from iaso import models as m
from plugins.polio import models as pm


class TestVAccineSTockArchive(TaskAPITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.another_data_source = m.DataSource.objects.create(name="Another source")

        cls.now = now()

        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.another_source_version = m.SourceVersion.objects.create(data_source=cls.another_data_source, number=1)

        cls.account = m.Account.objects.create(name="polio", default_version=cls.source_version_1)

        cls.another_account = m.Account.objects.create(
            name="another_account", default_version=cls.another_source_version
        )

        cls.default_project = m.Project.objects.create(name="Default project", app_id="default", account=cls.account)
        cls.data_source.projects.set([cls.default_project])

        cls.another_project = m.Project.objects.create(
            name="Another project", app_id="another", account=cls.another_account
        )
        cls.another_data_source.projects.set([cls.another_project])

        cls.account_2 = m.Account.objects.create(name="second_account", default_version=cls.source_version_1)

        cls.anon = AnonymousUser()

        # cls.user_rw_perm = cls.create_user_with_profile(
        #     username="user_1",
        #     account=cls.account,
        #     permissions=[permissions._POLIO_VACCINE_SUPPLY_CHAIN_READ, permissions._POLIO_VACCINE_SUPPLY_CHAIN_WRITE],
        # )
        cls.user_ro_perm = cls.create_user_with_profile(
            username="user_2", account=cls.account, permissions=[permissions._POLIO_VACCINE_STOCK_MANAGEMENT_WRITE]
        )
        cls.user_no_perms = cls.create_user_with_profile(username="user_3", account=cls.account, permissions=[])

        cls.project = m.Project.objects.create(
            name="Polio",
            app_id="polio.projects",
            account=cls.account,
        )

        cls.project_2 = m.Project.objects.create(
            name="Project_2",
            app_id="pro.jects",
            account=cls.account_2,
        )

        cls.org_unit_type_country = m.OrgUnitType.objects.create(name="COUNTRY", category="COUNTRY")

        cls.org_unit_type_country.projects.set([cls.project, cls.project_2])
        cls.org_unit_type_country.save()

        # campaign RDC 1
        cls.org_unit_DRC = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="Democratic Republic of Congo",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

        cls.org_unit_CHAD = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="CHAD",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

        cls.org_unit_BE = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="Belgium",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

        cls.campaign_rdc_1 = pm.Campaign.objects.create(
            obr_name="RDC_CAMPAIGN_1",
            country=cls.org_unit_DRC,
            account=cls.account,
            vacine=pm.VACCINES[0][0],
        )

        cls.campaign_rdc_1_round_1 = pm.Round.objects.create(
            campaign=cls.campaign_rdc_1,
            started_at=datetime.datetime(2021, 1, 1),
            ended_at=datetime.datetime(2021, 1, 10),
            number=1,
        )

        cls.campaign_rdc_1_round_2 = pm.Round.objects.create(
            campaign=cls.campaign_rdc_1,
            started_at=datetime.datetime(2021, 2, 1),
            ended_at=datetime.datetime(2021, 2, 10),
            number=2,
        )

        cls.campaign_rdc_1_round_3 = pm.Round.objects.create(
            campaign=cls.campaign_rdc_1,
            started_at=datetime.datetime(2021, 3, 1),
            ended_at=datetime.datetime(2021, 3, 10),
            number=3,
        )

        cls.vaccine_request_form_rdc_1 = pm.VaccineRequestForm.objects.create(
            campaign=cls.campaign_rdc_1,
            vaccine_type=pm.VACCINES[0][0],
            date_vrf_reception=cls.now - datetime.timedelta(days=30),
            date_vrf_signature=cls.now - datetime.timedelta(days=20),
            date_dg_approval=cls.now - datetime.timedelta(days=10),
            quantities_ordered_in_doses=500,
        )
        cls.vaccine_request_form_rdc_1.rounds.set([cls.campaign_rdc_1_round_1, cls.campaign_rdc_1_round_2])

        cls.vaccine_arrival_report_rdc_1 = pm.VaccineArrivalReport.objects.create(
            request_form=cls.vaccine_request_form_rdc_1,
            arrival_report_date=cls.campaign_rdc_1_round_1.started_at - datetime.timedelta(days=5),
            doses_received=400,
            doses_shipped=400,
            po_number="PO123",
            lot_numbers=["LOT123", "LOT456"],
            expiration_date=cls.now + datetime.timedelta(days=180),
            # the Model on save will implicitly set doses_per_vial to pm.DOSES_PER_VIAL[vaccine_type]
            # and calculated vials_received and vials_shipped
        )

        cls.vaccine_stock_rdc_nopv = pm.VaccineStock.objects.create(
            account=cls.account,
            country=cls.org_unit_DRC,
            vaccine=pm.VACCINES[0][0],
        )
        cls.outgoing_stock_movement_rdc_nopv_1 = pm.OutgoingStockMovement.objects.create(
            campaign=cls.campaign_rdc_1,
            vaccine_stock=cls.vaccine_stock_rdc_nopv,
            report_date=cls.campaign_rdc_1_round_1.started_at + datetime.timedelta(days=3),
            form_a_reception_date=cls.campaign_rdc_1_round_1.started_at + datetime.timedelta(days=3),
            usable_vials_used=10,
            lot_numbers=["LOT123"],
            missing_vials=2,
            comment="Hello world",
        )

        cls.incident_report_rdc_nopv_1 = pm.IncidentReport.objects.create(
            vaccine_stock=cls.vaccine_stock_rdc_nopv,
            stock_correction=pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
            date_of_incident_report=cls.campaign_rdc_1_round_1.started_at + datetime.timedelta(days=4),
            incident_report_received_by_rrt=cls.campaign_rdc_1_round_1.started_at + datetime.timedelta(days=4),
            unusable_vials=1,  # 1 vial will be moved from usable to unusable
            usable_vials=0,
        )
        cls.incident_report_rdc_nopv_2 = pm.IncidentReport.objects.create(
            vaccine_stock=cls.vaccine_stock_rdc_nopv,
            stock_correction=pm.IncidentReport.StockCorrectionChoices.BROKEN,
            date_of_incident_report=cls.campaign_rdc_1_round_1.started_at + datetime.timedelta(days=5),
            incident_report_received_by_rrt=cls.campaign_rdc_1_round_1.started_at + datetime.timedelta(days=5),
            unusable_vials=0,
            usable_vials=1,
        )
        cls.incident_report_rdc_nopv_3 = pm.IncidentReport.objects.create(
            vaccine_stock=cls.vaccine_stock_rdc_nopv,
            stock_correction=pm.IncidentReport.StockCorrectionChoices.PHYSICAL_INVENTORY,
            date_of_incident_report=cls.campaign_rdc_1_round_1.started_at + datetime.timedelta(days=6),
            incident_report_received_by_rrt=cls.campaign_rdc_1_round_1.started_at + datetime.timedelta(days=6),
            unusable_vials=0,
            usable_vials=16,
        )
        # END campaign RDC 1

        cls.vaccine_request_form_rdc_2 = pm.VaccineRequestForm.objects.create(
            campaign=cls.campaign_rdc_1,
            vaccine_type=pm.VACCINES[0][0],
            date_vrf_reception=cls.now - datetime.timedelta(days=1),
            date_vrf_signature=cls.now,
            date_dg_approval=cls.now,
            quantities_ordered_in_doses=100,
        )
        cls.vaccine_request_form_rdc_2.rounds.set([cls.campaign_rdc_1_round_3])

        cls.campaign_chad_1 = pm.Campaign.objects.create(
            obr_name="CHAD_CAMPAIGN_1",
            country=cls.org_unit_CHAD,
            account=cls.account,
            vacine=pm.VACCINES[0][0],
        )

        cls.campaign_chad_1_round_1 = pm.Round.objects.create(
            campaign=cls.campaign_chad_1,
            started_at=datetime.datetime(2021, 1, 1),
            ended_at=datetime.datetime(2021, 1, 10),
        )

        cls.campaign_chad_1_round_2 = pm.Round.objects.create(
            campaign=cls.campaign_chad_1,
            started_at=datetime.datetime(2021, 2, 1),
            ended_at=datetime.datetime(2021, 2, 10),
        )

        cls.campaign_chad_1_round_3 = pm.Round.objects.create(
            campaign=cls.campaign_chad_1,
            started_at=datetime.datetime(2021, 3, 1),
            ended_at=datetime.datetime(2021, 3, 10),
        )

        cls.vaccine_request_form_chad_1 = pm.VaccineRequestForm.objects.create(
            campaign=cls.campaign_chad_1,
            vaccine_type=pm.VACCINES[1][0],
            date_vrf_reception=cls.now - datetime.timedelta(days=30),
            date_vrf_signature=cls.now - datetime.timedelta(days=20),
            date_dg_approval=cls.now - datetime.timedelta(days=10),
            quantities_ordered_in_doses=500,
        )
        cls.vaccine_request_form_chad_1.rounds.set(
            [
                cls.campaign_chad_1_round_1,
                cls.campaign_chad_1_round_2,
                cls.campaign_chad_1_round_3,
            ]
        )

        # Other account
        cls.campaign_be_1 = pm.Campaign.objects.create(
            obr_name="BE_CAMPAIGN_1",
            country=cls.org_unit_BE,
            account=cls.another_account,  # different account
            vacine=pm.VACCINES[0][0],
        )

        cls.campaign_be_1_round_1 = pm.Round.objects.create(
            campaign=cls.campaign_be_1,
            started_at=datetime.datetime(2021, 1, 1),
            ended_at=datetime.datetime(2021, 1, 10),
        )

        cls.campaign_be_1_round_2 = pm.Round.objects.create(
            campaign=cls.campaign_be_1,
            started_at=datetime.datetime(2021, 2, 1),
            ended_at=datetime.datetime(2021, 2, 10),
        )

        cls.vaccine_request_form_be_1 = pm.VaccineRequestForm.objects.create(
            campaign=cls.campaign_be_1,
            vaccine_type=pm.VACCINES[0][0],
            date_vrf_reception=cls.now - datetime.timedelta(days=1),
            date_vrf_signature=cls.now,
            date_dg_approval=cls.now,
            quantities_ordered_in_doses=1000000,
        )

    def test_task_archives_stock_for_round_ended_for_14_days(self):
        self.client.force_authenticate(user=self.user_ro_perm)
        response = self.client.post(
            "/api/tasks/create/archivevaccinestock/",
            {
                "campaign": self.campaign_rdc_1.obr_name,
                "vaccine": pm.VACCINES[0][0],
                "date": "2021-01-26",
            },
            format="json",
        )
        self.assertJSONResponse(response, 200)
        task = self.assertValidTaskAndInDB(response.json()["task"], status="QUEUED", name="archive_vaccine_stock")
        self.assertEqual(task.launcher, self.user_ro_perm)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")
