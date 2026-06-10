from django.contrib.gis import admin
from django.db import models

from iaso.admin.utils import IasoJSONEditorWidget, admin_attr_decorator
from iaso.models import Mapping, MappingVersion


@admin.register(Mapping)
@admin_attr_decorator
class MappingAdmin(admin.GeoModelAdmin):
    list_filter = ("form_id",)
    autocomplete_fields = ["data_source"]


@admin.register(MappingVersion)
@admin_attr_decorator
class MappingVersionAdmin(admin.GeoModelAdmin):
    list_filter = ("form_version_id",)
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}
