import copy

import django_filters

from django.utils.datastructures import MultiValueDict
from rest_framework.filters import OrderingFilter


class ModuleFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(field_name="name", method="filter_search")
    exclude = django_filters.CharFilter(field_name="codename", method="filter_exclude")

    def __init__(self, data=None, queryset=None, *, request=None, prefix=None):
        self.is_bound = data is not None
        self.data = data or MultiValueDict()
        self.queryset = queryset
        self.request = request
        self.form_prefix = prefix

        self.filters = copy.deepcopy(self.base_filters)

        # propagate the model and filterset to the filters
        for filter_ in self.filters.values():
            filter_.parent = self

    @property
    def qs(self):
        if not hasattr(self, "_qs"):
            qs = self.queryset
            if self.is_bound:
                # ensure form validation before filtering
                self.errors
                qs = self.filter_queryset(qs)
            self._qs = qs
        return self._qs

    def filter_queryset(self, queryset):
        """
        Filter the queryset with the underlying form's `cleaned_data`. You must
        call `is_valid()` or `errors` before calling this method.

        This method should be overridden if additional filtering needs to be
        applied to the queryset before it is cached.
        """
        for name, value in self.form.cleaned_data.items():
            queryset = self.filters[name].filter(queryset, value)
        return queryset

    def filter_search(self, queryset, name, value):
        if value:
            queryset = [module for module in queryset if value.lower() in module.name.lower()]
        return queryset

    def filter_exclude(self, queryset, name, value):
        if value:
            queryset = [module for module in queryset if value.lower() not in module.codename.lower()]
        return queryset


class ModuleOrderingFilter(OrderingFilter):
    def filter_queryset(self, request, queryset: list, view):
        ordering = self.get_ordering(request, queryset, view)

        if ordering:
            for field in reversed(ordering):
                reverse = field.startswith("-")
                field = field.lstrip("-")
                queryset.sort(key=lambda obj, f=field: getattr(obj, f), reverse=reverse)

        return queryset
