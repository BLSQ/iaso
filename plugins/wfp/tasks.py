import logging

from celery import shared_task
from django_celery_results.models import TaskResult

from iaso.models import *
from plugins.wfp.common import ETL

from .management.commands.ethiopia.Under5 import ET_Under5
from .management.commands.nigeria.Pbwg import NG_PBWG
from .management.commands.nigeria.Under5 import NG_Under5
from .management.commands.south_sudan.Pbwg import PBWG
from .management.commands.south_sudan.Under5 import Under5
from .models import *


logger = logging.getLogger(__name__)


@shared_task()
def etl_ng(all_data):
    """Extract beneficiary data from Iaso tables and store them in the format expected by existing tableau dashboards"""
    last_success_task = TaskResult.objects.filter(task_name="plugins.wfp.tasks.etl_ng", status="SUCCESS").first()

    if last_success_task:
        # A task was found, use its creation date
        last_success_task_date = last_success_task.date_created.strftime("%Y-%m-%d")
    else:
        # No successful task was found (first run case)
        # Define a safe default date
        last_success_task_date = None  # Example default: Unix Epoch start date

    # Allow to re-run on the whole data
    if all_data is not None:
        last_success_task_date = None

    logger.info("Starting ETL for Nigeria")
    entity_type_U5_code = "nigeria_under5"
    account = ETL([entity_type_U5_code]).account_related_to_entity_type()
    updated_U5_beneficiaries = ETL([entity_type_U5_code]).get_updated_entity_ids(last_success_task_date)
    Beneficiary.objects.filter(account=account, entity_id__in=updated_U5_beneficiaries).delete()

    NG_Under5().run(entity_type_U5_code, updated_U5_beneficiaries)
    logger.info(
        f"----------------------------- Aggregating journey for {account} per org unit, admission and period(month and year) -----------------------------"
    )
    MonthlyStatistics.objects.filter(account=account, programme_type="U5").delete()
    ETL().journey_with_visit_and_steps_per_visit(account, "U5")
    entity_type_pbwg_code = "nigeria_pbwg"
    pbwg_account = ETL([entity_type_pbwg_code]).account_related_to_entity_type()
    updated_pbwg_beneficiaries = ETL([entity_type_pbwg_code]).get_updated_entity_ids(last_success_task_date)
    Beneficiary.objects.filter(entity_id__in=updated_pbwg_beneficiaries).delete()
    NG_PBWG().run(entity_type_pbwg_code, updated_pbwg_beneficiaries)
    logger.info(
        f"----------------------------- Aggregating PBWG journey for {pbwg_account} per org unit, admission and period(month and year) -----------------------------"
    )
    MonthlyStatistics.objects.filter(account=pbwg_account, programme_type="PLW").delete()
    ETL().journey_with_visit_and_steps_per_visit(pbwg_account, "PLW")


@shared_task()
def etl_ssd(all_data):
    """Extract beneficiary data from Iaso tables and store them in the format expected by existing tableau dashboards"""
    last_success_task = TaskResult.objects.filter(task_name="plugins.wfp.tasks.etl_ssd", status="SUCCESS").first()

    if last_success_task:
        # A task was found, use its creation date
        last_success_task_date = last_success_task.date_created.strftime("%Y-%m-%d")
    else:
        # No successful task was found (first run case)
        # Define a safe default date
        last_success_task_date = None  # Example default: Unix Epoch start date

    # Allow to re-run on the whole data
    if all_data is not None:
        last_success_task_date = None
    logger.info("Starting ETL for South Sudan")
    entity_type_U5_code = "ssd_under5"
    child_account = ETL([entity_type_U5_code]).account_related_to_entity_type()
    updated_U5_beneficiaries = ETL([entity_type_U5_code]).get_updated_entity_ids(last_success_task_date)
    Beneficiary.objects.filter(account=child_account, entity_id__in=updated_U5_beneficiaries).delete()
    Under5().run(entity_type_U5_code, updated_U5_beneficiaries)

    logger.info(
        f"----------------------------- Aggregating Children under 5 journey for {child_account} per org unit, admission and period(month and year) -----------------------------"
    )
    MonthlyStatistics.objects.filter(account=child_account, programme_type="U5").delete()
    ETL().journey_with_visit_and_steps_per_visit(child_account, "U5")
    entity_type_pbwg_code = "ssd_pbwg"
    pbwg_account = ETL([entity_type_pbwg_code]).account_related_to_entity_type()
    updated_pbwg_beneficiaries = ETL([entity_type_pbwg_code]).get_updated_entity_ids(last_success_task_date)
    Beneficiary.objects.filter(entity_id__in=updated_pbwg_beneficiaries).delete()
    PBWG().run(entity_type_pbwg_code, updated_pbwg_beneficiaries)
    logger.info(
        f"----------------------------- Aggregating PBWG journey for {pbwg_account} per org unit, admission and period(month and year) -----------------------------"
    )
    MonthlyStatistics.objects.filter(account=pbwg_account, programme_type="PLW").delete()
    ETL().journey_with_visit_and_steps_per_visit(pbwg_account, "PLW")
    # print("len(connection.queries)", len(connection.queries))  # Uncomment this line to see the number of SQL queries executed
    # print(connection.queries) # Uncomment this line to see the SQL queries executed


@shared_task()
def etl_ethiopia(all_data):
    """Extract beneficiary data from Iaso tables and store them in the format expected by existing tableau dashboards"""
    last_success_task = TaskResult.objects.filter(task_name="plugins.wfp.tasks.etl_ethiopia", status="SUCCESS").first()

    if last_success_task:
        # A task was found, use its creation date
        last_success_task_date = last_success_task.date_created.strftime("%Y-%m-%d")
    else:
        # No successful task was found (first run case)
        # Define a safe default date
        last_success_task_date = None  # Example default: Unix Epoch start date

    # Allow to re-run on the whole data
    if all_data is not None:
        last_success_task_date = None

    logger.info("Starting ETL for Ethiopia")
    entity_type_U5_code = "ethiopia_under5"
    child_account = ETL([entity_type_U5_code]).account_related_to_entity_type()
    updated_U5_beneficiaries = ETL([entity_type_U5_code]).get_updated_entity_ids(last_success_task_date)
    Beneficiary.objects.filter(account=child_account, entity_id__in=updated_U5_beneficiaries).delete()
    ET_Under5().run(entity_type_U5_code, updated_U5_beneficiaries)

    logger.info(
        f"----------------------------- Aggregating Children under 5 journey for {child_account} per org unit, admission and period(month and year) -----------------------------"
    )
    MonthlyStatistics.objects.filter(account=child_account, programme_type="U5").delete()
    ETL().journey_with_visit_and_steps_per_visit(child_account, "U5")

    entity_type_pbwg_code = "ethiopia_pbwg"
    pbwg_account = ETL([entity_type_pbwg_code]).account_related_to_entity_type()
    updated_pbwg_beneficiaries = ETL([entity_type_pbwg_code]).get_updated_entity_ids(last_success_task_date)
    Beneficiary.objects.filter(entity_id__in=updated_pbwg_beneficiaries).delete()
    PBWG().run(entity_type_pbwg_code, updated_pbwg_beneficiaries)

    logger.info(
        f"----------------------------- Aggregating PBWG journey for {pbwg_account} per org unit, admission and period(month and year) -----------------------------"
    )
    MonthlyStatistics.objects.filter(account=pbwg_account, programme_type="PLW").delete()
    ETL().journey_with_visit_and_steps_per_visit(pbwg_account, "PLW")
