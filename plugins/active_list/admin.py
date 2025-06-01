from django.contrib import admin

from .models import Import, Patient, PatientInactiveEvent, Record, Validation


@admin.register(Validation)
class ValidationAdmin(admin.ModelAdmin):
    list_display = ("period", "org_unit", "created_at", "user_name", "level", "validation_status")
    raw_id_fields = ("org_unit",)
    search_fields = ("period", "user_name")


@admin.register(Record)
class RecordAdmin(admin.ModelAdmin):
    list_display = ("number", "region", "district", "facility_name", "period", "patient")
    raw_id_fields = ("patient", "org_unit")
    search_fields = ("region", "district", "facility_name", "period")
    list_filter = ("region", "district")


@admin.register(Import)
class ImportAdmin(admin.ModelAdmin):
    list_display = ("org_unit", "month", "creation_date", "source", "file_name")
    raw_id_fields = ("org_unit",)
    search_fields = ("month", "file_name")


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("identifier_code", "created_at", "active", "loss_date")
    raw_id_fields = ("last_record",)
    search_fields = ("identifier_code",)
    list_filter = ("active",)


@admin.register(PatientInactiveEvent)
class PatientInactiveEventAdmin(admin.ModelAdmin):
    list_display = ("patient", "date", "reason", "created_at")
    raw_id_fields = ("patient",)
    search_fields = ("patient__identifier_code",)
    list_filter = ("reason",)
