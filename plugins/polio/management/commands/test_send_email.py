from django.core.management.base import BaseCommand
from plugins.polio.models import Campaign
from plugins.polio.tasks.weekly_email import send_notification_email


class Command(BaseCommand):
    help = "Send campaign automatic email to GPEI coordinator"

    def handle(self, *args, **options):
        # replace obr_name value by one you set locally in a campaign
        my_campaign = Campaign.objects.get(obr_name="GAM-65DS-06-2023")
        print(my_campaign)
        send_notification_email(my_campaign)
