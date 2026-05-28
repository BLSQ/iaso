from django.contrib.gis import admin
from django.db import models

from iaso.admin.utils import IasoJSONEditorWidget, admin_attr_decorator
from iaso.models import FeatureFlag, ProjectFeatureFlags


@admin.register(ProjectFeatureFlags)
@admin_attr_decorator
class ProjectFeatureFlagsAdmin(admin.ModelAdmin):
    list_display = ("featureflag", "project", "configuration")
    list_filter = ("project",)
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}


@admin.register(FeatureFlag)
@admin_attr_decorator
class FeatureFlagAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "requires_authentication", "configuration_schema")
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}
