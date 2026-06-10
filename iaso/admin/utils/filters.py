from django.contrib.admin import SimpleListFilter
from django.db.models import Count, Q


def has_relation_filter_factory(filter_title, filter_parameter_name):
    """
    A factory method that creates a filter class on the fly for a given foreign
    key relation on a model.
    The filter provides a simple has/has not on the ID, without the overhead
    of fetching all possible relations from the database.
    """

    class HasRelationFilter(SimpleListFilter):
        title = filter_title
        parameter_name = filter_parameter_name

        def lookups(self, _request, _model_admin):
            return (
                ("1", f"Has {filter_parameter_name}"),
                ("0", f"Has no {filter_parameter_name}"),
            )

        def queryset(self, _request, queryset):
            value = self.value()
            if value == "1":
                return queryset.exclude(Q(**{f"{filter_parameter_name}__isnull": True}))
            if value == "0":
                return queryset.filter(Q(**{f"{filter_parameter_name}__isnull": True}))

    return HasRelationFilter


class EntityEmptyAttributesFilter(SimpleListFilter):
    title = "Valid attributes (file is not null or empty, attrs not deleted)"

    parameter_name = "valid_attributes"

    def lookups(self, _request, _model_admin):
        return (
            ("1", "Has valid attributes"),
            ("0", "Has invalid attributes"),
        )

    def queryset(self, _request, queryset):
        value = self.value()

        invalid_filter = Q(deleted_at=None) & (
            Q(attributes__file__isnull=True) | Q(attributes__file="") | Q(attributes__deleted=True)
        )

        if value == "1":
            return queryset.filter(~invalid_filter)
        if value == "0":
            return queryset.filter(invalid_filter)


class DuplicateUUIDFilter(SimpleListFilter):
    title = "Duplicated UUIDs"

    parameter_name = "duplicate_uuids"

    def lookups(self, _request, _model_admin):
        return (("1", "Has a duplicated uuid"),)

    def queryset(self, _request, queryset):
        if self.value() == "1":
            duplicates = queryset.values("uuid").annotate(uuid_count=Count("uuid")).filter(uuid_count__gt=1)

            return queryset.filter(uuid__in=[item["uuid"] for item in duplicates])
