from django.contrib import admin

from iaso.models import OpenHEXAInstance, OpenHEXAWorkspace


class OpenHEXAWorkspaceInline(admin.TabularInline):
    model = OpenHEXAWorkspace
    extra = 1
    fields = (
        "account",
        "slug",
        "description",
    )


@admin.register(OpenHEXAInstance)
class OpenHEXAInstanceAdmin(admin.ModelAdmin):
    list_display = ("name", "url", "created_at", "updated_at")
    search_fields = ("name", "url")
    list_filter = ("created_at", "updated_at")
    inlines = [OpenHEXAWorkspaceInline]


@admin.register(OpenHEXAWorkspace)
class OpenHEXAWorkspaceAdmin(admin.ModelAdmin):
    list_display = (
        "account",
        "openhexa_instance",
        "slug",
        "created_at",
        "updated_at",
    )
    search_fields = (
        "slug",
        "description",
    )
    list_filter = (
        "openhexa_instance",
        "account",
        "created_at",
        "updated_at",
    )
