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

    def handle(self, *args, **options):
        started_at = datetime.now()
        campaigns_with_spreadsheet = Campaign.objects.only("id", "preperadness_spreadsheet_url").filter(
            preperadness_spreadsheet_url__isnull=False
        )
        campaigns_with_spreadsheet.update(preperadness_sync_status="QUEUED")
        logger.info(campaigns_with_spreadsheet)
        for campaign in campaigns_with_spreadsheet:
            campaign.preperadness_sync_status = "ONGOING"
            campaign.save()

            print(f"Campaign {campaign.pk} refresh started: {campaign.preperadness_spreadsheet_url}")
            try:
                # Separate import from parsing
                ssi = SpreadSheetImport.create_for_url(campaign.preperadness_spreadsheet_url)
                cs = ssi.cached_spreadhseet

                try:
                    preparedness_data = get_preparedness(cs)
                except Exception as e:
                    logger.exception(f"Campaign {campaign.obr_name} refresh failed")
                    preparedness_data = {}

                preparedness = Preparedness.objects.create(
                    campaign=campaign,
                    spreadsheet_url=campaign.preperadness_spreadsheet_url,
                    national_score=preparedness_data["totals"]["national_score"],
                    district_score=preparedness_data["totals"]["district_score"],
                    regional_score=preparedness_data["totals"]["regional_score"],
                    payload=preparedness_data,
                )
                print(f"Campaign {campaign.obr_name} refreshed")
                print(preparedness)

                campaign.preperadness_sync_status = "FINISHED"
                campaign.save()
            except Exception as e:
                logger.error(f"Campaign {campaign.obr_name} refresh failed")
                logger.exception(e)
                campaign.preperadness_sync_status = "FAILURE"
                campaign.save()

        finished_at = datetime.now()

        print(
            f"""
            Started at: {started_at}
            Finished at: {finished_at}

            Duration in seconds: {(finished_at - started_at).total_seconds()}
        """
        )
