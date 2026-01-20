import logging

from celery import shared_task
from django.db import connection

from iaso.management.commands import unique_indexes
from iaso.models import *
from iaso.models.base import ExternalCredentials
from plugins.wfp.common import ETL

from .management.commands.ethiopia.Under5 import ET_Under5
from .management.commands.nigeria.Pbwg import NG_PBWG
from .management.commands.nigeria.Under5 import NG_Under5
from .management.commands.south_sudan.Dhis2 import Dhis2
from .management.commands.south_sudan.Pbwg import PBWG
from .management.commands.south_sudan.Screening import Screening
from .management.commands.south_sudan.Under5 import Under5
from .models import *


logger = logging.getLogger(__name__)


# how to test this task manually:
#
# in .env make sure to have these variables set:
#   PLUGINS=wfp
#   USE_CELERY=true
#   CELERY_BROKER_URL=redis://redis:6379/0
#   CELERY_RESULT_BACKEND=redis://redis:6379/0
#
# docker compose --profile celery up
# docker compose run iaso start_celery_worker
# then go in admin http://localhost:8081/admin/wfp/beneficiary/
#   - select (or create a first beneficiary if it's empty)
#   - and select action "Create indexes on UUID field (non-blocking)"
@shared_task()
def create_index_on_instance_uuid():
    print("Starting task to create index on iaso_instance.uuid and others")

    for index in unique_indexes.INDEXES:
        logger.info(f"Starting task to create index: {index.name()}")
        old_autocommit = connection.get_autocommit()
        try:
            connection.set_autocommit(True)
            # We explicitly set autocommit to True for this connection.
            with connection.cursor() as cursor:
                index.apply(cursor)
                logger.info(f"create index: {index.name()}) done.")
        except Exception as e:
            logger.error(f"Error creating index on iaso_instance(uuid): {e}", exc_info=True)
            raise
        finally:
            connection.set_autocommit(old_autocommit)


@shared_task()
def etl_ng(all_data=None):
    """Extract beneficiary data from Iaso tables and store them in the format expected by existing tableau dashboards"""
    from django_celery_results.models import TaskResult

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
    org_units_with_updated_data = ETL([entity_type_U5_code]).get_org_unit_ids_with_updated_data(last_success_task_date)
    MonthlyStatistics.objects.filter(
        account=account, programme_type="U5", org_unit_id__in=org_units_with_updated_data
    ).delete()
    ETL().journey_with_visit_and_steps_per_visit(account, "U5", org_units_with_updated_data)
    entity_type_pbwg_code = "nigeria_pbwg"
    pbwg_account = ETL([entity_type_pbwg_code]).account_related_to_entity_type()
    updated_pbwg_beneficiaries = ETL([entity_type_pbwg_code]).get_updated_entity_ids(last_success_task_date)
    Beneficiary.objects.filter(entity_id__in=updated_pbwg_beneficiaries).delete()
    NG_PBWG().run(entity_type_pbwg_code, updated_pbwg_beneficiaries)
    logger.info(
        f"----------------------------- Aggregating PBWG journey for {pbwg_account} per org unit, admission and period(month and year) -----------------------------"
    )
    MonthlyStatistics.objects.filter(
        account=pbwg_account, programme_type="PLW", org_unit_id__in=org_units_with_updated_data
    ).delete()
    ETL().journey_with_visit_and_steps_per_visit(pbwg_account, "PLW", org_units_with_updated_data)


@shared_task()
def etl_ssd(all_data=None):
    """Extract beneficiary data from Iaso tables and store them in the format expected by existing tableau dashboards"""
    from django_celery_results.models import TaskResult

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
    Screening().run(child_account, last_success_task_date)

    logger.info(
        f"----------------------------- Aggregating Children under 5 journey for {child_account} per org unit, admission and period(month and year) -----------------------------"
    )
    org_units_with_updated_data = ETL([entity_type_U5_code]).get_org_unit_ids_with_updated_data(last_success_task_date)
    MonthlyStatistics.objects.filter(
        account=child_account, programme_type="U5", org_unit_id__in=org_units_with_updated_data
    ).delete()
    ETL().journey_with_visit_and_steps_per_visit(child_account, "U5", org_units_with_updated_data)

    entity_type_pbwg_code = "ssd_pbwg"
    pbwg_account = ETL([entity_type_pbwg_code]).account_related_to_entity_type()
    updated_pbwg_beneficiaries = ETL([entity_type_pbwg_code]).get_updated_entity_ids(last_success_task_date)
    Beneficiary.objects.filter(entity_id__in=updated_pbwg_beneficiaries).delete()
    PBWG().run(entity_type_pbwg_code, updated_pbwg_beneficiaries)
    logger.info(
        f"----------------------------- Aggregating PBWG journey for {pbwg_account} per org unit, admission and period(month and year) -----------------------------"
    )

    MonthlyStatistics.objects.filter(
        account=pbwg_account, programme_type="PLW", org_unit_id__in=org_units_with_updated_data
    ).delete()
    ETL().journey_with_visit_and_steps_per_visit(pbwg_account, "PLW", org_units_with_updated_data)

    external_credential = ExternalCredentials.objects.filter(account=pbwg_account).first()
    if external_credential is not None and (
        external_credential.url is not None
        and external_credential.login is not None
        and external_credential.password is not None
    ):
        ETL().aggregating_data_to_push_to_dhis2(pbwg_account, org_units_with_updated_data)
        pushed_data = Dhis2().save_dhis2_sync_results(entity_type_pbwg_code, external_credential)
        logger.info(
            f"----------------------------- Pushed to DHIS2 on U5 and PBW for {len(pushed_data)} rows aggregated per year and month -----------------------------"
        )

    # print("len(connection.queries)", len(connection.queries))  # Uncomment this line to see the number of SQL queries executed
    # print(connection.queries) # Uncomment this line to see the SQL queries executed


@shared_task()
def etl_ethiopia(all_data=None):
    """Extract beneficiary data from Iaso tables and store them in the format expected by existing tableau dashboards"""
    from django_celery_results.models import TaskResult

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
    org_units_with_updated_data = ETL([entity_type_U5_code]).get_org_unit_ids_with_updated_data(last_success_task_date)
    MonthlyStatistics.objects.filter(
        account=child_account, programme_type="U5", org_unit_id__in=org_units_with_updated_data
    ).delete()
    ETL().journey_with_visit_and_steps_per_visit(child_account, "U5", org_units_with_updated_data)

    entity_type_pbwg_code = "ethiopia_pbwg"
    pbwg_account = ETL([entity_type_pbwg_code]).account_related_to_entity_type()
    updated_pbwg_beneficiaries = ETL([entity_type_pbwg_code]).get_updated_entity_ids(last_success_task_date)
    Beneficiary.objects.filter(entity_id__in=updated_pbwg_beneficiaries).delete()
    PBWG().run(entity_type_pbwg_code, updated_pbwg_beneficiaries)

    logger.info(
        f"----------------------------- Aggregating PBWG journey for {pbwg_account} per org unit, admission and period(month and year) -----------------------------"
    )
    MonthlyStatistics.objects.filter(
        account=pbwg_account, programme_type="PLW", org_unit_id__in=org_units_with_updated_data
    ).delete()
    ETL().journey_with_visit_and_steps_per_visit(pbwg_account, "PLW", org_units_with_updated_data)
