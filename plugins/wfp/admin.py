from django.contrib import admin

from .models import (
    Beneficiary,
    Journey,
    Step,
    Visit,
)


class BeneficiaryAdmin(admin.ModelAdmin):
    list_filter = ("birth_date", "gender")
    list_display = ("id", "birth_date", "gender")


class JourneyAdmin(admin.ModelAdmin):
    list_display = ("id", "admission_criteria", "admission_type", "nutrition_programme", "programme_type", "exit_type")
    list_filter = ("admission_criteria", "admission_type", "nutrition_programme", "programme_type", "exit_type")


class VisitAdmin(admin.ModelAdmin):
    list_display = ("id", "date", "number", "org_unit", "journey")
    raw_id_fields = ("org_unit", "journey")
    list_filter = ("date",)


class StepAdmin(admin.ModelAdmin):
    list_display = ("id", "assistance_type", "visit")
    list_filter = ("assistance_type",)


admin.site.register(Beneficiary, BeneficiaryAdmin)
admin.site.register(Journey, JourneyAdmin)
admin.site.register(Visit, VisitAdmin)
admin.site.register(Step, StepAdmin)
