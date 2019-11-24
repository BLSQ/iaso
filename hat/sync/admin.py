from django.contrib import admin

from .models import MobileUser, DeviceDB, ImageUpload, VideoUpload
from .models import DeviceStatus, DeviceAction, DeviceEvent, JSONDocument


class JSONDocumentAdmin(admin.ModelAdmin):
    search_fields = ("doc",)
    raw_id_fields = ("case", "population")


admin.site.register(MobileUser)
admin.site.register(DeviceDB)
admin.site.register(ImageUpload)
admin.site.register(VideoUpload)
admin.site.register(DeviceEvent)
admin.site.register(DeviceStatus)
admin.site.register(DeviceAction)
admin.site.register(JSONDocument, JSONDocumentAdmin)
