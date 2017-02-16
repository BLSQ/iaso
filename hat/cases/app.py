from django.apps import AppConfig
from django.db.models.signals import post_migrate
from django_rq import get_scheduler
from .tasks import duplicates_task


class CasesAppConfig(AppConfig):
    name = 'hat.cases'

    def ready(self):
        post_migrate.connect(prepare_db, sender=self)

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


def prepare_db(sender, **kwargs):
    from django.db import connection
    from .queries import prepare_queries, duplicates_queries

    # TODO: migrate files from couchdb to postgresql

    with connection.cursor() as cursor:
        cursor.execute(prepare_queries.prepare_extensions())
        cursor.execute(prepare_queries.prepare_indices())
        cursor.execute(prepare_queries.prepare_views())
        cursor.execute(prepare_queries.cleaning())
        cursor.execute(duplicates_queries.prepare())
