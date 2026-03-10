import re

import django_filters

from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from djangorestframework_camel_case.settings import api_settings
from djangorestframework_camel_case.util import camel_to_underscore, camelize_re, underscore_to_camel, underscoreize
from rest_framework.filters import OrderingFilter

from iaso.models import Profile


def get_users_for_user(user):
    return get_user_model().objects.filter(iaso_profile__in=Profile.objects.filter(account=user.iaso_profile.account))


class ScopedModelChoiceFilter(django_filters.ModelChoiceFilter):
    """
    ModelChoiceFilter that dynamically scopes its queryset using the request.
    """

    def __init__(self, *args, **kwargs):
        self.scope_queryset = kwargs.pop("scope_queryset", None)
        super().__init__(*args, **kwargs)

    def get_queryset(self, request):
        if self.scope_queryset and request is not None and request.user.is_authenticated:
            return self.scope_queryset(request)
        return super().get_queryset(request)

    @property
    def field(self):
        field = super().field
        if self.parent and hasattr(self.parent, "request"):
            qs = self.get_queryset(self.parent.request)
            if qs is not None:
                field.queryset = qs
        return field


class CamelCaseOrderingFilter(OrderingFilter):
    def get_ordering(self, request, queryset, view):
        ordering = super().get_ordering(request, queryset, view)

        if ordering is None:
            return None

        return [camel_to_underscore(field, **api_settings.JSON_UNDERSCOREIZE) for field in ordering]

    def get_valid_fields(self, queryset, view, context=None):
        if context is None:
            context = {}
        fields = super().get_valid_fields(queryset, view, context=context)

        return [(re.sub(camelize_re, underscore_to_camel, f[0]), f[1]) for f in fields]


class CamelCaseDjangoFilterBackend(DjangoFilterBackend):
    def parse_query_params(self, query_params):
        return underscoreize(query_params)

    def get_filterset_kwargs(self, request, queryset, view):
        return {
            "data": self.parse_query_params(request.query_params),
            "queryset": queryset,
            "request": request,
        }
