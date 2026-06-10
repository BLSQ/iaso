from django.contrib.gis import admin
from django.db import models

from iaso.admin.utils import IasoJSONEditorWidget
from iaso.models.json_config import Config


@admin.register(Config)
class ConfigAdmin(admin.ModelAdmin):
    raw_id_fields = ["users"]
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}
