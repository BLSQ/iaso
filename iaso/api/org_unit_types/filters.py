import django_filters

from django.db.models import Exists, OuterRef

from iaso.api.filters import ScopedModelChoiceFilter
from iaso.models import OrgUnit, OrgUnitType, Project, SourceVersion


def source_versions_of_user_account(request):
    # EXISTS rather than SourceVersion.filter_for_user: no DISTINCT over the join of the data source projects
    account_projects = Project.objects.filter(
        account=request.user.iaso_profile.account, data_sources=OuterRef("data_source_id")
    )
    return SourceVersion.objects.filter(Exists(account_projects))


class OrgUnitTypeDropdownFilter(django_filters.rest_framework.FilterSet):
    # A version of another account (or an unknown id) is rejected with a 400
    source_version_id = ScopedModelChoiceFilter(
        queryset=SourceVersion.objects.none(),
        scope_queryset=source_versions_of_user_account,
        method="filter_source_version_id",
    )

    class Meta:
        model = OrgUnitType
        fields = ["source_version_id"]

    def filter_source_version_id(self, queryset, name, version):
        # EXISTS stops at the first org unit of each type, a JOIN would go through every org unit of the version
        return queryset.filter(Exists(OrgUnit.objects.filter(org_unit_type=OuterRef("pk"), version=version)))
