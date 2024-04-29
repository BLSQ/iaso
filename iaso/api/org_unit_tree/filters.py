import django_filters
from django.db.models.query import QuerySet
from django.utils.translation import gettext_lazy as _

from rest_framework.exceptions import ValidationError

from iaso.models import OrgUnit, DataSource


class OrgUnitTreeFilter(django_filters.rest_framework.FilterSet):
    default_version = django_filters.BooleanFilter(method="filter_default_version", label=_("Default version"))
    ignore_empty_names = django_filters.BooleanFilter(method="filter_empty_names", label=_("Ignore empty names"))
    parent_id = django_filters.NumberFilter(method="filter_parent_id", label=_("Parent ID"))
    roots_for_user = django_filters.BooleanFilter(method="filter_roots_for_user", label=_("Roots for user"))
    source_id = django_filters.NumberFilter(method="filter_source_id", label=_("Source ID"))
    validation_status = django_filters.ChoiceFilter(
        method="filter_validation_status", label=_("Validation status"), choices=OrgUnit.VALIDATION_STATUS_CHOICES
    )

    class Meta:
        model = OrgUnit
        fields = ["version"]

    def filter_default_version(self, queryset: QuerySet, _, use_default_version: bool) -> QuerySet:
        user = self.request.user
        if user.is_anonymous or not use_default_version:
            return queryset
        return queryset.filter(version=user.iaso_profile.account.default_version)

    def filter_empty_names(self, queryset: QuerySet, _, use_empty_names: bool) -> QuerySet:
        return queryset.exclude(name="") if use_empty_names else queryset

    def filter_parent_id(self, queryset: QuerySet, _, parent_id: int) -> QuerySet:
        try:
            parent = OrgUnit.objects.get(id=parent_id)
        except OrgUnit.DoesNotExist:
            raise ValidationError({"parent_id": [f"OrgUnit with id {parent_id} does not exist."]})
        return queryset.filter(parent=parent.pk)

    def filter_roots_for_user(self, queryset: QuerySet, _, use_roots_for_user: bool) -> QuerySet:
        user = self.request.user
        if user.is_anonymous or not use_roots_for_user:
            return queryset
        org_unit_ids_for_profile = user.iaso_profile.org_units.only("id")
        if org_unit_ids_for_profile and not user.is_superuser:
            return queryset.filter(id__in=org_unit_ids_for_profile)
        return queryset.filter(parent__isnull=True)

    def filter_source_id(self, queryset: QuerySet, _, source_id: int) -> QuerySet:
        try:
            source = DataSource.objects.get(id=source_id)
        except OrgUnit.DoesNotExist:
            raise ValidationError({"source_id": [f"DataSource with id {source_id} does not exist."]})
        if source.default_version:
            return queryset.filter(version=source.default_version)
        return queryset.filter(version__data_source_id=source_id)

    def filter_validation_status(self, queryset: QuerySet, _, validation_status: str) -> QuerySet:
        if validation_status == OrgUnit.VALIDATION_VALID:
            # Fetch children of `REJECTED` org units which are not themselves `REJECTED`.
            children_of_rejected_org_units_sql = """
WITH RECURSIVE rejected AS (
    SELECT id, validation_status
    FROM iaso_orgunit
    WHERE validation_status = 'REJECTED'
    UNION
    SELECT descendant.id, descendant.validation_status
    FROM iaso_orgunit as descendant, rejected
    WHERE descendant.parent_id = rejected.id
)
SELECT 1 as id, array_agg(id) as ids
FROM rejected
WHERE validation_status != 'REJECTED';"""
            ids_to_exclude = OrgUnit.objects.raw(children_of_rejected_org_units_sql)[0].ids
            queryset = queryset.exclude(id__in=ids_to_exclude)

        return queryset.filter(validation_status=validation_status)
