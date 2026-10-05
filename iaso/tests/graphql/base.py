"""What the GraphQL tests share: requests to `/api/graphql/`, any root field queried with its arguments declared as the
schema types them, and the queries counted (`profiled`)."""

import typing

from iaso.graphql.schema import schema
from iaso.test import APITestCase
from iaso.tests.graphql.profiling import profiled


URL = "/api/graphql/"


class GraphQLTestCase(APITestCase):
    """`/api/graphql/` as the client's authenticated user. The list helpers take the root field (`"orgUnits"`) and its
    arguments as keyword arguments - `filters={...}`, `order=[...]`, `limit=5` -, each sent as a variable."""

    profiled = staticmethod(profiled)

    def execute(self, query: str, variables: typing.Optional[dict] = None, **extra) -> dict:
        """The response's body: an operation's result or its errors (200 or 400), never a crash."""
        response = self.client.post(URL, {"query": query, "variables": variables or {}}, format="json", **extra)
        self.assertIn(response.status_code, (200, 400), response.content)
        return response.json()

    def data(self, query: str, variables: typing.Optional[dict] = None, **extra) -> dict:
        """The result, after checking there is no error."""
        body = self.execute(query, variables, **extra)
        self.assertNotIn("errors", body, body.get("errors"))
        return body["data"]

    def error(self, query: str, variables: typing.Optional[dict] = None, code: typing.Optional[str] = None) -> str:
        """The first error's message; with `code`, after checking its `extensions.code`."""
        body = self.execute(query, variables)
        self.assertIn("errors", body)
        error = body["errors"][0]
        if code is not None:
            self.assertEqual((error.get("extensions") or {}).get("code"), code, error)
        return error["message"]

    def operation(self, field: str, selection: str = "", **arguments) -> str:
        """`query`/`mutation` `field(arguments) { selection }`, each argument a variable typed as the schema declares
        it - `orgUnits(filters: $filters)` declares `$filters: OrgUnitFilter`."""
        kind, root = (
            ("query", schema.query_type) if field in schema.query_type.fields else ("mutation", schema.mutation_type)
        )
        declared = root.fields[field].args
        signature = ", ".join(f"${name}: {declared[name].type}" for name in arguments)
        call = ", ".join(f"{name}: ${name}" for name in arguments)
        return (
            f"{kind}{f' ({signature})' if signature else ''} "
            f"{{ {field}{f'({call})' if call else ''}{f' {{ {selection} }}' if selection else ''} }}"
        )

    def query(self, field: str, selection: str = "", **arguments) -> typing.Any:
        """`field`'s result, after checking there is no error."""
        return self.data(self.operation(field, selection, **arguments), arguments)[field]

    def query_error(self, field: str, selection: str = "id", code: typing.Optional[str] = None, **arguments) -> str:
        """The first error's message for `field(arguments)`, `code` checked as in `error()`."""
        return self.error(self.operation(field, selection, **arguments), arguments, code)

    def page(self, field: str, selection: str = "items { id }", **arguments) -> dict:
        """A `...Page` of the list `field`."""
        return self.query(field, selection, **arguments)

    def items(self, field: str, selection: str = "id", **arguments) -> list:
        return self.page(field, f"items {{ {selection} }}", **arguments)["items"]

    def ids(self, field: str, **arguments) -> list:
        return [row["id"] for row in self.items(field, "id", **arguments)]

    def row(self, field: str, id: int, selection: str) -> typing.Optional[dict]:
        """One object by id (`orgUnit(id:)`): `None` if not visible."""
        return self.query(field, selection, id=id)
