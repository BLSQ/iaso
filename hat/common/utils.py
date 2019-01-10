import gc
from typing import List, Any
from uuid import uuid4
from subprocess import run, PIPE, CalledProcessError
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist


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


def queryset_iterator(queryset, chunk_size=1000):
    """
    Iterate over a Django Queryset ordered by the primary key
    This method loads a maximum of chunk_size (default: 1000) rows in it's
    memory at the same time while django normally would load all rows in it's
    memory. Using the iterator() method only causes it to not preload all the
    classes.
    Note that the implementation of the iterator does not support ordered query sets.
    source: https://gist.github.com/syrusakbary/7982653
    """
    try:
        last_pk = queryset.order_by('-id')[:1].get().id
    except ObjectDoesNotExist:
        return

    pk = 0
    queryset = queryset.order_by('id')
    while pk < last_pk:
        for row in queryset.filter(id__gt=pk)[:chunk_size]:
            pk = row.id
            yield row
        gc.collect()

ANONYMOUS_PLACEHOLDER = "•••••••••••"
