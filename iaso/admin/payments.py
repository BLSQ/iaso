from django.contrib.gis import admin
from django.db import models
from django.utils.html import format_html

from iaso.admin.utils import IasoJSONEditorWidget
from iaso.models import Payment, PaymentLot, PotentialPayment


@admin.register(PotentialPayment)
class PotentialPaymentAdmin(admin.ModelAdmin):
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}
    list_display = ("id", "change_request_ids", "user")
    autocomplete_fields = ("user", "payment_lot", "task")

    def change_request_ids(self, obj):
        change_requests = obj.change_requests.all()
        if change_requests:
            return format_html(
                ", ".join(
                    f'<a href="/admin/iaso/orgunitchangerequest/{cr.id}/change/">{cr.id}</a>' for cr in change_requests
                )
            )
        return "-"

    change_request_ids.short_description = "Change Request IDs"


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}
    list_display = ("id", "status", "created_at", "updated_at", "change_request_ids")
    autocomplete_fields = ("user", "created_by", "updated_by", "payment_lot")

    def change_request_ids(self, obj):
        change_requests = obj.change_requests.all()
        if change_requests:
            return format_html(
                ", ".join(
                    f'<a href="/admin/iaso/orgunitchangerequest/{cr.id}/change/">{cr.id}</a>' for cr in change_requests
                )
            )
        return "-"

    change_request_ids.short_description = "Change Request IDs"


@admin.register(PaymentLot)
class PaymentLotAdmin(admin.ModelAdmin):
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}
    list_display = ("id", "status", "created_at", "updated_at", "payment_ids")
    search_fields = ("id",)
    autocomplete_fields = ("created_by", "updated_by", "task")

    def payment_ids(self, obj):
        payments = obj.payments.all()
        if payments:
            return format_html(
                ", ".join(
                    f'<a href="/admin/iaso/payment/{payment.id}/change/">{payment.id}</a>' for payment in payments
                )
            )
        return "-"

    payment_ids.short_description = "Payment IDs"
