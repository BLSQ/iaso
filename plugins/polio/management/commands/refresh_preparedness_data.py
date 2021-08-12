from datetime import datetime

from django.core.management.base import BaseCommand

from plugins.polio.models import Campaign, Preparedness
from plugins.polio.preparedness.calculator import get_preparedness_score
from plugins.polio.preparedness.parser import (
    get_national_level_preparedness,
    get_regional_level_preparedness,
    open_sheet_by_url,
)
from plugins.polio.preparedness.quota_manager import QuotaManager


class Command(BaseCommand):
    help = ""

    def handle(self, *args, **options):
        started_at = datetime.now()
        manager = QuotaManager()
        campaigns_with_spreadsheet = Campaign.objects.only("id", "preperadness_spreadsheet_url").filter(
            preperadness_spreadsheet_url__isnull=False
        )
        campaigns_with_spreadsheet.update(preperadness_sync_status="QUEUED")
        for campaign in campaigns_with_spreadsheet:
            campaign.preperadness_sync_status = "ONGOING"
            campaign.save()

            print(f"Campaign {campaign.pk} refresh started")
            try:
                sheet = open_sheet_by_url(campaign.preperadness_spreadsheet_url)
                preparedness_data = {
                    "national": get_national_level_preparedness(sheet, manager=manager),
                    **get_regional_level_preparedness(sheet, manager=manager),
                }
                preparedness_data["totals"] = get_preparedness_score(preparedness_data)

                Preparedness.objects.create(
                    campaign=campaign,
                    spreadsheet_url=campaign.preperadness_spreadsheet_url,
                    national_score=preparedness_data["totals"]["national_score"],
                    district_score=preparedness_data["totals"]["district_score"],
                    regional_score=preparedness_data["totals"]["regional_score"],
                    payload=preparedness_data,
                )
                print(f"Campaign {campaign.pk} refreshed")
                print(f"Requests sent {manager.total_requests}")
                campaign.preperadness_sync_status = "FINISHED"
                campaign.save()
            except Exception as e:
                print(f"Campaign {campaign.pk} refresh failed")
                print(e)
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
