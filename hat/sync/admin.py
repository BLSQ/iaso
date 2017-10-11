from django.contrib import admin

from .models import MobileUser, DeviceDB, ImageUpload, VideoUpload

admin.site.register(MobileUser)
admin.site.register(DeviceDB)
admin.site.register(ImageUpload)
admin.site.register(VideoUpload)
