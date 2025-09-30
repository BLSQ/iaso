import logging

from celery import shared_task

from iaso.models import *
from plugins.wfp.common import ETL

from .management.commands.ethiopia.Under5 import ET_Under5
from .management.commands.nigeria.Pbwg import NG_PBWG
from .management.commands.nigeria.Under5 import NG_Under5
from .management.commands.south_sudan.Dhis2 import Dhis2
from .management.commands.south_sudan.Pbwg import PBWG
from .management.commands.south_sudan.Under5 import Under5
from .models import *


logger = logging.getLogger(__name__)


@shared_task()
def etl_ng():
    """Extract beneficiary data from Iaso tables and store them in the format expected by existing tableau dashboards"""
    logger.info("Starting ETL for Nigeria")
    entity_type_U5_code = "nigeria_under5"
    account = ETL([entity_type_U5_code]).account_related_to_entity_type()
    Beneficiary.objects.filter(account=account).delete()
    MonthlyStatistics.objects.filter(account=account, programme_type="U5").delete()
    NG_Under5().run(entity_type_U5_code)
    logger.info(
        f"----------------------------- Aggregating journey for {account} per org unit, admission and period(month and year) -----------------------------"
    )
    ETL().journey_with_visit_and_steps_per_visit(account, "U5")
    entity_type_pbwg_code = "nigeria_pbwg"
    pbwg_account = ETL([entity_type_pbwg_code]).account_related_to_entity_type()
    NG_PBWG().run(entity_type_pbwg_code)
    logger.info(
        f"----------------------------- Aggregating PBWG journey for {pbwg_account} per org unit, admission and period(month and year) -----------------------------"
    )
    MonthlyStatistics.objects.filter(account=pbwg_account, programme_type="PLW").delete()
    ETL().journey_with_visit_and_steps_per_visit(pbwg_account, "PLW")


@shared_task()
def etl_ssd():
    logger.info("Starting ETL for South Sudan")
    entity_type_U5_code = "ssd_under5"
    child_account = ETL([entity_type_U5_code]).account_related_to_entity_type()
    Beneficiary.objects.filter(account=child_account).delete()
    Under5().run(entity_type_U5_code)

    logger.info(
        f"----------------------------- Aggregating Children under 5 journey for {child_account} per org unit, admission and period(month and year) -----------------------------"
    )
    MonthlyStatistics.objects.filter(account=child_account, programme_type="U5").delete()
    ETL().journey_with_visit_and_steps_per_visit(child_account, "U5")

    ETL().aggregating_data_to_push_to_dhis2(child_account, "U5")

    Dhis2().run(entity_type_U5_code)

    entity_type_pbwg_code = "ssd_pbwg"
    pbwg_account = ETL([entity_type_pbwg_code]).account_related_to_entity_type()
    PBWG().run(entity_type_pbwg_code)
    logger.info(
        f"----------------------------- Aggregating PBWG journey for {pbwg_account} per org unit, admission and period(month and year) -----------------------------"
    )
    MonthlyStatistics.objects.filter(account=pbwg_account, programme_type="PLW").delete()
    ETL().journey_with_visit_and_steps_per_visit(pbwg_account, "PLW")


@shared_task()
def etl_ethiopia():
    logger.info("Starting ETL for Ethiopia")
    entity_type_U5_code = "ethiopia_under5"
    child_account = ETL([entity_type_U5_code]).account_related_to_entity_type()
    Beneficiary.objects.filter(account=child_account).delete()
    ET_Under5().run(entity_type_U5_code)

    logger.info(
        f"----------------------------- Aggregating Children under 5 journey for {child_account} per org unit, admission and period(month and year) -----------------------------"
    )
    MonthlyStatistics.objects.filter(account=child_account, programme_type="U5").delete()
    ETL().journey_with_visit_and_steps_per_visit(child_account, "U5")

    entity_type_pbwg_code = "ethiopia_pbwg"
    pbwg_account = ETL([entity_type_pbwg_code]).account_related_to_entity_type()
    PBWG().run(entity_type_pbwg_code)
    logger.info(
        f"----------------------------- Aggregating PBWG journey for {pbwg_account} per org unit, admission and period(month and year) -----------------------------"
    )
    MonthlyStatistics.objects.filter(account=pbwg_account, programme_type="PLW").delete()
    ETL().journey_with_visit_and_steps_per_visit(pbwg_account, "PLW")
