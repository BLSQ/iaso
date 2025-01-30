from .models import *
from iaso.models import *
from celery import shared_task
from .management.commands.south_sudan.Under5 import Under5
from .management.commands.south_sudan.Pbwg import PBWG
from .management.commands.nigeria.Under5 import NG_Under5
from .management.commands.nigeria.Pbwg import NG_PBWG
import logging
from plugins.wfp.common import ETL

logger = logging.getLogger(__name__)


@shared_task()
def etl_ng():
    """Extract beneficiary data from Iaso tables and store them in the format expected by existing tableau dashboards"""
    logger.info("Starting ETL for Nigeria")
    account = ETL(["child_under_5_3"]).account_related_to_entity_type()
    Beneficiary.objects.all().filter(account=account).delete()
    MonthlyStatistics.objects.all().filter(account=account, programme_type="U5").delete()
    NG_Under5().run()
    logger.info(
        f"----------------------------- Aggregating journey for {account} per org unit, admission and period(month and year) -----------------------------"
    )
    ETL().journey_with_visit_and_steps_per_visit(account, "U5")

    pbwg_account = ETL(["pbwg_3"]).account_related_to_entity_type()
    NG_PBWG().run()
    logger.info(
        f"----------------------------- Aggregating PBWG journey for {pbwg_account} per org unit, admission and period(month and year) -----------------------------"
    )
    MonthlyStatistics.objects.all().filter(account=pbwg_account, programme_type="PLW").delete()
    ETL().journey_with_visit_and_steps_per_visit(pbwg_account, "PLW")


@shared_task()
def etl_ssd():
    logger.info("Starting ETL for South Sudan")
    child_account = ETL(["child_under_5_1"]).account_related_to_entity_type()
    Beneficiary.objects.all().filter(account=child_account).delete()
    Under5().run()

    logger.info(
        f"----------------------------- Aggregating Children under 5 journey for {child_account} per org unit, admission and period(month and year) -----------------------------"
    )
    MonthlyStatistics.objects.all().filter(account=child_account, programme_type="U5").delete()
    ETL().journey_with_visit_and_steps_per_visit(child_account, "U5")

    pbwg_account = ETL(["pbwg_1"]).account_related_to_entity_type()
    PBWG().run()
    logger.info(
        f"----------------------------- Aggregating PBWG journey for {pbwg_account} per org unit, admission and period(month and year) -----------------------------"
    )
    MonthlyStatistics.objects.all().filter(account=pbwg_account, programme_type="PLW").delete()
    ETL().journey_with_visit_and_steps_per_visit(pbwg_account, "PLW")
