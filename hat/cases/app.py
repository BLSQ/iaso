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

    with connection.cursor() as cursor:
        sql_context = {
          'case_file': False,  # not implemented yet
          'location_file': False,  # not implemented yet
        }

        cursor.execute(prepare_queries.prepare_extensions(**sql_context))
        cursor.execute(prepare_queries.prepare_tables(**sql_context))
        cursor.execute(prepare_queries.prepare_indices(**sql_context))
        cursor.execute(prepare_queries.prepare_triggers(**sql_context))
        cursor.execute(prepare_queries.prepare_views(**sql_context))
        cursor.execute(duplicates_queries.prepare())
