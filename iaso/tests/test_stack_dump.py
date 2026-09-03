import os
import signal
import tempfile

from django.test import SimpleTestCase

from iaso.stack_dump import register_stack_dump_signal


class StackDumpSignalTestCase(SimpleTestCase):
    def tearDown(self):
        # Don't leak our handler into other tests / the process.
        if hasattr(signal, "SIGUSR2"):
            signal.signal(signal.SIGUSR2, signal.SIG_DFL)

    def test_sigusr2_dumps_stack_and_process_survives(self):
        if not hasattr(signal, "SIGUSR2"):
            self.skipTest("SIGUSR2 is not available on this platform")

        with tempfile.NamedTemporaryFile() as tmp:
            register_stack_dump_signal(file=tmp)

            # If this regresses to chain=True, SIGUSR2's default disposition
            # (terminate the process) fires right after the dump, and the
            # test process is killed here instead of reaching the assertions.
            os.kill(os.getpid(), signal.SIGUSR2)

            tmp.seek(0)
            dump = tmp.read().decode()

        self.assertIn("Current thread", dump)
        self.assertIn("test_sigusr2_dumps_stack_and_process_survives", dump)
