from typing import Any, Protocol


class AdminAttributes(Protocol):
    """Workaround to avoid mypy errors, see https://github.com/python/mypy/issues/2087#issuecomment-462726600"""

    short_description: str
    admin_order_field: str


def admin_attr_decorator(func: Any) -> AdminAttributes:
    return func
