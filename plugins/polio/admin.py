from django.contrib import admin
from .models import Campaign


class CampaignAdmin(admin.ModelAdmin):
    autocomplete_fields = ["initial_org_unit"]
    list_filter = ["virus", "vacine", "detection_status", "risk_assessment_status", "budget_status"]


admin.site.register(Campaign, CampaignAdmin)
