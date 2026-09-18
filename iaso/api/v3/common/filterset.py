from typing import FrozenSet

from django_filters import rest_framework as django_filters
from rest_framework.exceptions import ValidationError

from .param_validator import build_unsupported_params_error


#: pagination/output params every v3 list endpoint accepts regardless of what it's listing - not FilterSet
#: fields, so each subclass's `extra_allowed_params` needs to include these on top of its own shortcuts
#: (e.g. `search`, `default_version`). Checked for every v3 FilterSet by
#: `iaso/tests/api/v3/test_filter_nomenclature.py`, so a new endpoint that forgets one of these fails fast.
CORE_EXTRA_ALLOWED_PARAMS: FrozenSet[str] = frozenset({"order", "format", "page", "page_size", "with_count", "fields"})


class BaseV3FilterSet(django_filters.FilterSet):
    """FilterSet with a "strict mode".

    django-filter silently ignores query params that don't match a declared filter. v3 endpoints instead
    reject them with a 400 and `difflib`-based suggestions, to catch typos (`dateFrom` instead of
    `created_at__gte`) early instead of returning a silently-unfiltered result set.

    Subclasses should set `extra_allowed_params` to the view-level shortcut/output params that are valid
    but aren't declared filters (e.g. `search`, `order`, `page`, `page_size`, `fields`, ...).
    """

    #: shortcut/output query params handled outside the FilterSet itself (view-level), still accepted.
    extra_allowed_params: FrozenSet[str] = frozenset()

    def __init__(self, data=None, *args, **kwargs):
        if data is not None:
            self.check_params(data)
        super().__init__(data, *args, **kwargs)

    @classmethod
    def known_params(cls):
        return set(cls.base_filters.keys()) | set(cls.extra_allowed_params)

    @classmethod
    def check_params(cls, data):
        known = cls.known_params()
        unknown = [key for key in data.keys() if key not in known]
        if unknown:
            raise ValidationError(build_unsupported_params_error(unknown, known))
