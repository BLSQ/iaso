from datetime import datetime
from logging import getLogger

from django.core.cache import cache
from django.core.management.base import BaseCommand

from plugins.polio.api import _make_prep
from plugins.polio.models import Campaign, SpreadSheetImport, Round

logger = getLogger(__name__)


class Command(BaseCommand):
    help = ""

    def add_arguments(self, parser):
        parser.add_argument("campaigns", type=str, nargs="*")

    def handle(self, campaigns, **options):
        started_at = datetime.now()
        round_qs = Round.objects.filter(preparedness_spreadsheet_url__isnull=False).prefetch_related("campaign")
        round_qs.update(preparedness_sync_status="QUEUED")
        logger.info(round_qs)
        round: Round
        for round in round_qs:
            round.preparedness_sync_status = "ONGOING"
            round.save()

            print(f"Round {round.pk} refresh started: {round.preparedness_spreadsheet_url}")
            try:
                ssi = SpreadSheetImport.create_for_url(round.preparedness_spreadsheet_url)
                cs = ssi.cached_spreadsheet
                logger.info(f"using spread: {cs.title}")
                round.preparedness_sync_status = "FINISHED"
                round.save()
                cache.set(
                    f"prepardeness-{round.id}",
                    value=_make_prep(round.campaign, round),
                    timeout=60 * 60 * 24,  # 24 hours
                )
            except Exception as e:
                logger.error(f"Round {round} refresh failed")
                logger.exception(e)
                round.preparedness_sync_status = "FAILURE"
                round.save()

        campaigns_with_surge = Campaign.objects.exclude(surge_spreadsheet_url__isnull=True)
        surge_urls = [c.surge_spreadsheet_url for c in campaigns_with_surge]
        surge_urls = set(surge_urls)
        for url in surge_urls:
            try:
                logger.info(f"Importing surge file {url}")
                SpreadSheetImport.create_for_url(url)
            except Exception as e:
                logger.exception(e)
        finished_at = datetime.now()

        print(
            f"""
            Started at: {started_at}
            Finished at: {finished_at}

            Duration in seconds: {(finished_at - started_at).total_seconds()}
        """
        )
