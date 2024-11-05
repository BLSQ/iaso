from django.contrib import admin

from .models import (
    Beneficiary,
    Journey,
    Step,
    Visit,
)


@admin.register(Beneficiary)
class BeneficiaryAdmin(admin.ModelAdmin):
    list_filter = ("birth_date", "gender", "account")
    list_display = ("id", "birth_date", "gender", "account")


@admin.register(Journey)
class JourneyAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "admission_criteria",
        "admission_type",
        "nutrition_programme",
        "programme_type",
        "initial_weight",
        "discharge_weight",
        "start_date",
        "end_date",
        "duration",
        "weight_gain",
        "weight_loss",
        "exit_type",
        "instance_id",
        "beneficiary",
    )
    list_filter = (
        "admission_criteria",
        "admission_type",
        "nutrition_programme",
        "programme_type",
        "start_date",
        "end_date",
        "exit_type",
        "beneficiary__account",
    )


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ("id", "date", "number", "org_unit", "journey")
    raw_id_fields = ("org_unit", "journey")
    list_filter = ("date", "number", "journey__programme_type", "journey__beneficiary__account")


@admin.register(Step)
class StepAdmin(admin.ModelAdmin):
    list_display = ("id", "assistance_type", "visit")
    list_filter = ("assistance_type", "visit__journey__programme_type")
