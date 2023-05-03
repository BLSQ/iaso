from django.core.management.base import BaseCommand
from django.utils.timezone import now

from iaso.management.commands.command_logger import CommandLogger
from iaso.management.commands.dhis2_ou_importer import FakeTask
from plugins.polio.models import Campaign
from plugins.polio.tasks.weekly_email import send_notification_email, send_email
from logging import getLogger

logger = getLogger(__name__)


class Command(BaseCommand):
    help = """Send campaigns automatic email to GPEI coordinator
    (to use for dev debguging)"""

    def handle(self, *args, **options):
        campaigns = Campaign.objects.exclude(enable_send_weekly_email=False)
        total = campaigns.count()
        email_sent = 0
        iaso_logger = CommandLogger(self.stdout)
        task = FakeTask(iaso_logger)

        for i, campaign in enumerate(campaigns):
            task.report_progress_and_stop_if_killed(
                progress_value=i,
                end_value=total,
                progress_message=f"Campaign {campaign.pk} started",
            )

            latest_round_end = campaign.rounds.order_by("ended_at").last()
            if latest_round_end and latest_round_end.ended_at and latest_round_end.ended_at < now().date():
                print(f"Campaign {campaign} is finished, skipping")
                continue
            print(f"Email for {campaign.obr_name}")
            status = send_notification_email(campaign)
            if not status:
                logger.info(f"... skipped")
            else:
                email_sent += 1
        task.report_success(f"Finished sending {email_sent} weekly-email(s)")
