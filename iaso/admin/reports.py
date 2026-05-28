from django.contrib.gis import admin

from iaso.models import Report, ReportVersion


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    pass


@admin.register(ReportVersion)
class ReportVersionAdmin(admin.ModelAdmin):
    pass
