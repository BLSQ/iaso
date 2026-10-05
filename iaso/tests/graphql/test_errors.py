import re

from pathlib import Path

from django.test import SimpleTestCase

from iaso.graphql.schema import schema


GRAPHQL = Path(__file__).parents[2] / "graphql"

#: each mutations module -> the code enum of the errors it returns
CODE_ENUMS = {
    "forms/mutations.py": "FormVersionErrorCode",
    "instances/mutations.py": "SubmissionErrorCode",
    "org_units/mutations.py": "OrgUnitBulkUpdateErrorCode",
}


class ErrorCodesTestCase(SimpleTestCase):
    """A code missing from its mutation's `...ErrorCode` enum would fail the response's serialization."""

    def test_every_code_raised_is_its_enums(self):
        for module, enum in CODE_ENUMS.items():
            with self.subTest(module=module):
                declared = set(schema.get_type(enum).values)
                raised = set(re.findall(r"\.add\(\s*\"([A-Z_]+)\"", (GRAPHQL / module).read_text()))
                self.assertTrue(raised)
                self.assertEqual(raised - declared, set())

    def test_every_mutations_module_is_checked(self):
        modules = {str(path.relative_to(GRAPHQL)) for path in GRAPHQL.rglob("mutations.py")}
        self.assertEqual(modules, set(CODE_ENUMS))
