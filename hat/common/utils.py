from typing import List
from uuid import uuid4
from subprocess import run, PIPE, CalledProcessError
from django.conf import settings


def run_cmd(cmd: List[str]) -> str:
    '''Helper function to run an external command.'''
    try:
        r = run(cmd, stdout=PIPE, stderr=PIPE, check=True)
    except CalledProcessError as exc:
        msg = exc.stdout.decode() + exc.stderr.decode()
        raise Exception('Subprocess error: ' + msg)
    return r.stdout.decode()


def create_shared_filename(suffix: str) -> str:
    '''Create a unique filename in the shared directory with given suffix.'''
    return '{}/{}{}'.format(settings.SHARED_DIR, str(uuid4()), suffix)
