from django.contrib import admin
from .models import Check


class CheckAdmin(admin.ModelAdmin):
    date_hierarchy = 'created_at'


admin.site.register(Check, CheckAdmin)
