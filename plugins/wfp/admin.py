from django.contrib import admin

from .models import Beneficiary, Journey, MonthlyStatistics, Step, Visit


@admin.register(Beneficiary)
class BeneficiaryAdmin(admin.ModelAdmin):
    list_filter = ("birth_date", "gender", "account", "guidelines")
    list_display = ("id", "birth_date", "gender", "account", "guidelines")


@admin.register(Journey)
class JourneyAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "admission_criteria",
        "muac_size",
        "whz_score",
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
    raw_id_fields = ["beneficiary"]
    list_filter = (
        "admission_criteria",
        "admission_type",
        "nutrition_programme",
        "beneficiary__gender",
        "programme_type",
        "start_date",
        "end_date",
        "exit_type",
        "beneficiary__account",
        "beneficiary__guidelines",
    )

    search_fields = (
        "beneficiary__account__name",
        "beneficiary__gender",
        "admission_criteria",
        "admission_type",
        "nutrition_programme",
        "programme_type",
    )


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ("id", "date", "number", "muac_size","whz_score","org_unit", "journey")
    raw_id_fields = ("org_unit", "journey")
    list_filter = (
        "date",
        "number",
        "journey__programme_type",
        "journey__beneficiary__account",
    )
    search_fields = ("journey__beneficiary__account__name", "org_unit__id", "org_unit__name", "number")


@admin.register(Step)
class StepAdmin(admin.ModelAdmin):
    list_display = ("id", "assistance_type", "quantity_given", "ration_size", "visit")
    list_filter = (
        "assistance_type",
        "ration_size",
        "visit__journey__programme_type",
        "visit__journey__beneficiary__account",
    )


@admin.register(MonthlyStatistics)
class MonthlyStatisticsAdmin(admin.ModelAdmin):
    list_filter = (
        "account",
        "month",
        "gender",
        "admission_criteria",
        "admission_type",
        "nutrition_programme",
        "programme_type",
        "exit_type",
    )
    list_display = (
        "id",
        "org_unit",
        "account",
        "month",
        "year",
        "gender",
        "admission_criteria",
        "admission_type",
        "nutrition_programme",
        "programme_type",
        "exit_type",
        "number_visits",
        "given_sachet_rusf",
        "given_sachet_rutf",
        "given_quantity_csb",
        "given_ration_cbt",
    )
    search_fields = (
        "account__name",
        "org_unit__id",
        "org_unit__name",
        "admission_type",
        "nutrition_programme",
        "programme_type",
        "gender__icontains",
        "month__icontains",
        "year__icontains",
    )
