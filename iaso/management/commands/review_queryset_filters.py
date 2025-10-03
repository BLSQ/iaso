# myapp/management/commands/check_unrestricted_filters.py
import django_filters

from django.core.management.base import BaseCommand
from django.urls import get_resolver
from rest_framework.viewsets import ViewSetMixin


def is_unrestricted_queryset(qs):
    """
    Return True if the queryset has no filtering (i.e., pure .all()).
    """
    if qs is None:
        return False
    try:
        return not qs.query.where  # no WHERE clause = unrestricted
    except:
        print("failed to review", qs)
        return False


class Command(BaseCommand):
    help = "Flag endpoints with ModelChoiceFilters that use unrestricted querysets (possible data leaks)"

    def handle(self, *args, **options):
        resolver = get_resolver()
        for pattern in resolver.url_patterns:
            self.inspect_pattern(pattern)

    def inspect_pattern(self, pattern, prefix=""):
        if hasattr(pattern, "url_patterns"):  # include patterns
            for p in pattern.url_patterns:
                self.inspect_pattern(p, prefix + str(pattern.pattern))
        else:
            callback = getattr(pattern, "callback", None)
            if not callback:
                return

            view_cls = getattr(callback, "cls", None)
            if not view_cls or not issubclass(view_cls, ViewSetMixin):
                return

            fs = getattr(view_cls, "filterset_class", None)
            if not fs:
                return

            for name, flt in fs.base_filters.items():
                if isinstance(flt, django_filters.ModelChoiceFilter):
                    qs = getattr(flt, "queryset", None)
                    if is_unrestricted_queryset(qs):
                        self.stdout.write(
                            f"Endpoint: {prefix}{pattern.pattern}"
                            + self.style.ERROR(
                                f"  ⚠ {name}: ModelChoiceFilter with unrestricted queryset ({qs.model.__name__})"
                            )
                        )
