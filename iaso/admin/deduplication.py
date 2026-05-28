from django.contrib.gis import admin
from django.db import models

from iaso.admin.utils import IasoJSONEditorWidget, admin_attr_decorator
from iaso.models import EntityDuplicate, EntityDuplicateAnalyzis


@admin.register(EntityDuplicate)
class EntityDuplicateAdmin(admin.ModelAdmin):
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}
    autocomplete_fields = ("entity1", "entity2", "analyze")

    @admin_attr_decorator
    def entity1_desc(self, obj):
        return f"{obj.entity1.name} ({obj.entity1.id})"

    @admin_attr_decorator
    def entity2_desc(self, obj):
        return f"{obj.entity2.name} ({obj.entity2.id})"

    list_display = (
        "similarity_score",
        "validation_status",
        "get_entity_type",
        "entity1_desc",
        "entity2_desc",
        "created_at",
    )
    list_filter = ("validation_status", "entity1__entity_type")


@admin.register(EntityDuplicateAnalyzis)
class EntityDuplicateAnalyzisAdmin(admin.ModelAdmin):
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}
    autocomplete_fields = ("task",)
    search_fields = ("id",)
