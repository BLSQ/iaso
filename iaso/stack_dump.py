import faulthandler
import signal
import sys


def register_stack_dump_signal(file=None):
    """Dump every thread's stack to stderr (-> container logs) on SIGUSR2.

    Our production images run as a non-root user, and Elastic Beanstalk gives
    us no way to grant the container SYS_PTRACE, so tools like py-spy can't
    attach from inside the container. This gives us an equivalent, in-process
    way to inspect a stuck process:

        kill -USR2 <pid>

    SIGUSR1 is intentionally left alone: gunicorn's master already uses it to
    reopen log files.

    chain=False (the default) is required here: SIGUSR2's default
    disposition is to terminate the process, so chaining to it would kill
    the process right after dumping its stack instead of just logging it.

    `file` defaults to stderr; tests can pass a real file to inspect the dump.
    """
    if not hasattr(signal, "SIGUSR2"):
        return  # no SIGUSR2 on Windows (local dev only)

    faulthandler.register(signal.SIGUSR2, file=file or sys.stderr, all_threads=True, chain=False)
