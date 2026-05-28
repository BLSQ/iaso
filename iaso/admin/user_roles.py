from django.contrib.gis import admin

from iaso.models import UserRole


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    autocomplete_fields = ["account"]
