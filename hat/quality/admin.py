from django.contrib import admin
from .models import Check


class CheckAdmin(admin.ModelAdmin):
    date_hierarchy = "created_at"
    raw_id_fields = ("test",)


admin.site.register(Check, CheckAdmin)
