from django.contrib import admin

from .models import Modification


@admin.register(Modification)
class ModificationAdmin(admin.ModelAdmin):
    date_hierarchy = "created_at"
    list_filter = ("content_type", "source")
    search_fields = ("user",)
