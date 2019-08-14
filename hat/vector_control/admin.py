from django.contrib.gis import admin

from .models import Site, Trap, Catch, Target, GpsImport, APIImport
from django.contrib.gis.db.models.fields import PointField
from django.contrib.gis.forms import OSMWidget


class SiteAdmin(admin.GeoModelAdmin):
    date_hierarchy = "created_at"


admin.site.register(Site, SiteAdmin)


class TrapAdmin(admin.GeoModelAdmin):
    date_hierarchy = "created_at"


admin.site.register(Trap, TrapAdmin)


class CatchAdmin(admin.GeoModelAdmin):
    date_hierarchy = "collect_date"


admin.site.register(Catch, CatchAdmin)


class TargetAdmin(admin.GeoModelAdmin):
    date_hierarchy = "date_time"
    search_fields = ("name", "full_name")


admin.site.register(Target, TargetAdmin)


admin.site.register(GpsImport)


class APIImportAdmin(admin.GeoModelAdmin):
    date_hierarchy = "created_at"
    search_fields = ("json",)
    list_filter = ("has_problem",)


admin.site.register(APIImport, APIImportAdmin)
