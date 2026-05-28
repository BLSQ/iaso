from django.contrib.gis import admin
from django.db import models

from iaso.admin.utils import IasoJSONEditorWidget, admin_attr_decorator
from iaso.models.data_store import JsonDataStore


@admin.register(JsonDataStore)
@admin_attr_decorator
class JsonDataStoreAdmin(admin.ModelAdmin):
    raw_id_fields = ["account", "org_unit"]
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}
