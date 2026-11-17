from django.contrib import admin
from django.db import models

from iaso.admin.base import IasoJSONEditorWidget
from iaso.models import Device, DeviceLog


@admin.register(DeviceLog)
class DeviceLogAdmin(admin.ModelAdmin):
    list_display = ("id", "device", "created_at", "app_version", "app_id")
    search_fields = ("device__installation_id",)
    list_filter = ("app_version", "app_id")
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ("installation_id", "account", "last_sync", "current_owner", "created_at")
    search_fields = ("installation_id",)

    def get_queryset(self, request):
        qs = Device.objects.with_last_synced().with_current_owner()
        ordering = self.get_ordering(request)
        if ordering:
            qs = qs.order_by(*ordering)
        return qs

    @admin.display(description="Last sync")
    def last_sync(self, obj):
        return obj.last_synced_at

    @admin.display(description="Current owner")
    def current_owner(self, obj):
        return obj.current_owner_username
