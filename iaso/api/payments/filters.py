from rest_framework import filters


class UsersFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        users = request.GET.get("users", None)
        if users:
            users_ids = [int(val) for val in users.split(",") if val.isnumeric()]
            return queryset.filter(user_id__in=users_ids)
        return queryset


class UserRolesFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        user_roles = request.GET.get("user_roles", None)
        if user_roles:
            user_roles_ids = [int(val) for val in user_roles.split(",") if val.isnumeric()]
            return queryset.filter(user__iaso_profile__user_roles__id__in=user_roles_ids)
        return queryset
