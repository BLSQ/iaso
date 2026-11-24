"""Shared fixtures of the PII filtering tests of the submission diff API (`/api/diff/instances/<instance_id>/`).

The API returns the audit log of a submission (`past_value` / `new_value` snapshots, their `diff`) and the
attachments of the submission (`files`). The PII tests check every combination of:

- the user has the `iaso_submissions_pii` permission / does not have it;
- the form is not marked as having PII (`non_pii_fields` is null) / is marked as having PII;
- for a form marked as having PII: some questions are whitelisted (`non_pii_fields` lists them) / none is
  (`non_pii_fields` is empty).

A form not marked as having PII has no whitelist by definition, so "not marked + whitelisted questions" is not a
possible combination. `PII_CASES` lists the 6 others, the view and serializer tests both go through all of them.
"""

import enum
import json
import typing

from hat.audit.models import INSTANCE_API, log_modification
from iaso import models as m
from iaso.permissions.core_permissions import CORE_SUBMISSIONS_PERMISSION, CORE_SUBMISSIONS_PII_PERMISSION
from iaso.test import APITestCase


# Answers of the submission before and after the logged modification. `first_name`, `id_card` and
# `household/head_name` contain personal data, the others don't.
PAST_JSON = {
    "first_name": "Amina",
    "muac": "12.5",
    "district": "North",
    "photo": "child.jpg",
    "id_card": "card.jpg",
    "household": {"head_name": "Moussa", "size": "4"},
    "_version": "1",
    "meta": {"instanceID": "uuid:7c0f3f6e"},
}
NEW_JSON = {
    **PAST_JSON,
    "first_name": "Aminata",
    "muac": "13.1",
    "household": {"head_name": "Moussa Diallo", "size": "5"},
}

# Personal data that must never leak to a user without the PII permission, on a form marked as having PII
PII_VALUES = ["Amina", "Moussa", "card.jpg"]

# What a user without the PII permission sees of the answers when `photo`, `muac`, `district` and `household/size`
# are whitelisted. Technical keys (`_version`, `meta/instanceID`) are always visible.
WHITELIST = ["muac", "district", "photo", "size"]
WHITELISTED_PAST_JSON = {
    "muac": "12.5",
    "district": "North",
    "photo": "child.jpg",
    "household": {"size": "4"},
    "_version": "1",
    "meta": {"instanceID": "uuid:7c0f3f6e"},
}
WHITELISTED_NEW_JSON = {**WHITELISTED_PAST_JSON, "muac": "13.1", "household": {"size": "5"}}

# ... and when nothing is whitelisted
TECHNICAL_ONLY_JSON = {"_version": "1", "meta": {"instanceID": "uuid:7c0f3f6e"}}

FULL_JSON_DIFF = [
    {"op": "replace", "path": "/json/first_name", "value": "Aminata"},
    {"op": "replace", "path": "/json/muac", "value": "13.1"},
    {"op": "replace", "path": "/json/household/head_name", "value": "Moussa Diallo"},
    {"op": "replace", "path": "/json/household/size", "value": "5"},
]
WHITELISTED_JSON_DIFF = [
    {"op": "replace", "path": "/json/muac", "value": "13.1"},
    {"op": "replace", "path": "/json/household/size", "value": "5"},
]


class Visibility(enum.Enum):
    """What a user sees of a submission."""

    EVERYTHING = "everything"
    WHITELISTED_FIELDS = "whitelisted fields only"
    TECHNICAL_FIELDS = "technical fields only"


class PiiCase(typing.NamedTuple):
    user: str  # attribute name of the user on the test case
    instance: str  # attribute name of the submission on the test case
    visibility: Visibility

    @property
    def name(self) -> str:
        return f"{self.user} / {self.instance} sees {self.visibility.value}"


PII_CASES = [
    # with the PII permission, nothing is ever hidden
    PiiCase("pii_user", "not_pii_instance", Visibility.EVERYTHING),
    PiiCase("pii_user", "whitelist_instance", Visibility.EVERYTHING),
    PiiCase("pii_user", "no_whitelist_instance", Visibility.EVERYTHING),
    # without it, only the forms marked as having PII are filtered
    PiiCase("user", "not_pii_instance", Visibility.EVERYTHING),
    PiiCase("user", "whitelist_instance", Visibility.WHITELISTED_FIELDS),
    PiiCase("user", "no_whitelist_instance", Visibility.TECHNICAL_FIELDS),
]


class BaseInstanceDiffPiiTestCase(APITestCase):
    """Three forms (not marked as having PII, marked with a whitelist, marked without whitelist), each with a
    submission that has two attachments and one logged modification of its answers."""

    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Account")
        source = m.DataSource.objects.create(name="Source")
        version = m.SourceVersion.objects.create(data_source=source, number=1)
        cls.account.default_version = version
        cls.account.save()
        cls.project = m.Project.objects.create(name="Project", app_id="project", account=cls.account)
        source.projects.add(cls.project)
        cls.org_unit = m.OrgUnit.objects.create(name="Clinic", version=version, validation_status="VALID")

        cls.user = cls.create_user_with_profile(
            username="user", account=cls.account, permissions=[CORE_SUBMISSIONS_PERMISSION]
        )
        cls.pii_user = cls.create_user_with_profile(
            username="pii_user",
            account=cls.account,
            permissions=[CORE_SUBMISSIONS_PERMISSION, CORE_SUBMISSIONS_PII_PERMISSION],
        )

        cls.not_pii_form, cls.not_pii_instance = cls.create_form_with_modified_instance("not_pii", None)
        cls.whitelist_form, cls.whitelist_instance = cls.create_form_with_modified_instance("whitelist", WHITELIST)
        cls.no_whitelist_form, cls.no_whitelist_instance = cls.create_form_with_modified_instance("no_whitelist", [])

    @classmethod
    def create_form_with_modified_instance(cls, form_id, non_pii_fields):
        form = m.Form.objects.create(name=form_id, form_id=form_id, non_pii_fields=non_pii_fields)
        form.projects.add(cls.project)
        instance = cls.create_form_instance(
            form=form, project=cls.project, org_unit=cls.org_unit, json=PAST_JSON, created_by=cls.pii_user
        )
        # Attachments are matched to their question by file name, like in the frontend
        m.InstanceFile.objects.create(instance=instance, name="child.jpg", file="instance_files/1_child.jpg")
        m.InstanceFile.objects.create(instance=instance, name="card.jpg", file="instance_files/1_card.jpg")

        original = m.Instance.objects.get(id=instance.id)
        instance.json = NEW_JSON
        instance.save()
        log_modification(original, instance, INSTANCE_API, user=cls.pii_user)
        return form, instance

    @staticmethod
    def json_diff(modification):
        """The operations of the diff on the answers."""
        return [operation for operation in modification["diff"] if operation["path"].startswith("/json")]

    def assertVisibility(self, modification, visibility: Visibility):
        {
            Visibility.EVERYTHING: self.assertSeesEverything,
            Visibility.WHITELISTED_FIELDS: self.assertSeesWhitelistedFieldsOnly,
            Visibility.TECHNICAL_FIELDS: self.assertSeesTechnicalFieldsOnly,
        }[visibility](modification)

    def assertSeesEverything(self, modification):
        self.assertEqual(modification["past_value"][0]["fields"]["json"], PAST_JSON)
        self.assertEqual(modification["new_value"][0]["fields"]["json"], NEW_JSON)
        # the raw XML file holds every answer, it's only kept when nothing is hidden
        self.assertIsNotNone(modification["past_value"][0]["fields"]["file"])
        self.assertIsNotNone(modification["new_value"][0]["fields"]["file"])
        self.assertCountEqual(self.json_diff(modification), FULL_JSON_DIFF)
        self.assertCountEqual(modification["files"].keys(), ["child.jpg", "card.jpg"])

    def assertSeesWhitelistedFieldsOnly(self, modification):
        self.assertEqual(modification["past_value"][0]["fields"]["json"], WHITELISTED_PAST_JSON)
        self.assertEqual(modification["new_value"][0]["fields"]["json"], WHITELISTED_NEW_JSON)
        self.assertIsNone(modification["past_value"][0]["fields"]["file"])
        self.assertIsNone(modification["new_value"][0]["fields"]["file"])
        # changes of hidden questions are not revealed by the diff
        self.assertCountEqual(self.json_diff(modification), WHITELISTED_JSON_DIFF)
        # only the attachment of the whitelisted `photo` question is kept
        self.assertEqual(list(modification["files"].keys()), ["child.jpg"])
        self.assertNoPii(modification)

    def assertSeesTechnicalFieldsOnly(self, modification):
        self.assertEqual(modification["past_value"][0]["fields"]["json"], TECHNICAL_ONLY_JSON)
        self.assertEqual(modification["new_value"][0]["fields"]["json"], TECHNICAL_ONLY_JSON)
        self.assertIsNone(modification["past_value"][0]["fields"]["file"])
        self.assertIsNone(modification["new_value"][0]["fields"]["file"])
        self.assertEqual(self.json_diff(modification), [])
        self.assertEqual(modification["files"], {})
        self.assertNoPii(modification)
        self.assertNotIn("13.1", json.dumps(modification))

    def assertNoPii(self, modification):
        dumped = json.dumps(modification)
        for value in PII_VALUES:
            self.assertNotIn(value, dumped)
