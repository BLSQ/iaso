from logging import getLogger

from django.core.management.base import BaseCommand
from django.db import connections

from beanstalk_worker import task_service

LISTEN_TIMEOUT = 30

logger = getLogger(__name__)

import select


class Command(BaseCommand):
    help = """Permanently listen for new background task and execute them
    
    For local and dev, don't run more than one as it is not designed for concurrency"""

    def handle(self, *args, **kwargs):
        # see `Worker connection` in services.py
        connection = connections["worker"]

        cur = connection.cursor()
        cur.execute("LISTEN new_task;")
        pg_conn = cur.connection  # psycopg connection instead of the django wrapper

        print(f"Listening for task on {pg_conn.dsn} .... Press ^C to stop")

        while True:
            task_service.run_all()
            # queue is empty, wait till we receive a new notification
            if select.select([pg_conn], [], [], LISTEN_TIMEOUT) == ([], [], []):
                print("Listen Timeout, check if there is a task anyway")
            else:
                pg_conn.poll()
                print(pg_conn.notifies)
                while pg_conn.notifies:
                    notify = pg_conn.notifies.pop(0)
                    print(notify)
            continue
