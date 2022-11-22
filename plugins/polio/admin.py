import json

import gspread.utils  # type: ignore
from django.contrib import admin
from django.contrib.admin import widgets
from django.db import models
from django.utils.safestring import mark_safe

from .budget.models import MailTemplate, BudgetStepLink, BudgetStepFile, BudgetStep, WorkflowModel
from .models import (
    Campaign,
    Surge,
    Round,
    Config,
    CountryUsersGroup,
    URLCache,
    SpreadSheetImport,
    CampaignGroup,
    BudgetEvent,
    BudgetFiles,
)


class CampaignAdmin(admin.ModelAdmin):
    raw_id_fields = ("initial_org_unit",)
    formfield_overrides = {
        models.ForeignKey: {"widget": widgets.AdminTextInputWidget},
    }
    list_filter = ["virus", "detection_status", "risk_assessment_status", "budget_status"]


class SpreadSheetImportAdmin(admin.ModelAdmin):
    list_filter = ["spread_id", "created_at"]
    list_display = ["spread_id", "title", "created_at", "url"]
    readonly_fields = ["title", "table"]

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
    readonly_fields = [
        "pretty_json",
    ]

    def pretty_json(self, obj: WorkflowModel):
        try:
            d = json.dumps(obj.definition, indent=2)
            html = f"<pre>{d}</pre>"
            return mark_safe(html)
        except Exception as e:
            print(e)


admin.site.register(Campaign, CampaignAdmin)
admin.site.register(CampaignGroup, CampaignGroupAdmin)
admin.site.register(Config)
admin.site.register(Surge)
admin.site.register(Round)
admin.site.register(CountryUsersGroup)
admin.site.register(URLCache)
admin.site.register(SpreadSheetImport, SpreadSheetImportAdmin)
admin.site.register(BudgetStep, BudgetStepAdmin)
admin.site.register(MailTemplate, MailTemplateAdmin)
admin.site.register(WorkflowModel, WorkflowAdmin)
