from django.contrib import admin

from iaso.models import Entity, EntityType


admin.site.register(EntityType)
admin.site.register(Entity)
