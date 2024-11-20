from .models import *
from iaso.models import *
from celery import shared_task
from .management.commands.south_sudan.Under5 import Under5
from .management.commands.south_sudan.Pbwg import PBWG
from .management.commands.nigeria.Under5 import NG_Under5
import logging

logger = logging.getLogger(__name__)


@shared_task()
def etl_ng():
    """Extract beneficiary data from Iaso tables and store them in the format expected by existing tableau dashboards"""
    logger.info("Starting ETL for Nigeria")
    NG_Under5().run()


@shared_task()
def etl_ssd():
    logger.info("Starting ETL for South Sudan")
    Under5().run()
    PBWG().run()
