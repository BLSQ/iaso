"""Edits a submission's XML with odk_cli (https://github.com/BLSQ/odk_cli), JavaRosa compiled to a native binary:
the engine of ODK Collect, so an edit is checked and recomputed as Collect would on the device - the calculates and
the relevance follow the new answers, then the required questions and the constraints are checked.

The binary is `settings.ODK_CLI_PATH`; one process per edit (a native image starts in milliseconds)."""

import json
import os
import re
import subprocess
import tempfile

from dataclasses import dataclass
from typing import Dict, List, Optional

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


@dataclass(frozen=True)
class EditProblem:
    """`code`: odk_cli's (`CONSTRAINT`, `REQUIRED`, `READ_ONLY`...). `path`: the question at fault - an answered one,
    or another one it broke -, `None` for the submission as a whole. `answer`: the value refused, if any."""

    code: str
    message: str
    path: Optional[str] = None
    answer: Optional[str] = None


class InstanceEditError(Exception):
    """The edit was refused: every problem found, in the order of the form."""

    def __init__(self, problems: List[EditProblem]):
        super().__init__(
            "; ".join(f"{problem.path}: {problem.message}" if problem.path else problem.message for problem in problems)
        )
        self.problems = problems


class InstanceEditorUnavailable(Exception):
    """odk_cli isn't installed, or failed in a way that isn't the edit's fault."""


def edit_instance(
    xform: bytes, submission: bytes, answers: Dict[str, Optional[str]], csvs: Optional[Dict[str, bytes]] = None
) -> bytes:
    """The edited submission XML.

    `answers`: question path below the root (`group/question`, `repeat[2]/question` for the 2nd repeat instance)
    -> value as written in the XML, `None` to clear it. `csvs`: the form's CSV attachments, by name, for
    `pulldata()`."""
    unwritable = [
        EditProblem("INVALID", "The value contains characters XML can't hold", path, value)
        for path, value in answers.items()
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

        command = [
            settings.ODK_CLI_PATH,
            "edit",
            "--xform",
            written("form.xml", xform),
            # numeric entities of emojis written by old devices, which the XML parser refuses
            "--instance",
            written("submission.xml", fix_emoji(submission.decode("utf-8"))),
            "--answers-file",
            written("answers.json", json.dumps(answers).encode()),
        ]
        for index, (name, content) in enumerate((csvs or {}).items()):
            command += ["--csv", f"{name}={written(f'attachment_{index}.csv', content)}"]

        try:
            result = subprocess.run(command, capture_output=True, timeout=TIMEOUT_SECONDS, check=False)
        except FileNotFoundError:
            raise InstanceEditorUnavailable(f"odk_cli isn't installed at {settings.ODK_CLI_PATH} (ODK_CLI_PATH)")
        except subprocess.TimeoutExpired:
            raise InstanceEditorUnavailable(f"odk_cli didn't answer within {TIMEOUT_SECONDS}s")

    if result.returncode == 0:
        return result.stdout
    try:
        failure = json.loads(result.stderr)
    except ValueError:
        failure = {}
    if not isinstance(failure, dict) or not failure.get("refused"):
        # not the edit's fault: an XForm JavaRosa can't parse, a crash...
        raise InstanceEditorUnavailable(f"odk_cli failed: {result.stderr[:1000]!r}")
    raise InstanceEditError(
        [
            EditProblem(
                error["code"] if error["code"] in EDIT_CODES else "INVALID",
                error["message"],
                error.get("path"),
                error.get("answer"),
            )
            for error in failure["errors"]
        ]
    )
