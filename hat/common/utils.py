from subprocess import run, PIPE, CalledProcessError


def run_cmd(cmd):
    try:
        r = run(cmd, stdout=PIPE, stderr=PIPE, check=True)
    except CalledProcessError as exc:
        msg = exc.stdout.decode() + exc.stderr.decode()
        raise Exception('Subprocess error: ' + msg)
    return r.stdout.decode()
