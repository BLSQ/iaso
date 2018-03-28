from django.contrib import admin

from .models import Site, Catch, Target

# Register your models here.

class SiteAdmin(admin.ModelAdmin):
    date_hierarchy = 'first_survey_date'

admin.site.register(Site, SiteAdmin)

class CatchAdmin(admin.ModelAdmin):
    date_hierarchy = 'collect_date'

admin.site.register(Catch, CatchAdmin)

class TargetAdmin(admin.ModelAdmin):
    date_hierarchy = 'date_time'
    search_fields = ('name', 'full_name')

admin.site.register(Target, TargetAdmin)
