from datetime import datetime
from django.apps import AppConfig
from django.db.models.signals import pre_migrate, post_migrate
from django_rq import get_scheduler


class CasesAppConfig(AppConfig):
    name = 'hat.cases'

    def ready(self) -> None:
        pre_migrate.connect(setup_premigration_db, sender=self)
        post_migrate.connect(setup_postmigration_db, sender=self)

        # schedule jobs
        scheduler = get_scheduler('default')

        # Delete any existing job to prevent duplicating them
        for job in scheduler.get_jobs():
            job.delete()

        # Run the duplicates detection task daily at night (2am)
        scheduler.cron(
            ('0 2 * * *'),
            func='hat.tasks.jobs.duplicates_task',
        )

        # run the sync import task every hour since now
        scheduler.schedule(
            scheduled_time=datetime.utcnow(),
            func='hat.tasks.jobs.import_synced_devices_task',
            interval=60*60,
        )


def setup_premigration_db(sender, **kwargs):  # type: ignore
    from hat.queries import prepare_premigration
    prepare_premigration()


def setup_postmigration_db(sender, **kwargs):  # type: ignore
    from hat.queries import prepare_postmigration
    prepare_postmigration()
