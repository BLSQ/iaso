from django.apps import AppConfig
from django_rq import get_scheduler
from .tasks import duplicates_task


class CasesAppConfig(AppConfig):
    name = 'hat.cases'

    def ready(self):
        # schedule jobs
        scheduler = get_scheduler('default')

        # Delete any existing job to prevent duplicating them
        for job in scheduler.get_jobs():
            job.delete()

        # Run the duplicates detection daily at night
        scheduler.cron(
            ('0 2 * * *'),
            func=duplicates_task
        )
