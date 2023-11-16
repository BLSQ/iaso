import json

import gspread.utils  # type: ignore
from django.contrib import admin
from django.contrib.admin import widgets
from django.db import models
from django.utils.safestring import mark_safe

from .budget.models import MailTemplate, BudgetStepLink, BudgetStepFile, BudgetStep, WorkflowModel
from .models import (
    Campaign,
    ReasonForDelay,
    RoundDateHistoryEntry,
    Round,
    Config,
    CountryUsersGroup,
    URLCache,
    SpreadSheetImport,
    CampaignGroup,
    VaccineAuthorization,
    NotificationImport,
    Notification,
)

from iaso.admin import IasoJSONEditorWidget


class CampaignAdmin(admin.ModelAdmin):
    raw_id_fields = ("initial_org_unit",)
    formfield_overrides = {
        models.ForeignKey: {"widget": widgets.AdminTextInputWidget},
    }
    list_filter = ["virus", "detection_status", "risk_assessment_status", "budget_status"]

    def save_model(self, request, obj: Campaign, form, change):
        obj.update_geojson_field()
        super().save_model(request, obj, form, change)

    @admin.action(description="Force update of geojson field")
    def force_update_campaign_shape(self, request, queryset):
        c: Campaign
        for c in queryset:
            c.update_geojson_field()
            c.save()
        self.message_user(request, f"GeoJson of {queryset.count()} campaign updated")

    actions = [force_update_campaign_shape]


class SpreadSheetImportAdmin(admin.ModelAdmin):
    list_filter = ["spread_id", "created_at"]
    list_display = ["spread_id", "title", "created_at", "url"]
    readonly_fields = ["title", "table"]
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}

    def title(self, obj: SpreadSheetImport):
        return obj.content["title"]

    def table(self, obj: SpreadSheetImport):
        # Write a get-method for a list of module names in the class Profile
        # return HTML string which will be display in the form
        # for sheet in self.content['sheets']:
        html = ""

        for sheet in obj.content["sheets"]:
            html += f'<details open><summary><b>{sheet["title"]}</b></summary><table>'
            try:
                if not sheet["values"]:
                    html += "Empty</table></details>"
                    continue

                values = gspread.utils.fill_gaps(sheet["values"])

                html += "<tr><td></td>"
                for col_num in range(len(values[0])):
                    html += f"<td>{col_num}</td>"
                html += "</tr>"

                for row_num, row in enumerate(values):
                    html += f"<tr><td>{row_num}</td>"

                    for col in row:
                        html += f"<td>{col}</td>\n"
                    html += "</tr>"

            except Exception as e:
                print(e)
                html += f"<error>render error: {e}</error>"
                html += f'<pre>{sheet["values"]}</pre>'
            html += "</table></details>"

        # print(html)
        return mark_safe(html)


class CampaignGroupAdmin(admin.ModelAdmin):
    pass


class MailTemplateAdmin(admin.ModelAdmin):
    pass


class BudgetStepLinkAdminInline(admin.TabularInline):
    model = BudgetStepLink
    extra = 0


class BudgetStepFileAdminInline(admin.TabularInline):
    model = BudgetStepFile
    extra = 0


class BudgetStepAdmin(admin.ModelAdmin):
    inlines = [
        BudgetStepFileAdminInline,
        BudgetStepLinkAdminInline,
    ]
    list_display = ["campaign", "transition_key", "created_by", "created_at", "deleted_at"]


class WorkflowAdmin(admin.ModelAdmin):
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}


class ConfigAdmin(admin.ModelAdmin):
    raw_id_fields = ["users"]
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}


class VaccineAuthorizationsAdmin(admin.ModelAdmin):
    model = VaccineAuthorization
    raw_id_fields = ("country",)


@admin.register(ReasonForDelay)
class ReasonForDelayAdmin(admin.ModelAdmin):
    model = ReasonForDelay


@admin.register(NotificationImport)
class NotificationImportAdmin(admin.ModelAdmin):
    @admin.action(description="Create notifications")
    def create_notifications(self, request, queryset) -> None:
        for notification_import in queryset.filter(status=NotificationImport.Status.NEW):
            notification_import.create_notifications(created_by=request.user)

    actions = (create_notifications,)
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}
    list_display = ("pk", "file", "status", "created_by", "account")
    list_filter = ("status",)
    raw_id_fields = ("account", "created_by")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "epid_number",
        "get_org_unit_name",
        "site_name",
        "vdpv_category",
        "source",
        "date_of_onset",
    )
    list_filter = ("vdpv_category", "source")
    raw_id_fields = ("account", "org_unit", "created_by", "updated_by", "import_source")
    read_only_fields = ("data_source",)

    @admin.display(description="Org Unit name")
    def get_org_unit_name(self, obj):
        if obj.org_unit:
            return obj.org_unit.name
        return None

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("org_unit")


admin.site.register(Campaign, CampaignAdmin)
admin.site.register(CampaignGroup, CampaignGroupAdmin)
admin.site.register(Config, ConfigAdmin)
admin.site.register(Round)
admin.site.register(RoundDateHistoryEntry)
admin.site.register(CountryUsersGroup)
admin.site.register(URLCache)
admin.site.register(SpreadSheetImport, SpreadSheetImportAdmin)
admin.site.register(BudgetStep, BudgetStepAdmin)
admin.site.register(MailTemplate, MailTemplateAdmin)
admin.site.register(WorkflowModel, WorkflowAdmin)
admin.site.register(VaccineAuthorization, VaccineAuthorizationsAdmin)
