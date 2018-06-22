from typing import List, Any
from uuid import uuid4
from subprocess import run, PIPE, CalledProcessError
from django.conf import settings


def run_cmd(cmd: List[str], **kwargs: Any) -> str:
    '''Helper function to run an external command.'''
    args = {
        'stdout': PIPE,
        'stderr': PIPE,
        'check': True,
        **kwargs
    }
    try:
        r = run(cmd, **args)
    except CalledProcessError as exc:
        msg = exc.stdout.decode() + exc.stderr.decode()
        raise Exception('Subprocess error: ' + msg)
    return r.stdout.decode()


def create_shared_filename(suffix: str) -> str:
    '''Create a unique filename in the shared directory with given suffix.'''
    return '{}/{}{}'.format(settings.SHARED_DIR, str(uuid4()), suffix)


# https://stackoverflow.com/questions/1265665/how-can-i-check-if-a-string-represents-an-int-without-using-try-except
def is_int(s):
    if s is None:
        return False
    try:
        int(s)
        return True
    except ValueError:
        return False
