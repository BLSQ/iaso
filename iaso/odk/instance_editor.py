"""Fills and edits submissions with odk_cli (https://github.com/BLSQ/odk_cli), JavaRosa compiled to a native binary:
the engine of ODK Collect, so a submission is checked and computed as Collect would on the device - the calculates and
the relevance follow the answers, then the required questions and the constraints are checked.

The binary is `settings.ODK_CLI_PATH`; one process per submission (a native image starts in milliseconds). It reads the
form's files from the paths it is given (`iaso.odk.form_files.local_copy`), the submission's in a temporary directory."""

import json
import os
import re
import subprocess
import tempfile

from dataclasses import dataclass
from typing import Optional

from django.conf import settings

from iaso.utils.emoji import fix_emoji


#: a process stuck on a pathological form doesn't hold the request (and the submission's row lock)
TIMEOUT_SECONDS = 10

#: odk_cli's refusal codes (`InstanceEditor.EditError`): any other one is reported as `INVALID`
EDIT_CODES = frozenset(
    {
        "UNKNOWN_QUESTION",
        "NOT_A_QUESTION",
        "READ_ONLY",
        "UNKNOWN_CHOICE",
        "INVALID",
        "NOT_RELEVANT",
        "REQUIRED",
        "CONSTRAINT",
        "INVALID_SUBMISSION",
    }
)

#: control characters other than tab and line breaks: XML 1.0 can't hold them
INVALID_XML_CHARACTERS = re.compile("[\x00-\x08\x0b\x0c\x0e-\x1f]")

Answers = dict[str, Optional[str]]


@dataclass(frozen=True)
class EditProblem:
    """`code`: odk_cli's (`CONSTRAINT`, `REQUIRED`, `READ_ONLY`...). `path`: the question at fault - an answered one,
    or another one it broke -, `None` for the submission as a whole. `answer`: the value refused, if any."""

    code: str
    message: str
    path: Optional[str] = None
    answer: Optional[str] = None


class InstanceEditError(Exception):
    """The submission was refused: every problem found, in the order of the form."""

    def __init__(self, problems: list[EditProblem]):
        super().__init__(
            "; ".join(f"{problem.path}: {problem.message}" if problem.path else problem.message for problem in problems)
        )
        self.problems = problems


class InstanceEditorUnavailable(Exception):
    """odk_cli isn't installed, or failed in a way that isn't the submission's fault."""


def edit_instance(
    xform: str,
    submission: bytes,
    answers: Answers,
    csvs: Optional[dict[str, str]] = None,
    prefilled: Optional[Answers] = None,
    existing_problems: Optional[list[EditProblem]] = None,
) -> bytes:
    """The edited submission XML. `xform`: the path of the XForm.

    `answers`: question path below the root (`group/question`, `repeat[2]/question` for the 2nd repeat instance, added
    if missing) -> value as written in the XML, `None` to clear it. `csvs`: the paths of the form's CSV attachments, by
    name, for `pulldata()`. `prefilled`: as in `new_instance`, set again before the answers (the org unit context).

    `existing_problems`: when given, the problems the submission already had on questions not answered don't refuse
    the edit: they are added there (odk_cli's `--keep-existing-problems`)."""
    # numeric entities of emojis written by old devices, which the XML parser refuses
    files = {"--instance": fix_emoji(submission.decode("utf-8"))}
    if prefilled:
        files["--prefilled-file"] = json.dumps(prefilled).encode()
    return _run("edit", xform, files, answers, csvs, prefilled=prefilled, warnings=existing_problems)


def new_instance(xform: str, prefilled: Answers, answers: Answers, csvs: Optional[dict[str, str]] = None) -> bytes:
    """A new submission XML: the blank form as Collect starts one (defaults, preloads: `instanceID`, `start`...),
    `prefilled` by question name as Collect's prefilled answers (read-only questions and calculates accepted), then
    `answers` as in `edit_instance`."""
    files = {"--prefilled-file": json.dumps(prefilled).encode()}
    return _run("new", xform, files, answers, csvs, prefilled=prefilled)


def _run(
    command: str,
    xform: str,
    files: dict[str, bytes],
    answers: Answers,
    csvs: Optional[dict[str, str]],
    prefilled: Optional[Answers] = None,
    warnings: Optional[list[EditProblem]] = None,
) -> bytes:
    unwritable = [
        EditProblem("INVALID", "The value contains characters XML can't hold", path, value)
        for path, value in {**(prefilled or {}), **answers}.items()
        if value is not None and INVALID_XML_CHARACTERS.search(value)
    ]
    if unwritable:
        raise InstanceEditError(unwritable)

    with tempfile.TemporaryDirectory(prefix="odk_cli_") as directory:

        def written(name: str, content: bytes) -> str:
            path = os.path.join(directory, name)
            with open(path, "wb") as file:
                file.write(content)
            return path

        arguments = [settings.ODK_CLI_PATH, command, "--xform", xform]
        for index, (option, content) in enumerate(files.items()):
            arguments += [option, written(f"file_{index}", content)]
        arguments += ["--answers-file", written("answers.json", json.dumps(answers).encode())]
        for name, path in (csvs or {}).items():
            arguments += ["--csv", f"{name}={path}"]
        if warnings is not None:
            arguments.append("--keep-existing-problems")

        try:
            result = subprocess.run(arguments, capture_output=True, timeout=TIMEOUT_SECONDS, check=False)
        except FileNotFoundError:
            raise InstanceEditorUnavailable(f"odk_cli isn't installed at {settings.ODK_CLI_PATH} (ODK_CLI_PATH)")
        except subprocess.TimeoutExpired:
            raise InstanceEditorUnavailable(f"odk_cli didn't answer within {TIMEOUT_SECONDS}s")

    if result.returncode == 0:
        if warnings is not None and result.stderr.strip():
            warnings += _problems(_stderr_json(result.stderr).get("warnings", []))
        return result.stdout
    failure = _stderr_json(result.stderr)
    if not failure.get("refused"):
        # not the submission's fault: an XForm JavaRosa can't parse, a crash...
        raise InstanceEditorUnavailable(f"odk_cli failed: {result.stderr[:1000]!r}")
    raise InstanceEditError(_problems(failure["errors"]))


def _stderr_json(stderr: bytes) -> dict:
    try:
        parsed = json.loads(stderr)
    except ValueError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _problems(errors: list[dict]) -> list[EditProblem]:
    return [
        EditProblem(
            error["code"] if error["code"] in EDIT_CODES else "INVALID",
            error["message"],
            error.get("path"),
            error.get("answer"),
        )
        for error in errors
    ]
