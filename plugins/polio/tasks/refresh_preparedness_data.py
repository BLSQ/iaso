import logging
from datetime import datetime, timedelta

from django.utils.timezone import now

from beanstalk_worker import task_decorator
from plugins.polio.models import Campaign, Round, SpreadSheetImport
from plugins.polio.preparedness import warning_email
from plugins.polio.preparedness.summary import set_preparedness_cache_for_round

logger = logging.getLogger(__name__)


@task_decorator(task_name="refresh_data")
def refresh_data(
    campaigns=None,
    task=None,
):
    started_at = datetime.now()
    round_qs = Round.objects.filter(preparedness_spreadsheet_url__isnull=False).prefetch_related("campaign")
    round_qs = round_qs.filter(started_at__gte=now() - timedelta(days=180))
    round_qs = round_qs.exclude(campaign__isnull=True)
    round_qs = round_qs.filter(campaign__deleted_at__isnull=True)
    round_qs = round_qs.order_by("-started_at")
    if campaigns is not None:
        for campaign_name in campaigns:
            round_qs = round_qs.filter(campaign__obr_name__icontains=campaign_name)
        round_qs.update(preparedness_sync_status="QUEUED")
    logger.info(round_qs)
    count = round_qs.count()

    round: Round
    for i, round in enumerate(round_qs):
        round.preparedness_sync_status = "ONGOING"
        round.save()

        task.report_progress_and_stop_if_killed(
            progress_value=i,
            end_value=count,
            progress_message=f"Round {round.pk} refresh started: {round.preparedness_spreadsheet_url}",
        )
        try:
            ssi = SpreadSheetImport.create_for_url(round.preparedness_spreadsheet_url)
            cs = ssi.cached_spreadsheet
            logger.info(f"using spread: {cs.title}")
            round.preparedness_sync_status = "FINISHED"
            round.save()
            set_preparedness_cache_for_round(round)

        except Exception as e:
            logger.error(f"Round {round} refresh failed")
            logger.exception(e)
            round.preparedness_sync_status = "FAILURE"
            round.save()

    # Email warning sending logic
    # only take round that are going to start, not old one
    upcoming_rounds = round_qs.filter(started_at__gte=now() - timedelta(days=1)).filter(campaign__isnull=False)
    warning_email.send_warning_email(upcoming_rounds)

    finished_at = datetime.now()
    the_duration = (finished_at - started_at).total_seconds()
    task.report_success(f"Finished in {the_duration} seconds")
