"""Cross-endpoint "same nomenclature" contract for every `/api/v3/` FilterSet/ViewSet.

Pure introspection (no DB, no HTTP, no fixtures) - `SimpleTestCase` so it stays a fast unit test, not an
integration test, and CI runs it on every push. It auto-discovers every `BaseV3FilterSet` subclass (and its
owning ViewSet, via `filterset_class`) by walking the `iaso.api.v3` package, so a brand new v3 endpoint is
covered automatically the moment it's added - no per-endpoint registration to remember.

What's deliberately NOT enforced here: a strict 1:1 mapping between a filter's `lookup_expr` and its name
suffix. The existing convention already has sensible, human-named exceptions to that (`depth` for
`path__depth`, `ancestor_id__direct_children` as a friendly alias for a plain `parent_id` equality, `has_shape`/
`has_location` as method-based shortcuts) - a rigid mechanical rule there would fight the very
readability it's supposed to protect, so it's left to code review. What *is* enforced below are the parts
that are genuinely objective: casing, the shared shortcut-param core, doc/filter drift, and class naming.
"""

import importlib
import pkgutil
import re

from django.test import SimpleTestCase

import iaso.api.v3

from iaso.api.v3.common.filterset import CORE_EXTRA_ALLOWED_PARAMS, BaseV3FilterSet


SNAKE_CASE = re.compile(r"^[a-z][a-z0-9_]*$")


def _iter_v3_modules():
    """Every module under `iaso.api.v3`, imported so their classes are registered on their module objects."""
    package = iaso.api.v3
    yield package
    for _, module_name, _ in pkgutil.walk_packages(package.__path__, package.__name__ + "."):
        yield importlib.import_module(module_name)


def _discover_filtersets():
    seen = set()
    filtersets = []
    for module in _iter_v3_modules():
        for value in vars(module).values():
            if (
                isinstance(value, type)
                and issubclass(value, BaseV3FilterSet)
                and value is not BaseV3FilterSet
                and value not in seen
            ):
                seen.add(value)
                filtersets.append(value)
    return filtersets


def _discover_viewsets():
    """Every class under `iaso.api.v3` whose `filterset_class` is one of our v3 FilterSets."""
    seen = set()
    viewsets = []
    for module in _iter_v3_modules():
        for value in vars(module).values():
            if (
                isinstance(value, type)
                and value not in seen
                and isinstance(getattr(value, "filterset_class", None), type)
                and issubclass(value.filterset_class, BaseV3FilterSet)
            ):
                seen.add(value)
                viewsets.append(value)
    return viewsets


class V3FilterNomenclatureTestCase(SimpleTestCase):
    def test_at_least_one_v3_filterset_is_discovered(self):
        # guards against the discovery helpers above silently finding nothing (e.g. a renamed package)
        # and every other test in this file passing vacuously.
        self.assertTrue(_discover_filtersets(), "no BaseV3FilterSet subclass found under iaso.api.v3")
        self.assertTrue(_discover_viewsets(), "no ViewSet with a v3 filterset_class found under iaso.api.v3")

    def test_filterset_class_names_follow_the_v3_convention(self):
        for filterset_class in _discover_filtersets():
            with self.subTest(filterset=filterset_class.__name__):
                self.assertTrue(
                    filterset_class.__name__.endswith("FilterSetV3"),
                    f"{filterset_class.__name__}: v3 FilterSet classes should be named '<Model>FilterSetV3'",
                )

    def test_filter_param_names_are_snake_case(self):
        for filterset_class in _discover_filtersets():
            for name in filterset_class.base_filters:
                with self.subTest(filterset=filterset_class.__name__, param=name):
                    self.assertRegex(
                        name,
                        SNAKE_CASE,
                        f"{filterset_class.__name__}.{name}: v3 filter params must be snake_case",
                    )

    def test_extra_allowed_params_include_the_shared_core(self):
        for filterset_class in _discover_filtersets():
            with self.subTest(filterset=filterset_class.__name__):
                self.assertIsInstance(
                    filterset_class.extra_allowed_params,
                    frozenset,
                    f"{filterset_class.__name__}.extra_allowed_params should be a frozenset",
                )
                missing = CORE_EXTRA_ALLOWED_PARAMS - filterset_class.extra_allowed_params
                self.assertFalse(
                    missing,
                    f"{filterset_class.__name__}.extra_allowed_params is missing the shared v3 params {missing}",
                )

    def test_every_filter_is_documented_and_vice_versa(self):
        for viewset_class in _discover_viewsets():
            with self.subTest(viewset=viewset_class.__name__):
                documented_parameters = getattr(viewset_class, "documented_parameters", None)
                self.assertIsNotNone(
                    documented_parameters,
                    f"{viewset_class.__name__} needs a `documented_parameters` class attribute (the same "
                    "OpenApiParameter list passed to @extend_schema) so this test can check it against its "
                    "filterset_class.",
                )
                documented_names = {parameter.name for parameter in documented_parameters}
                filterset_class = viewset_class.filterset_class
                filter_names = set(filterset_class.base_filters)
                known_names = filter_names | filterset_class.extra_allowed_params

                undocumented = filter_names - documented_names
                self.assertFalse(
                    undocumented,
                    f"{viewset_class.__name__}: filter(s) {undocumented} have no matching OpenApiParameter "
                    f"in {viewset_class.__name__}.documented_parameters",
                )
                orphaned = documented_names - known_names
                self.assertFalse(
                    orphaned,
                    f"{viewset_class.__name__}: documented param(s) {orphaned} match neither a filter nor "
                    f"an extra_allowed_params entry - stale docs, or a filterset field that got renamed/removed",
                )
