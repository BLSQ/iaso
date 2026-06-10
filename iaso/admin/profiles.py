from django.contrib.gis import admin

from iaso.admin.utils import admin_attr_decorator
from iaso.models import Profile


@admin.register(Profile)
@admin_attr_decorator
class ProfileAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("org_units",)
    search_fields = ("user__username", "user__first_name", "user__last_name", "account__name")
    list_select_related = ("user", "account")
    list_filter = ("account",)
    list_display = ("id", "user", "account", "language")
    autocomplete_fields = ["account", "user"]
