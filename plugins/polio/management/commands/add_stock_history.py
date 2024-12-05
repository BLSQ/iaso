from django.core.management.base import BaseCommand
from datetime import timedelta
from plugins.polio.models import Round, VaccineStock
from logging import getLogger
from django.db.models import Q
from plugins.polio.models.base import VACCINES, VaccineStockHistory
from plugins.polio.tasks.archive_vaccine_stock_for_rounds import archive_stock_for_round

logger = getLogger(__name__)


class Command(BaseCommand):
    help = """Compute stock history and add it when missing"""

    def handle(self, *args, **options):
        rounds_to_update = Round.objects.filter(
            vaccinerequestform__isnull=False, vaccinerequestform__deleted_at__isnull=True
        ).order_by("ended_at")

        vaccines = [v[0] for v in VACCINES]

        for vaccine in vaccines:
            rounds_for_vaccine = rounds_to_update.filter(
                (Q(campaign__separate_scopes_per_round=False) & Q(campaign__scopes__vaccine=vaccine))
                | (Q(campaign__separate_scopes_per_round=True) & Q(scopes__vaccine=vaccine))
            ).exclude(id__in=VaccineStockHistory.objects.filter(vaccine_stock__vaccine=vaccine).values("round_id"))
            vaccine_stock = VaccineStock.objects.filter(vaccine=vaccine)
            for round_to_update in rounds_for_vaccine:
                reference_date = round_to_update.ended_at + timedelta(days=14)
                archive_stock_for_round(
                    round=round_to_update, vaccine_stock=vaccine_stock, reference_date=reference_date
                )
