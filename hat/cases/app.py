from datetime import datetime
from django.apps import AppConfig
from django.db.models.signals import post_migrate
from django_rq import get_scheduler


class CasesAppConfig(AppConfig):
    name = 'hat.cases'

    def ready(self):
        post_migrate.connect(setup_db, sender=self)

        # schedule jobs
        scheduler = get_scheduler('default')

        # Delete any existing job to prevent duplicating them
        for job in scheduler.get_jobs():
            job.delete()

        # Run the duplicates detection task daily at night (2am)
        scheduler.cron(
            ('0 2 * * *'),
            func='hat.cases.tasks.duplicates_task',
        )

        # run the sync import task every hour since now
        scheduler.schedule(
            scheduled_time=datetime.utcnow(),
            func='hat.import_export.tasks.import_synced_devices_task',
            interval=60*60,
        )


def setup_db(sender, **kwargs):
    from hat.queries import prepare_db
    prepare_db()
