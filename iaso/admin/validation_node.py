from django.contrib import admin

from iaso.models import ValidationNode


@admin.register(ValidationNode)
class ValidationNode(admin.ModelAdmin):
    autocomplete_fields = ["instance"]
