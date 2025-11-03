from django.contrib import admin

from .models import Beneficiary, Dhis2SyncResults, Journey, MonthlyStatistics, Step, Visit


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
    list_display = ("id", "date", "number", "muac_size", "whz_color", "org_unit", "journey")
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
        "year",
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
        "dhis2_id",
        "account",
        "month",
        "year",
        "period",
        "gender",
        "admission_criteria",
        "admission_type",
        "beneficiary_with_admission_type",
        "nutrition_programme",
        "programme_type",
        "muac_under_11_5",
        "muac_11_5_12_4",
        "muac_above_12_5",
        "whz_score_3_2",
        "whz_score_2",
        "whz_score_3",
        "oedema",
        "muac_under_23",
        "muac_above_23",
        "exit_type",
        "beneficiary_with_exit_type",
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
        "dhis2_id",
        "admission_type",
        "nutrition_programme",
        "programme_type",
        "gender__icontains",
        "month__icontains",
        "year__icontains",
    )


@admin.register(Dhis2SyncResults)
class Dhis2SyncResults(admin.ModelAdmin):
    list_display = (
        "id",
        "org_unit_dhis2_id",
        "org_unit_id",
        "data_set_id",
        "period",
        "month",
        "year",
        "response",
        "account",
        "status",
        "created_at",
        "updated_at",
    )
    list_filter = ("account", "status", "month", "year")
    search_fields = (
        "account__name",
        "org_unit_dhis2_id",
        "org_unit__id",
        "data_set_id",
        "period",
        "year__icontains",
        "month__icontains",
        "year__icontains",
    )
