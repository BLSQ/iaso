from datetime import datetime
from logging import getLogger

from django.core.management.base import BaseCommand

from plugins.polio.models import Campaign, Preparedness, SpreadSheetImport
from plugins.polio.preparedness.parser import (
    get_preparedness,
)

logger = getLogger(__name__)


class Command(BaseCommand):
    help = ""

    def add_arguments(self, parser):
        parser.add_argument("campaigns", type=str, nargs="*")

    def handle(self, campaigns, **options):
        started_at = datetime.now()
        campaigns_with_spreadsheet = Campaign.objects.only("id", "preperadness_spreadsheet_url").filter(
            preperadness_spreadsheet_url__isnull=False
        )
        if campaigns:
            campaigns_with_spreadsheet = campaigns_with_spreadsheet.filter(obr_name__in=campaigns)
        campaigns_with_spreadsheet.update(preperadness_sync_status="QUEUED")
        logger.info(campaigns_with_spreadsheet)
        for campaign in campaigns_with_spreadsheet:
            campaign.preperadness_sync_status = "ONGOING"
            campaign.save()

            print(f"Campaign {campaign.pk} refresh started: {campaign.preperadness_spreadsheet_url}")
            try:
                # Separate import from parsing
                ssi = SpreadSheetImport.create_for_url(campaign.preperadness_spreadsheet_url)
                cs = ssi.cached_spreadsheet
                logger.info(f"using spread: {cs.title}")

                try:
                    preparedness_data = get_preparedness(cs)
                    preparedness = Preparedness.objects.create(
                        campaign=campaign,
                        spreadsheet_url=campaign.preperadness_spreadsheet_url,
                        national_score=preparedness_data["totals"]["national_score"],
                        district_score=preparedness_data["totals"]["district_score"],
                        regional_score=preparedness_data["totals"]["regional_score"],
                        payload=preparedness_data,
                    )
                    print(f"Campaign {campaign.obr_name} refreshed")
                except Exception as e:
                    logger.exception(f"Campaign {campaign.obr_name} refresh failed")

                campaign.preperadness_sync_status = "FINISHED"
                campaign.save()
            except Exception as e:
                logger.error(f"Campaign {campaign.obr_name} refresh failed")
                logger.exception(e)
                campaign.preperadness_sync_status = "FAILURE"
                campaign.save()

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
