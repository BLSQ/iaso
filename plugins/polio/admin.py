from django.contrib import admin

from .models import Campaign, Preparedness, Surge, Round, Config, CountryUsersGroup, URLCache, SpreadSheetImport


class CampaignAdmin(admin.ModelAdmin):
    raw_id_fields = ("initial_org_unit",)
    list_filter = ["virus", "vacine", "detection_status", "risk_assessment_status", "budget_status"]


class PreparednessAdmin(admin.ModelAdmin):
    list_filter = ["campaign"]
    list_display = ["campaign", "created_at"]


class SpreadSheetImportAdmin(admin.ModelAdmin):
    list_filter = ["spread_id", "created_at"]
    list_display = ["spread_id", "title", "created_at", "url"]

    def title(self, obj: SpreadSheetImport):
        return obj.content["title"]


admin.site.register(Campaign, CampaignAdmin)
admin.site.register(Preparedness, PreparednessAdmin)
admin.site.register(Config)
admin.site.register(Surge)
admin.site.register(Round)
admin.site.register(CountryUsersGroup)
admin.site.register(URLCache)
admin.site.register(SpreadSheetImport, SpreadSheetImportAdmin)
