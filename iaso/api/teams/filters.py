from django.db.models import Q
from rest_framework import filters, serializers

from iaso.models.team import Team, TeamType


class TeamManagersFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        managers = request.GET.get("managers", None)
        if managers:
            manager_ids = [int(val) for val in managers.split(",") if val.isnumeric()]
            return queryset.filter(manager_id__in=manager_ids)
        return queryset


class TeamProjectsFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        projects = request.GET.get("projects", None)
        if projects:
            project_ids = [int(val) for val in projects.split(",") if val.isnumeric()]
            return queryset.filter(project_id__in=project_ids)
        return queryset


class TeamTypesFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        types = request.GET.get("types", None)
        if types:
            team_types = [val for val in types.split(",") if TeamType.is_valid_team_type(val)]
            return queryset.filter(type__in=team_types)
        return queryset


class TeamSearchFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        search = request.query_params.get("search")

        if search:
            queryset = queryset.filter(Q(name__icontains=search)).distinct()

        return queryset


class TeamAncestorFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        ancestor_id = request.query_params.get("ancestor")

        if ancestor_id:
            try:
                ancestor = Team.objects.get(pk=ancestor_id)
            except Team.DoesNotExist:
                raise serializers.ValidationError(
                    {"ancestor": "Select a valid choice. That choice is not one of the available choices."}
                )
            queryset = queryset.filter(path__descendants=ancestor.path)

        return queryset
