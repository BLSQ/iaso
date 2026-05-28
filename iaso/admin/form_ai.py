from django.contrib.gis import admin

from ..models.form_ai import TemporaryForm


@admin.register(TemporaryForm)
class TemporaryFormAdmin(admin.ModelAdmin):
    list_display = ("uuid", "user", "account", "created_at")
    list_filter = ("account",)
    search_fields = ("uuid", "user__username", "user__email")
    raw_id_fields = ("user", "account")
    readonly_fields = ("uuid", "created_at")
