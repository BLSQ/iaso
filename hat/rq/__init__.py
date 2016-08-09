from redis import Redis
from rq import Connection
from rq.job import Job
from rq.exceptions import NoSuchJobError
from django.conf import settings


redis_conn = Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    password=settings.REDIS_PASSWORD,
    db=settings.REDIS_DB
)


def get_task_status(id: str) -> str:
    '''
    Return the status, can be one of:
    - queued
    - finished
    - failed
    - started
    - deferred
    '''
    with Connection(redis_conn) as conn:
        try:
            job = Job.fetch(id, conn)
        except NoSuchJobError:
            return 'notfound'
        return job.status


def get_task_result(id: str) -> str:
    '''Return the tasks return value which is stored in redis.'''
    with Connection(redis_conn) as conn:
        job = Job.fetch(id, conn)
        return job.result
