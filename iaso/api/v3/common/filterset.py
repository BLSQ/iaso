from typing import FrozenSet

from django import forms
from django_filters import rest_framework as django_filters
from drf_spectacular.plumbing import build_basic_type
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework.exceptions import ValidationError

from .param_validator import build_unsupported_params_error


#: pagination/output params every v3 list endpoint accepts regardless of what it's listing - not FilterSet
#: fields, always accepted on top of a subclass's own `extra_allowed_params`.
CORE_EXTRA_ALLOWED_PARAMS: FrozenSet[str] = frozenset({"order", "format", "page", "page_size", "with_count", "fields"})


class BaseV3FilterSet(django_filters.FilterSet):
    """FilterSet with a "strict mode".

    django-filter silently ignores query params that don't match a declared filter. v3 endpoints instead
    reject them with a 400 and `difflib`-based suggestions, to catch typos (`dateFrom` instead of
    `created_at__gte`) early instead of returning a silently-unfiltered result set.

    Subclasses set `extra_allowed_params` to their own view-level shortcuts that aren't declared filters
    (e.g. `search`); the shared pagination/output params (`CORE_EXTRA_ALLOWED_PARAMS`) are always accepted.
    """

    #: endpoint-specific query params handled outside the FilterSet itself (view-level), still accepted.
    extra_allowed_params: FrozenSet[str] = frozenset()

    def __init__(self, data=None, *args, **kwargs):
        if data is not None:
            self.check_params(data)
        super().__init__(data, *args, **kwargs)

    @classmethod
    def known_params(cls):
        return set(cls.base_filters) | CORE_EXTRA_ALLOWED_PARAMS | cls.extra_allowed_params

    @classmethod
    def check_params(cls, data):
        known = cls.known_params()
        unknown = [key for key in data.keys() if key not in known]
        if unknown:
            raise ValidationError(build_unsupported_params_error(unknown, known))


def document_as(filter_, openapi_type) -> None:
    """Document `filter_` as `openapi_type` in OpenAPI, keeping its `help_text` - drf-spectacular takes the
    description from such a type override rather than from the filter."""
    schema = build_basic_type(openapi_type)
    extend_schema_field({**schema, "description": filter_.extra.get("help_text", "")})(filter_)


class IntegerFilter(django_filters.NumberFilter):
    """`NumberFilter` for integer ids/depths: validated as an integer (`1.5` is a 400) and documented as one
    (drf-spectacular documents a plain `NumberFilter` as a decimal `number`)."""

    field_class = forms.IntegerField

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        document_as(self, OpenApiTypes.INT)
