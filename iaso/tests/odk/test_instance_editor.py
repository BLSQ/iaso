import json
import os
import stat
import tempfile

from unittest import mock

from django.test import SimpleTestCase, override_settings

from iaso.odk import instance_editor
from iaso.odk.instance_editor import EditProblem, InstanceEditError, InstanceEditorUnavailable, edit_instance


class InstanceEditorTestCase(SimpleTestCase):
    """The contract with the odk_cli binary, against a fake one: the files it gets, the exit codes and the JSON on
    stderr it answers with. What the edit itself does is tested through the real binary in
    `iaso/tests/graphql/test_instance_mutations.py`."""

    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.directory = directory.name
        self.calls = os.path.join(self.directory, "calls.json")

    def fake_odk_cli(self, stdout="", stderr="", exit_code=0, sleep=0):
        """Records its arguments and the files they name, then answers as told."""
        script = os.path.join(self.directory, "odk_cli")
        with open(script, "w") as file:
            file.write(
                f"""#!/usr/bin/env python3
import json, sys, time
arguments = sys.argv[1:]
files = {{value: open(value, "rb").read().decode() for value in arguments if value.startswith("/")}}
attachments = [value.split("=", 1) for value in arguments if "=" in value]
files.update({{name: open(path, "rb").read().decode() for name, path in attachments}})
json.dump({{"arguments": arguments, "files": files}}, open({self.calls!r}, "w"))
time.sleep({sleep})
sys.stdout.write({stdout!r})
sys.stderr.write({stderr!r})
sys.exit({exit_code})
"""
            )
        os.chmod(script, os.stat(script).st_mode | stat.S_IEXEC)
        return override_settings(ODK_CLI_PATH=script)

    def edit(self, answers=None, csvs=None):
        return edit_instance(b"<h:html/>", b"<data/>", answers or {"group/question": "1"}, csvs)

    def test_edited_xml_from_stdout(self):
        with self.fake_odk_cli(stdout="<data>edited</data>"):
            xml = self.edit({"group/question": "1", "repeat[2]/other": None}, {"names.csv": b"name\nAmina"})
        self.assertEqual(xml, b"<data>edited</data>")
        with open(self.calls) as file:
            call = json.load(file)
        arguments, files = call["arguments"], call["files"]
        self.assertEqual(arguments[0], "edit")
        named = dict(zip(arguments[1::2], arguments[2::2]))
        self.assertEqual(files[named["--xform"]], "<h:html/>")
        self.assertEqual(files[named["--instance"]], "<data/>")
        self.assertEqual(json.loads(files[named["--answers-file"]]), {"group/question": "1", "repeat[2]/other": None})
        self.assertEqual(files["names.csv"], "name\nAmina")

    def test_emoji_entities_of_old_devices_are_fixed_first(self):
        with self.fake_odk_cli(stdout="<data/>"):
            edit_instance(b"<h:html/>", b"<data><a>&#55357;&#56397;</a></data>", {"a": "1"})
        with open(self.calls) as file:
            files = json.load(file)["files"]
        self.assertIn("<data><a>\U0001f44d</a></data>", files.values())

    def test_refused_with_every_problem(self):
        refusal = {
            "refused": True,
            "errors": [
                {"code": "NOT_RELEVANT", "path": "group/question", "message": "Not relevant", "answer": "1"},
                {"code": "CONSTRAINT", "path": "group/other", "message": "Too big"},
            ],
        }
        with self.fake_odk_cli(stderr=json.dumps(refusal), exit_code=1):
            with self.assertRaises(InstanceEditError) as raised:
                self.edit()
        error = raised.exception
        self.assertEqual(
            error.problems,
            [
                EditProblem("NOT_RELEVANT", "Not relevant", "group/question", "1"),
                EditProblem("CONSTRAINT", "Too big", "group/other"),
            ],
        )
        self.assertEqual(str(error), "group/question: Not relevant; group/other: Too big")

    def test_refused_without_a_path(self):
        refusal = {
            "refused": True,
            "errors": [
                {"code": "INVALID_SUBMISSION", "message": "The submission (<other>) isn't one of this form (<data>)"}
            ],
        }
        with self.fake_odk_cli(stderr=json.dumps(refusal), exit_code=1):
            with self.assertRaisesMessage(InstanceEditError, "isn't one of this form"):
                self.edit()

    def test_values_xml_cant_hold_are_refused_without_running_it(self):
        with self.fake_odk_cli(stdout="<data/>"):
            with self.assertRaises(InstanceEditError) as raised:
                self.edit({"group/question": "a\x00b", "group/fine": "c", "group/other": "\x01"})
        self.assertEqual([problem.path for problem in raised.exception.problems], ["group/question", "group/other"])
        self.assertEqual({problem.code for problem in raised.exception.problems}, {"INVALID"})
        self.assertFalse(os.path.exists(self.calls))

    def test_failures_that_arent_the_edits_fault(self):
        for stderr in ['{"error": ">> XForm is invalid."}', "Segmentation fault", "[]"]:
            with self.subTest(stderr=stderr), self.fake_odk_cli(stderr=stderr, exit_code=1):
                with self.assertRaisesMessage(InstanceEditorUnavailable, "odk_cli failed"):
                    self.edit()

    @override_settings(ODK_CLI_PATH="/nonexistent/odk_cli")
    def test_not_installed(self):
        with self.assertRaisesMessage(InstanceEditorUnavailable, "isn't installed at /nonexistent/odk_cli"):
            self.edit()

    def test_timeout(self):
        with self.fake_odk_cli(stdout="<data/>", sleep=5), mock.patch.object(instance_editor, "TIMEOUT_SECONDS", 0.5):
            with self.assertRaisesMessage(InstanceEditorUnavailable, "didn't answer within 0.5s"):
                self.edit()
