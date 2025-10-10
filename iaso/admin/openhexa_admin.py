from django.contrib import admin

from iaso.models import OpenHEXAInstance, OpenHEXAWorkspace


class SupersetDashboardInline(admin.TabularInline):
    model = OpenHEXAWorkspace
    extra = 1
    fields = (
        "name",
        "external_id",
    )


@admin.register(OpenHEXAInstance)
class SupersetInstanceAdmin(admin.ModelAdmin):
    list_display = ("name", "url", "created_at", "updated_at")
    search_fields = ("name", "url")
    list_filter = ("created_at", "updated_at")
    inlines = [SupersetDashboardInline]


@admin.register(OpenHEXAWorkspace)
class SupersetDashboardAdmin(admin.ModelAdmin):
    list_display = (
        "openhexa_instance",
        "account",
        "slug",
        "created_at",
        "updated_at",
    )
    search_fields = ("name", "external_id")
    list_filter = (
        "openhexa_instance",
        "account",
        "created_at",
        "updated_at",
    )
