"""Refusals as data: a mutation that can be refused returns `{<result>, errors: [InputError!]!}`
(`common.graphql`) - every problem found in its input, each with a code, where it is in the input and a message, as
a form shows all its invalid fields at once; nothing is saved when there is any. Top-level GraphQL errors remain for what isn't about the
input: authentication, permissions, timeouts, malformed operations."""

from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Sequence, Union

from ariadne import InterfaceType
from django.db import transaction


#: where in the mutation's input: the argument, then the input fields and list indexes (`["answers", 2, "value"]`)
Field = Sequence[Union[str, int]]


class Refused(Exception):
    """All the problems of an input (`InputError` dicts): `payload()` returns them as the mutation's `errors`, with
    the payload's other fields in `extra` (`warnings`...)."""

    def __init__(self, errors: List[Dict[str, Any]], **extra):
        super().__init__("; ".join(error["message"] for error in errors))
        self.errors = errors
        self.extra = extra


class Payload(dict):
    """A resolver's return with the payload's other fields: `Payload(form_version=..., warnings=[...])`."""


class Errors:
    """Collects the problems of an input, to report them all at once."""

    def __init__(self):
        self.errors: List[Dict[str, Any]] = []

    def add(self, code: str, message: str, field: Field = (), question: Optional[str] = None) -> None:
        """`code`: a value of the mutation's `...ErrorCode` enum. `question`: the form question at fault (an answer's, an
        XLSForm's)."""
        self.errors.append(
            {"code": code, "message": message, "field": [str(part) for part in field], "question": question}
        )

    def __bool__(self) -> bool:
        return bool(self.errors)

    def raise_if_any(self, **extra) -> None:
        """`extra`: the payload's other fields, returned along with the errors."""
        if self.errors:
            raise Refused(self.errors, **extra)


def payload(result: str) -> Callable:
    """The mutation resolver's return as `{result: ..., "errors": []}` (a `Payload`: its fields along), run in its own
    savepoint; `{result: None, "errors": [...]}` when it raises `Refused`, its writes undone. The next mutations of
    the operation still run. `result`: the payload field's snake_case name (`form_version` for `formVersion`), the key
    it reads."""

    def decorate(resolver: Callable) -> Callable:
        @wraps(resolver)
        def wrapper(*args, **kwargs):
            try:
                with transaction.atomic():
                    value = resolver(*args, **kwargs)
            except Refused as refused:
                return {result: None, "errors": refused.errors, **refused.extra}
            if isinstance(value, Payload):
                return {"errors": [], **value}
            return {result: value, "errors": []}

        return wrapper

    return decorate


#: the `InputError` interface, as `Task.errors` returns it: of the concrete type the errors are stored with (`type`,
#: see `org_units.mutations.refuse()`) - the payloads' `errors` have their own type already
input_error = InterfaceType("InputError")


@input_error.type_resolver
def resolve_input_error_type(error, *_):
    return error["type"]
