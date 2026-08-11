from django.contrib import admin
from polymorphic.admin import PolymorphicChildModelAdmin, PolymorphicChildModelFilter, PolymorphicParentModelAdmin

from iaso.models import (
    Mission,
    MissionEntityType,
    MissionForm,
    MissionFormThroughForm,
    MissionOrgUnitType,
    MissionWithForms,
)


@admin.register(Mission)
class MissionAdmin(PolymorphicParentModelAdmin):
    base_model = Mission
    child_models = (MissionWithForms,)
    list_filter = (PolymorphicChildModelFilter, "account")
    list_display = ("name", "mission_type", "account")


class MissionFormThroughFormInline(admin.TabularInline):
    model = MissionFormThroughForm
    extra = 0


class MissionWithFormsAdmin(PolymorphicParentModelAdmin):
    base_model = MissionWithForms
    child_models = (MissionForm, MissionEntityType, MissionOrgUnitType)
    list_filter = (PolymorphicChildModelFilter, "account")
    list_display = ("name", "mission_type", "account")
    inlines = [MissionFormThroughFormInline]


@admin.register(MissionForm)
class MissionFormAdmin(PolymorphicChildModelAdmin):
    base_model = MissionForm
    list_filter = ("account",)
    list_display = ("name", "mission_type", "account")
    inlines = [MissionFormThroughFormInline]


@admin.register(MissionOrgUnitType)
class MissionOrgUnitTypeAdmin(PolymorphicChildModelAdmin):
    base_model = MissionOrgUnitType
    list_filter = ("account",)
    list_display = ("name", "mission_type", "account", "org_unit_type", "min_cardinality", "max_cardinality")
    inlines = [MissionFormThroughFormInline]


@admin.register(MissionEntityType)
class MissionEntityTypeAdmin(PolymorphicChildModelAdmin):
    base_model = MissionEntityType
    list_filter = ("account",)
    list_display = ("name", "mission_type", "account", "entity_type", "min_cardinality", "max_cardinality")
    inlines = [MissionFormThroughFormInline]
