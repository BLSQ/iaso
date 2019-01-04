from django.contrib.gis import admin

from .models import Site, Catch, Target, GpsImport, APIImport
from django.contrib.gis.db.models.fields import PointField
from django.contrib.gis.forms import OSMWidget


class SiteAdmin(admin.GeoModelAdmin):
    date_hierarchy = 'created_at'
    formfield_overrides = {
       PointField: {'widget': OSMWidget},
    }


admin.site.register(Site, SiteAdmin)


class CatchAdmin(admin.GeoModelAdmin):
    date_hierarchy = 'collect_date'
    formfield_overrides = {
       PointField: {'widget': OSMWidget},
    }


admin.site.register(Catch, CatchAdmin)


class TargetAdmin(admin.GeoModelAdmin):
    date_hierarchy = 'date_time'
    search_fields = ('name', 'full_name')


admin.site.register(Target, TargetAdmin)


admin.site.register(GpsImport)

admin.site.register(APIImport)
