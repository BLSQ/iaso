from django.contrib.gis import admin

from iaso.models import (
    StockItem,
    StockItemRule,
    StockKeepingUnit,
    StockKeepingUnitChildren,
    StockLedgerItem,
    StockRulesVersion,
)


@admin.register(StockItem)
class StockItemAdmin(admin.ModelAdmin):
    fields = ("org_unit", "sku", "value", "created_at", "updated_at")
    readonly_fields = ("org_unit", "sku", "value", "created_at", "updated_at")
    list_display = ("org_unit", "sku", "value")
    list_filter = ["sku"]

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(StockItemRule)
class StockItemRuleAdmin(admin.ModelAdmin):
    fields = ("sku", "form", "version", "impact", "question", "created_at", "updated_at", "created_by", "updated_by")
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by")
    list_display = ("sku", "form", "question", "impact", "version", "created_at")
    list_filter = ("sku", "form", "impact")


@admin.register(StockKeepingUnit)
class StockKeepingUnitAdmin(admin.ModelAdmin):
    fields = (
        "account",
        "name",
        "short_name",
        "projects",
        "org_unit_types",
        "forms",
        "display_unit",
        "display_precision",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
        "deleted_at",
    )
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by")
    list_display = ("name", "short_name", "account")
    list_filter = ("account", "name", "short_name")


@admin.register(StockKeepingUnitChildren)
class StockKeepingUnitChildrenAdmin(admin.ModelAdmin):
    fields = ("parent", "child", "created_at", "updated_at", "created_by", "updated_by")
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by")
    list_display = ("parent", "child", "value")
    list_filter = ("parent", "child")


@admin.register(StockLedgerItem)
class StockLedgerItemAdmin(admin.ModelAdmin):
    fields = ("rule", "sku", "org_unit", "submission", "question", "impact", "value", "created_at", "created_by")
    readonly_fields = (
        "rule",
        "sku",
        "org_unit",
        "submission",
        "question",
        "impact",
        "value",
        "created_at",
        "created_by",
    )
    list_display = ("rule", "sku", "org_unit", "question", "impact", "value", "created_at")
    list_filter = ("sku", "impact", "rule")

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(StockRulesVersion)
class StockRuleVersionAdmin(admin.ModelAdmin):
    fields = ("account", "name", "status", "created_at", "updated_at", "created_by", "updated_by", "deleted_at")
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by")
    list_display = ("account", "name", "status")
    list_filter = ("account", "status")
