import django_filters

from iaso.models import Scenario


class ScenarioFilter(django_filters.FilterSet):
    entity_type_id = django_filters.NumberFilter(field_name="entity_type_id")
    workflow_version_id = django_filters.NumberFilter(
        field_name="entity_type__workflow__workflow_versions", label="Entity scenarios of this workflow version"
    )
    search = django_filters.CharFilter(field_name="name", lookup_expr="icontains")

    class Meta:
        model = Scenario
        fields = ["kind"]
