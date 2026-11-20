"""Shared setup of the PII filtering tests on the entities API (`/api/entities/`).

Every check runs on the full matrix of:

- the user having the `iaso_submissions_pii` permission or not;
- the reference form of the entity type not being marked as having PII (`non_pii_fields=None`), being marked with
  no whitelisted question (`non_pii_fields=[]`), or being marked with some whitelisted questions.

A question must be visible (in payloads, columns, exports, search, filters and ordering) if and only if the user has
the PII permission, the form is not marked, or the question is whitelisted (see `is_visible`), except for
`fields_search`, which is stricter (see `can_fields_search`).

Each form configuration lives in its own account: the filters look at all the restricted reference forms of the
user's account, so mixing configurations in one account would make the cases depend on each other.
"""

import json

from types import SimpleNamespace

from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from iaso import models as m
from iaso.permissions.core_permissions import CORE_ENTITIES_PERMISSION, CORE_SUBMISSIONS_PII_PERMISSION
from iaso.test import APITestCase


NOT_MARKED = "not_marked"
MARKED_NO_WHITELIST = "marked_no_whitelist"
MARKED_WITH_WHITELIST = "marked_with_whitelist"

FORM_CONFIGS = {
    NOT_MARKED: None,
    MARKED_NO_WHITELIST: [],
    MARKED_WITH_WHITELIST: ["muac", "district"],
}

POSSIBLE_FIELDS = [
    {"name": "name", "label": "Name", "type": "text"},
    {"name": "phone", "label": "Phone", "type": "text"},
    {"name": "muac", "label": "MUAC", "type": "decimal"},
    {"name": "district", "label": "District", "type": "text"},
]
QUESTIONS = [field["name"] for field in POSSIBLE_FIELDS]
LABELS = {field["name"]: field["label"] for field in POSSIBLE_FIELDS}

# Values are distinct enough to be searched for without matching anything else. Entity A is created first, entity B
# second, and B sorts before A on every question, so that a sort can be told apart from the default order.
ANSWERS_A = {"name": "Amina Diallo", "phone": "770000001", "muac": "12.5", "district": "Northdistrict"}
ANSWERS_B = {"name": "Aaron Ba", "phone": "110000009", "muac": "11.0", "district": "Middistrict"}
# A single, unambiguous search token per question for entity A
SEARCH_TOKENS_A = {"name": "Amina", "phone": "770000001", "district": "Northdistrict"}
# `name` is left out: it is also a model field of Entity, so `order=name` sorts on it and never reads the answers
SORTABLE_QUESTIONS = ("phone", "muac", "district")
# `name` is left out: the list always has a `name` key (see `EntityListSerializer.get_name`)
COLUMN_QUESTIONS = ("phone", "muac", "district")
FIELDS_SEARCH_QUESTIONS = ("phone", "district")


class EntityPiiTestCase(APITestCase):
    """Base class of the entities PII tests: the scenarios of the matrix and the rules they are checked against."""

    @classmethod
    def setUpTestData(cls):
        source = m.DataSource.objects.create(name="Source")
        cls.version = m.SourceVersion.objects.create(data_source=source, number=1)
        cls.org_unit = m.OrgUnit.objects.create(name="Clinic", version=cls.version, validation_status="VALID")
        cls.scenarios = {key: cls.create_scenario(key, non_pii_fields) for key, non_pii_fields in FORM_CONFIGS.items()}

    @classmethod
    def create_scenario(cls, key, non_pii_fields):
        account = m.Account.objects.create(name=f"Account {key}", default_version=cls.version)
        project = m.Project.objects.create(name=f"Project {key}", app_id=f"app.{key}", account=account)
        form = m.Form.objects.create(
            name=f"Child {key}",
            form_id=f"child_{key}",
            non_pii_fields=non_pii_fields,
            possible_fields=POSSIBLE_FIELDS,
        )
        form.projects.add(project)
        m.FormVersion.objects.create(form=form, version_id="1", form_descriptor={})
        entity_type = m.EntityType.objects.create(
            name=f"Child {key}", account=account, reference_form=form, fields_list_view=QUESTIONS
        )
        return SimpleNamespace(
            key=key,
            non_pii_fields=non_pii_fields,
            account=account,
            form=form,
            entity_type=entity_type,
            entity_a=cls.create_entity(entity_type, project, ANSWERS_A, "Entity A"),
            entity_b=cls.create_entity(entity_type, project, ANSWERS_B, "Entity B"),
            users={
                False: cls.create_user_with_profile(
                    username=f"user_{key}", account=account, permissions=[CORE_ENTITIES_PERMISSION]
                ),
                True: cls.create_user_with_profile(
                    username=f"pii_user_{key}",
                    account=account,
                    permissions=[CORE_ENTITIES_PERMISSION, CORE_SUBMISSIONS_PII_PERMISSION],
                ),
            },
        )

    @classmethod
    def create_entity(cls, entity_type, project, answers, name):
        # The entity name (a model field, also searched) never contains an answer
        entity = m.Entity.objects.create(name=name, entity_type=entity_type, account=entity_type.account)
        instance = cls.create_form_instance(
            form=entity_type.reference_form,
            project=project,
            org_unit=cls.org_unit,
            entity=entity,
            json={**answers, "_version": "1"},
        )
        entity.attributes = instance
        entity.save()
        return entity

    # -- matrix and expected visibility ---------------------------------------------------------------------------

    def cases(self):
        """Every (scenario, has_pii_permission, user) combination."""
        return [
            (scenario, has_perm, scenario.users[has_perm])
            for scenario in self.scenarios.values()
            for has_perm in (False, True)
        ]

    @staticmethod
    def is_filtered(scenario, has_perm):
        return not has_perm and scenario.non_pii_fields is not None

    @classmethod
    def is_visible(cls, question, scenario, has_perm):
        return not cls.is_filtered(scenario, has_perm) or question in scenario.non_pii_fields

    @classmethod
    def can_fields_search(cls, scenario, has_perm):
        """Whether a `fields_search` on a question of this form is accepted.

        Stricter than `is_visible`: the form selector of the query (`{"var": "<form_id>"}`) is checked like a
        question, and is never whitelisted. Users without the PII permission can't use `fields_search` at all on a
        form marked as having PII, even on whitelisted questions.
        """
        return not cls.is_filtered(scenario, has_perm)

    # -- shared helpers -------------------------------------------------------------------------------------------

    @staticmethod
    def make_request(user, params=None):
        request = Request(APIRequestFactory().get("/api/entities/", params or {}))
        request.user = user
        return request

    @staticmethod
    def fields_search(scenario, question, value):
        """JsonLogic as sent by the entities filters of the web interface."""
        return json.dumps({"and": [{"some": [{"var": scenario.form.form_id}, {"==": [{"var": question}, value]}]}]})

    def assert_answers(self, file_content, scenario, has_perm):
        """Check the answers of entity A, as returned in its attributes."""
        self.assertEqual(file_content["_version"], "1")  # technical keys are always kept
        for question, value in ANSWERS_A.items():
            if self.is_visible(question, scenario, has_perm):
                self.assertEqual(file_content.get(question), value, question)
            else:
                self.assertNotIn(question, file_content)
