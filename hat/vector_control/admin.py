from django.contrib.gis import admin

from .models import Site, Catch, Target


class SiteAdmin(admin.GeoModelAdmin):
    date_hierarchy = 'first_survey_date'


admin.site.register(Site, SiteAdmin)


class CatchAdmin(admin.GeoModelAdmin):
    date_hierarchy = 'collect_date'


admin.site.register(Catch, CatchAdmin)


class TargetAdmin(admin.GeoModelAdmin):
    date_hierarchy = 'date_time'
    search_fields = ('name', 'full_name')


admin.site.register(Target, TargetAdmin)
