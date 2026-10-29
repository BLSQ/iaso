import django_filters

from django.utils.translation import gettext_lazy as _
from django_filters import ModelChoiceFilter, NumberFilter

from iaso.api.common import NumberInFilter
from iaso.models.team import Team, TeamType


class TeamTreeFilter(django_filters.FilterSet):
    root = ModelChoiceFilter(
        queryset=Team.objects.all(),
    )
    max_depth = NumberFilter(
        min_value=1,
        help_text=_(
            "The maximum depth of the tree to return, counting from the root of the entire hierarchy. Selecting a subtree does not reset the depth."
        ),
    )

    class Meta:
        model = Team
        fields = []

    def filter_queryset(self, queryset):
        return queryset.get_tree(
            root=self.form.cleaned_data.get("root"),
            max_depth=self.form.cleaned_data.get("max_depth"),
        )


class TeamListFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(field_name="name", lookup_expr="icontains", distinct=True)
    managers = NumberInFilter(field_name="manager_id")
    projects = NumberInFilter(field_name="project_id")
    types = django_filters.MultipleChoiceFilter(field_name="type", choices=TeamType.choices)


class TeamDropdownFilter(django_filters.FilterSet):
    ids = NumberInFilter(field_name="id")
    exclude_ids = NumberInFilter(field_name="id", exclude=True)
    projects = NumberInFilter(field_name="project_id")
    types = django_filters.MultipleChoiceFilter(field_name="type", choices=TeamType.choices)
    users = NumberInFilter(field_name="users__id")
