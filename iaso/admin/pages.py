from django.contrib.gis import admin
from django.db import models

from iaso.admin.utils import IasoJSONEditorWidget
from iaso.models import Page


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}
    autocomplete_fields = ["account"]
    list_display = ("name", "slug", "type", "account")
