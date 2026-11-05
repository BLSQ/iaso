from django_filters.rest_framework import DjangoFilterBackend

from iaso.models import OrgUnit


class PlanningOrgUnitChildrenFilterBackend(DjangoFilterBackend):
    """Pass planning context into ``PlanningOrgUnitChildrenFilter``."""

    def get_filterset_kwargs(self, request, queryset, view):
        kwargs = super().get_filterset_kwargs(request, queryset, view)
        planning = view.get_planning_or_404()
        kwargs["planning"] = planning
        kwargs["base_queryset"] = OrgUnit.objects.filter_for_user(request.user).filter(
            validation_status=OrgUnit.VALIDATION_VALID
        )
        return kwargs
