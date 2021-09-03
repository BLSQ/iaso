from django.contrib import admin

from .models import Campaign, Preparedness, Surge, Round, Config, CountryUsersGroup


class CampaignAdmin(admin.ModelAdmin):
    raw_id_fields = ("initial_org_unit",)
    list_filter = ["virus", "vacine", "detection_status", "risk_assessment_status", "budget_status"]


admin.site.register(Campaign, CampaignAdmin)
admin.site.register(Preparedness)
admin.site.register(Config)
admin.site.register(Surge)
admin.site.register(Round)
admin.site.register(CountryUsersGroup)
