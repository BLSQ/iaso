"""PII filtering in the entities filters. See `base.py` for the matrix and the expected visibility."""

from rest_framework.exceptions import PermissionDenied

from iaso import models as m
from iaso.api.entities.filters import EntityFilterSet, EntityOrderingFilter, restricted_reference_forms
from iaso.tests.api.entities.pii.base import (
    ANSWERS_A,
    FIELDS_SEARCH_QUESTIONS,
    SEARCH_TOKENS_A,
    SORTABLE_QUESTIONS,
    EntityPiiTestCase,
)


class EntityPiiFiltersTestCase(EntityPiiTestCase):
    def filter_entities(self, scenario, user, data):
        """Entities of the scenario's account matching `data`, through `EntityFilterSet` only."""
        filterset = EntityFilterSet(
            data=data,
            queryset=m.Entity.objects.filter(account=scenario.account),
            request=self.make_request(user),
        )
        return list(filterset.qs)

    def test_restricted_reference_forms(self):
        for scenario, has_perm, user in self.cases():
            with self.subTest(form=scenario.key, pii_permission=has_perm):
                expected = [scenario.form] if self.is_filtered(scenario, has_perm) else []
                self.assertEqual(restricted_reference_forms(user), expected)

    def test_search(self):
        for scenario, has_perm, user in self.cases():
            with self.subTest(form=scenario.key, pii_permission=has_perm):
                for question, token in SEARCH_TOKENS_A.items():
                    expected = [scenario.entity_a] if self.is_visible(question, scenario, has_perm) else []
                    self.assertEqual(self.filter_entities(scenario, user, {"search": token}), expected, question)

    def test_fields_search(self):
        for scenario, has_perm, user in self.cases():
            with self.subTest(form=scenario.key, pii_permission=has_perm):
                for question in FIELDS_SEARCH_QUESTIONS:
                    data = {"fields_search": self.fields_search(scenario, question, ANSWERS_A[question])}
                    if self.can_fields_search(scenario, has_perm):
                        self.assertEqual(self.filter_entities(scenario, user, data), [scenario.entity_a], question)
                    else:
                        with self.assertRaises(PermissionDenied):
                            self.filter_entities(scenario, user, data)

    def test_ordering(self):
        for scenario, has_perm, user in self.cases():
            with self.subTest(form=scenario.key, pii_permission=has_perm):
                for question in SORTABLE_QUESTIONS:
                    request = self.make_request(user, {"order": f"-{question},id"})
                    ordering = EntityOrderingFilter().get_ordering(request, m.Entity.objects.all(), view=None)
                    if self.is_visible(question, scenario, has_perm):
                        self.assertEqual(ordering, [f"-attributes__json__{question}", "id"])
                    else:
                        self.assertEqual(ordering, ["id"])  # model fields are not affected
