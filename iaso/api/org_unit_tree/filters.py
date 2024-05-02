import django_filters
from django.db.models.query import QuerySet
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _

from rest_framework.exceptions import ValidationError

from iaso.models import OrgUnit, DataSource


class OrgUnitTreeFilter(django_filters.rest_framework.FilterSet):
    default_version = django_filters.BooleanFilter(method="filter_default_version", label=_("Default version"))
    ignore_empty_names = django_filters.BooleanFilter(method="filter_empty_names", label=_("Ignore empty names"))
    parent_id = django_filters.NumberFilter(method="filter_parent_id", label=_("Parent ID"))
    source_id = django_filters.NumberFilter(method="filter_source_id", label=_("Source ID"))
    validation_status = django_filters.ChoiceFilter(
        method="filter_validation_status", label=_("Validation status"), choices=OrgUnit.VALIDATION_STATUS_CHOICES
    )

    class Meta:
        model = OrgUnit
        fields = ["version"]

    @property
    def qs(self):
        parent_qs = super().qs
        # If `parent_id` is not provided, return the tree's first level.
        parent_id = self.form.cleaned_data["parent_id"]
        if not parent_id:
            return parent_qs.filter(parent__isnull=True)
        return parent_qs

    def filter_default_version(self, queryset: QuerySet, _, use_default_version: bool) -> QuerySet:
        user = self.request.user
        if not use_default_version or user.is_anonymous:
            return queryset
        return queryset.filter(version=user.iaso_profile.account.default_version)

    def filter_empty_names(self, queryset: QuerySet, _, use_empty_names: bool) -> QuerySet:
        return queryset.exclude(name="") if use_empty_names else queryset

    def filter_parent_id(self, queryset: QuerySet, _, parent_id: str) -> QuerySet:
        return queryset.filter(parent=parent_id)

    def filter_source_id(self, queryset: QuerySet, _, source_id: int) -> QuerySet:
        try:
            source = DataSource.objects.get(id=source_id)
        except OrgUnit.DoesNotExist:
            raise ValidationError({"source_id": [f"DataSource with id {source_id} does not exist."]})
        if source.default_version:
            return queryset.filter(version=source.default_version)
        return queryset.filter(version__data_source_id=source_id)

    def filter_validation_status(self, queryset: QuerySet, _, validation_status: str) -> QuerySet:
        """
        If we filter on VALID or NEW, the children of a REJECTED org unit should not be returned.
        """
        parent_id = self.form.cleaned_data["parent_id"]
        if parent_id and validation_status in [OrgUnit.VALIDATION_NEW, OrgUnit.VALIDATION_VALID]:
            try:
                # Get parent's top ancestor.
                top_ancestor = OrgUnit.objects.raw(
                    (
                        "SELECT id, path FROM iaso_orgunit "
                        "WHERE path = SUBPATH((SELECT path FROM iaso_orgunit WHERE id = %s), 0, 1)"
                    ),
                    [parent_id],
                )[0]
            except IndexError:
                raise ValidationError({"parent_id": [f"OrgUnit with id {parent_id} does not exist."]})

            # Find the children of `REJECTED` org units which are not `REJECTED` themselves.
            rejected_children = OrgUnit.objects.raw(
                """
                WITH RECURSIVE rejected AS (
                    SELECT id, validation_status
                    FROM iaso_orgunit
                    WHERE path <@ %s  -- Limit to all descendants of the top_ancestor node (including self).
                    AND validation_status = 'REJECTED'
                    UNION
                    SELECT descendant.id, descendant.validation_status
                    FROM iaso_orgunit as descendant, rejected
                    WHERE descendant.parent_id = rejected.id
                )
                SELECT 1 as id, array_agg(id) as ids
                FROM rejected
                WHERE validation_status != 'REJECTED';
                """,
                [str(top_ancestor.path)],
            )[0]

            if rejected_children.ids:
                queryset = queryset.exclude(id__in=rejected_children.ids)

        return queryset.filter(validation_status=validation_status)


class OrgUnitTreeSearchFilter(django_filters.rest_framework.FilterSet):
    class Meta:
        model = OrgUnit
        fields = ["name"]

    @property
    def qs(self):
        parent_qs = super().qs

        # Find the children of `REJECTED` org units which are not `REJECTED` themselves.
        rejected_children = OrgUnit.objects.raw(
            """
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
            WHERE validation_status != 'REJECTED';
            """,
        )[0]

        if rejected_children.ids:
            parent_qs = parent_qs.exclude(id__in=rejected_children.ids)

        return parent_qs
