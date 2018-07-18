from django.contrib import admin

from .models import Planning, Assignation, WorkZone

admin.site.register(Planning)


class AssignationAdmin(admin.ModelAdmin):
    raw_id_fields = ('village',)


admin.site.register(Assignation, AssignationAdmin)


class WorkZoneAdmin(admin.ModelAdmin):
    raw_id_fields = ('AS',)


admin.site.register(WorkZone, WorkZoneAdmin)

