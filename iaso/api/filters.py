import django_filters

from django.contrib.auth import get_user_model

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
