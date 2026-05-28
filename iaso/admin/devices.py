from django.contrib.gis import admin

from iaso.models import Device, DeviceOwnership, DevicePosition


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    pass


@admin.register(DeviceOwnership)
class DeviceOwnershipAdmin(admin.ModelAdmin):
    pass


@admin.register(DevicePosition)
class DevicePositionAdmin(admin.ModelAdmin):
    pass
