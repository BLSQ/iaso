import django_filters

from django import forms
from django.db.models.query import QuerySet
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import ValidationError

from iaso.models import DataSource, OrgUnit


class OrgUnitTreeFilter(django_filters.rest_framework.FilterSet):
    ignore_empty_names = django_filters.BooleanFilter(method="filter_empty_names", label=_("Ignore empty names"))
    parent_id = django_filters.NumberFilter(field_name="parent_id", label=_("Parent ID"))
    data_source_id = django_filters.NumberFilter(method="filter_data_source_id", label=_("Data source ID"))
    validation_status = django_filters.MultipleChoiceFilter(
        choices=OrgUnit.VALIDATION_STATUS_CHOICES, label=_("Validation status"), widget=forms.CheckboxSelectMultiple
    )
    search = django_filters.CharFilter(field_name="name", lookup_expr="icontains")

    class Meta:
        model = OrgUnit
        fields = ["version"]

    @property
    def qs(self):
        queryset = super().qs

        user = getattr(self.request, "user", None)

        data_source_id = self.form.cleaned_data.get("data_source_id")
        version = self.form.cleaned_data.get("version")

        if not (data_source_id or version) and user.is_anonymous:
            raise ValidationError({"data_source_id": ["A `data_source_id` must be provided for anonymous users."]})

        if not (data_source_id or version):
            queryset = queryset.filter(version_id=user.iaso_profile.account.default_version_id)

        return queryset

    def filter_empty_names(self, queryset: QuerySet, _, use_empty_names: bool) -> QuerySet:
        return queryset.exclude(name="") if use_empty_names else queryset

    def filter_data_source_id(self, queryset: QuerySet, _, data_source_id: int) -> QuerySet:
        try:
            source = DataSource.objects.get(id=data_source_id)
        except OrgUnit.DoesNotExist:
            raise ValidationError({"data_source_id": [f"DataSource with id {data_source_id} does not exist."]})

        version = self.form.cleaned_data.get("version")
        if source.default_version and not version:
            return queryset.filter(version=source.default_version)

        return queryset.filter(version__data_source_id=data_source_id)
