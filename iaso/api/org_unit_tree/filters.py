import django_filters

from django import forms
from django.db.models.query import QuerySet
from django.utils.translation import gettext_lazy as _

from rest_framework.exceptions import ValidationError

from iaso.models import OrgUnit, DataSource


class OrgUnitTreeFilter(django_filters.rest_framework.FilterSet):
    ignore_empty_names = django_filters.BooleanFilter(method="filter_empty_names", label=_("Ignore empty names"))
    parent_id = django_filters.NumberFilter(field_name="parent_id", label=_("Parent ID"))
    source_id = django_filters.NumberFilter(method="filter_source_id", label=_("Source ID"))
    validation_status = django_filters.MultipleChoiceFilter(
        choices=OrgUnit.VALIDATION_STATUS_CHOICES, label=_("Validation status"), widget=forms.CheckboxSelectMultiple
    )
    search = django_filters.CharFilter(field_name="name", lookup_expr="icontains")

    class Meta:
        model = OrgUnit
        fields = ["version"]

    def filter_empty_names(self, queryset: QuerySet, _, use_empty_names: bool) -> QuerySet:
        return queryset.exclude(name="") if use_empty_names else queryset

    def filter_source_id(self, queryset: QuerySet, _, source_id: int) -> QuerySet:
        try:
            source = DataSource.objects.get(id=source_id)
        except OrgUnit.DoesNotExist:
            raise ValidationError({"source_id": [f"DataSource with id {source_id} does not exist."]})
        if source.default_version:
            return queryset.filter(version=source.default_version)
        return queryset.filter(version__data_source_id=source_id)
