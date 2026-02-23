import django_filters

from iaso.models import Profile


class ProfileListFilter(django_filters.rest_framework.FilterSet):
    ids = django_filters.BaseInFilter(field_name="user__id", lookup_expr="in")
    teams = django_filters.BaseInFilter(field_name="user__teams__id", lookup_expr="in")
    user_roles = django_filters.BaseInFilter(field_name="user__iaso_profile__user_roles__pk", lookup_expr="in")
    projects = django_filters.BaseInFilter(field_name="user__iaso_profile__projects__pk", lookup_expr="in")
    permissions = django_filters.BaseInFilter(field_name="user__user_permissions__codename", lookup_expr="in")
    org_unit_type = django_filters.CharFilter(method="filter_org_unit_type")

    class Meta:
        model = Profile
        fields = []

    def filter_org_unit_type(self, queryset, name, value):
        if value == "unassigned":
            return queryset.filter(user__iaso_profile__org_units__org_unit_type__isnull=True).distinct()
        try:
            value = int(value)
        except ValueError:
            return queryset.none()
        return queryset.filter(user__iaso_profile__org_units__org_unit_type__pk=value).distinct()
