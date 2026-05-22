from django_filters import BaseInFilter, CharFilter, NumberFilter


class CharInFilter(BaseInFilter, CharFilter):
    """
    Filter that checks if the model field is in a list of comma-separated strings.

    Usage (in a FilterSet):
    >>> filter_name = CharInFilter(field_name="model_field_name", lookup_expr="in")
    """


class NumberInFilter(BaseInFilter, NumberFilter):
    """
    Filter that checks if the model field is in a list of comma-separated numbers.

    Usage (in a FilterSet):
    >>> filter_name = NumberInFilter(field_name="model_field_name", lookup_expr="in")
    """
