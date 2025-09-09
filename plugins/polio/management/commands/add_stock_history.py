from datetime import timedelta
from logging import getLogger

from django.core.management.base import BaseCommand
from django.db.models import Q

from plugins.polio.models import Round, VaccineStock
from plugins.polio.models.base import VACCINES, VaccineStockHistory
from plugins.polio.tasks.archive_vaccine_stock_for_rounds import archive_stock_for_round


logger = getLogger(__name__)


class Command(BaseCommand):
    help = """Compute stock history and add it when missing"""

    def handle(self, *args, **options):
        rounds_to_update = (
            Round.objects.filter(vaccinerequestform__isnull=False, vaccinerequestform__deleted_at__isnull=True)
            .select_related("campaign__country")
            .order_by("ended_at")
        )

        vaccines = [v[0] for v in VACCINES]

        for vaccine in vaccines:
            rounds_for_vaccine = rounds_to_update.filter(
                (Q(campaign__separate_scopes_per_round=False) & Q(campaign__scopes__vaccine=vaccine))
                | (Q(campaign__separate_scopes_per_round=True) & Q(scopes__vaccine=vaccine))
            )
            for round_to_update in rounds_for_vaccine:
                vaccine_stock_qs = VaccineStock.objects.filter(
                    vaccine=vaccine, country=round_to_update.campaign.country
                )
                vaccine_stock = vaccine_stock_qs.first()
                # If vaccine stock is None, archived_round will be empty
                archived_round = VaccineStockHistory.objects.filter(vaccine_stock=vaccine_stock, round=round_to_update)
                if not archived_round.exists():
                    reference_date = round_to_update.ended_at + timedelta(days=14)
                    archive_stock_for_round(
                        round=round_to_update, vaccine_stock=vaccine_stock_qs, reference_date=reference_date
                    )
