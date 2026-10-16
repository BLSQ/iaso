"""Fills a form as the IASO app would, with its own form engine: JavaRosa, through `odk_cli`
(https://github.com/BLSQ/odk_cli, installed by the Docker images).

`odk_cli new` fills the blank form as the app starts one, in its order: a new submission (the defaults that are
expressions, `today()`..., and the preloads: `uid`, `start`), then the prefill (`PRE_FILLED_ANSWERS`, read-only
questions and calculates too), then the answers; calculates and relevance recomputed, required questions and
constraints checked - every problem reported, in the form's order, with the form's own constraint messages.
"""

import json
import os
import subprocess
import tempfile

from copy import deepcopy
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from django.conf import settings
from lxml import etree


XFORMS_NAMESPACE = "http://www.w3.org/2002/xforms"
XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml"


class FormEngineError(Exception):
    """odk_cli is missing, or failed for a reason that isn't the answers (invalid form...)."""


@dataclass
class FormProblem:
    """`code`: odk_cli's - REQUIRED, CONSTRAINT, NOT_RELEVANT, UNKNOWN_QUESTION, UNKNOWN_CHOICE, NOT_A_QUESTION,
    READ_ONLY, INVALID."""

    code: str
    path: Optional[str]
    message: str
    answer: Optional[str] = None


@dataclass
class FormFill:
    """The submission (`values`: by question name, None when empty) or why the form refuses it (`problems`)."""

    xml: Optional[str] = None
    values: Dict[str, Optional[str]] = field(default_factory=dict)
    problems: List[FormProblem] = field(default_factory=list)


def _local(tag) -> str:
    return etree.QName(tag).localname if isinstance(tag, str) else ""


def _primary_instance(root: etree._Element) -> etree._Element:
    model = root.find(f"{{{XHTML_NAMESPACE}}}head/{{{XFORMS_NAMESPACE}}}model")
    if model is None:
        raise FormEngineError("Not an XForm: no h:head/model")
    instance = next((child for child in model if _local(child.tag) == "instance" and not child.get("id")), None)
    if instance is None or len(instance) == 0:
        raise FormEngineError("Not an XForm: no primary instance")
    return instance[0]


def blank_instance(xform: bytes) -> etree._Element:
    """The form's primary instance: its blank submission."""
    return deepcopy(_primary_instance(etree.fromstring(xform, parser=etree.XMLParser(huge_tree=True))))


def with_defaults(xform: bytes, values: Dict[str, str]) -> bytes:
    """The XForm with `values` (by question name) as the default answers of its primary instance - how the scenario
    editor opens a form prefilled, in web-forms. A name the form doesn't have is ignored."""
    root = etree.fromstring(xform, parser=etree.XMLParser(huge_tree=True))
    by_name = _by_name(_primary_instance(root))
    for name, value in values.items():
        if name in by_name:
            by_name[name][1].text = value
    return etree.tostring(root, xml_declaration=True, encoding="UTF-8")


def leaves(element: etree._Element, path: str = "") -> List[tuple]:
    """(path below the root, element) of every element without children, in document order."""
    found = []
    for child in element:
        if not isinstance(child.tag, str):
            continue
        child_path = f"{path}/{_local(child.tag)}" if path else _local(child.tag)
        if len(child) == 0:
            found.append((child_path, child))
        else:
            found += leaves(child, child_path)
    return found


def _by_name(instance: etree._Element) -> Dict[str, tuple]:
    """Question name -> (path, element), the first one of that name, as the app matches names."""
    by_name: Dict[str, tuple] = {}
    for path, element in leaves(instance):
        by_name.setdefault(_local(element.tag), (path, element))
    return by_name


def fill(xform: bytes, prefilled: Dict[str, str], answers: Dict[str, str]) -> FormFill:
    """Fills the blank form: `prefilled` then `answers`, both by question name."""
    by_name = _by_name(blank_instance(xform))
    # odk_cli takes the answers' paths below the root; a name the form doesn't have is left as is, odk_cli reports it
    answers_by_path = {by_name[name][0] if name in by_name else name: value for name, value in answers.items()}

    with tempfile.TemporaryDirectory() as directory:
        xform_path = os.path.join(directory, "form.xml")
        prefilled_path = os.path.join(directory, "prefilled.json")
        answers_path = os.path.join(directory, "answers.json")
        with open(xform_path, "wb") as xform_file:
            xform_file.write(xform)
        with open(prefilled_path, "w") as prefilled_file:
            json.dump(prefilled, prefilled_file)
        with open(answers_path, "w") as answers_file:
            json.dump(answers_by_path, answers_file)
        # ODK_CLI_TIMEOUT_SECONDS: a pathological form doesn't hold the run
        odk_cli, timeout = settings.ODK_CLI_PATH, settings.ODK_CLI_TIMEOUT_SECONDS
        try:
            completed = subprocess.run(
                [odk_cli, "new", "-x", xform_path, "-pf", prefilled_path, "-af", answers_path],
                capture_output=True,
                timeout=timeout,
            )
        except FileNotFoundError:
            raise FormEngineError(f"odk_cli isn't installed ({odk_cli}): forms can't be filled")
        except subprocess.TimeoutExpired:
            raise FormEngineError(f"odk_cli took more than {timeout}s")

    if completed.returncode == 0:
        submission = etree.fromstring(completed.stdout)
        values = {}
        for _, element in leaves(submission):
            values.setdefault(_local(element.tag), element.text if element.text else None)
        return FormFill(xml=completed.stdout.decode("utf-8"), values=values)

    try:
        report = json.loads(completed.stderr)
    except ValueError:
        raise FormEngineError(f"odk_cli failed: {completed.stderr.decode('utf-8', 'replace')[:500]}")
    if not report.get("refused"):
        raise FormEngineError(f"odk_cli failed: {report.get('error')}")
    return FormFill(
        problems=[
            FormProblem(error["code"], error.get("path"), error["message"], error.get("answer"))
            for error in report["errors"]
        ]
    )
