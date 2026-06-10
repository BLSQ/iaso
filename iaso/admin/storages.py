from django.contrib.admin import SimpleListFilter
from django.contrib.gis import admin

from iaso.models import Entity, StorageDevice, StorageLogEntry, StoragePassword


class StorageLogEntryInline(admin.TabularInline):
    model = StorageLogEntry
    raw_id_fields = ("entity", "instances", "org_unit", "performed_by")


class EntityAutocompleteFilter(SimpleListFilter):
    """
    Limit `entity` list_filter to only entities linked to at least one storage device.
    """

    title = "entity"
    parameter_name = "entity"

    def lookups(self, request, model_admin):
        lookups = []
        storage_device_ids = set(StorageDevice.objects.values_list("entity_id", flat=True))
        entities = Entity.objects.filter(id__in=storage_device_ids).only("pk", "name")
        for entity in entities:
            lookups.append([entity.pk, entity.name])
        return lookups

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(entity__id=self.value())
        return queryset


@admin.register(StorageDevice)
class StorageDeviceAdmin(admin.ModelAdmin):
    fields = (
        "account",
        "customer_chosen_id",
        "type",
        "status",
        "status_reason",
        "status_comment",
        "status_updated_at",
        "org_unit",
        "entity",
        "created_at",
        "updated_at",
    )
    readonly_fields = ("created_at", "updated_at", "status_updated_at")
    list_display = ("account", "type", "customer_chosen_id", "entity")
    list_filter = ("account", "type", "status", EntityAutocompleteFilter)
    raw_id_fields = ("org_unit",)
    autocomplete_fields = ["entity"]
    inlines = [
        StorageLogEntryInline,
    ]


@admin.register(StoragePassword)
class StoragePasswordAdmin(admin.ModelAdmin):
    fields = (
        "password",
        "is_compromised",
        "project",
        "created_at",
        "updated_at",
    )
    readonly_fields = ("created_at", "updated_at")
    list_display = ("project", "password")
    list_filter = ("project", "is_compromised")
