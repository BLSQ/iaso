import django_filters
from dateutil.relativedelta import relativedelta

from django.db.models import QuerySet
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.db import models
from iaso.models import OrgUnit, SourceVersion, GroupSet


def source_versions(request) -> QuerySet[OrgUnit]:
    if request is None:
        return SourceVersion.objects.none()
    profile = request.user.iaso_profile if not request.user.is_anonymous else None
    return SourceVersion.objects.filter(data_source__projects__account=profile.account)


class Bools(models.TextChoices):
    true = "true", "True"
    false = "false", "False"


class GroupSetFilter(django_filters.rest_framework.FilterSet):
    search = django_filters.CharFilter(field_name="name", lookup_expr="icontains", label=_("Search by groupset's name"))

    version = django_filters.ModelMultipleChoiceFilter(
        field_name="source_version", queryset=source_versions, label=_("SourceVersion id")
    )
    default_version = django_filters.ChoiceFilter(
        choices=Bools.choices, method="filter_default_version", label=_("Limit to default version source")
    )

    class Meta:
        model = GroupSet
        fields = ["search", "version", "default_version"]

    def filter_default_version(self, queryset: QuerySet, _, value: str) -> QuerySet:
        if value and value.lower() in ["1", "true"]:
            default_version = value
            if default_version == "true":
                queryset = queryset.filter(source_version=self.request.user.iaso_profile.account.default_version)

        return queryset