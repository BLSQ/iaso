from django.contrib import admin

from .models import MobileUser, DeviceDB, ImageUpload, VideoUpload
from .models import DeviceStatus, DeviceAction, DeviceEvent, JSONDocument

admin.site.register(MobileUser)
admin.site.register(DeviceDB)
admin.site.register(ImageUpload)
admin.site.register(VideoUpload)
admin.site.register(DeviceEvent)
admin.site.register(DeviceStatus)
admin.site.register(DeviceAction)
admin.site.register(JSONDocument)
