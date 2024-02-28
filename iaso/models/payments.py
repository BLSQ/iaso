from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _


class Statuses(models.TextChoices):
    PENDING = "pending", _("Pending")
    SENT = "sent", _("Sent")
    REJECTED = "rejected", _("Rejected")


class Payment(models.Model):
    """
    Model to store the status of payments linked to multiple OrgUnitChangeRequest by the same user.
    """

    status = models.CharField(choices=Statuses.choices, default=Statuses.PENDING, max_length=40)
    change_requests = models.ManyToManyField("OrgUnitChangeRequest", related_name="payment")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payment")
    created_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="payment_created_set"
    )
    updated_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="payment_updated_set"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    payment_lot = models.ForeignKey(
        "PaymentLot", on_delete=models.SET_NULL, null=True, blank=True, related_name="payments"
    )

    def __str__(self):
        return "%s - %s - %s - %s" % (
            self.id,
            self.status,
            self.user,
            self.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
        )


class PotentialPayment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="potential_payment")
    change_requests = models.ManyToManyField("OrgUnitChangeRequest", related_name="potential_payment")


class PaymentLot(models.Model):
    """
    Model to store lots of payments. Each payment can belong to only one lot.
    """

    name = models.CharField(max_length=255)
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payment_lot_created_set")
    updated_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="payment_lot_updated_set"
    )

    def __str__(self):
        return "%s - %s" % (self.name, self.created_at.strftime("%Y-%m-%d %H:%M:%S"))
