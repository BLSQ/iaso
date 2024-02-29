from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
from django.db.models.signals import post_save
from django.dispatch import receiver


class Payment(models.Model):
    """
    Model to store the status of payments linked to multiple OrgUnitChangeRequest by the same user.
    """

    class Statuses(models.TextChoices):
        PENDING = "pending", _("Pending")
        SENT = "sent", _("Sent")
        REJECTED = "rejected", _("Rejected")
        PAID = "paid", _("Paid")

    status = models.CharField(choices=Statuses.choices, default=Statuses.PENDING, max_length=40)
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


class PaymentLot(models.Model):
    """
    Model to store lots / batch of payments. Each payment can belong to only one lot.
    """

    class PaymentLotStatuses(models.TextChoices):
        NEW = "new", _("New")
        SENT = "sent", _("Sent")
        PAID = "paid", _("Paid")
        PARTIALLY_PAID = "partially_paid", _("Partially Paid")

    name = models.CharField(max_length=255)
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payment_lot_created_set")
    updated_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="payment_lot_updated_set"
    )
    status = models.CharField(choices=PaymentLotStatuses.choices, default=PaymentLotStatuses.NEW, max_length=40)

    def compute_status(self):
        payments = self.payments.all()
        if not payments.exists():
            return self.PaymentLotStatuses.NEW
        total_payments = payments.count()
        paid_payments = payments.filter(status=Payment.Statuses.PAID).count()
        sent_payments = payments.filter(status=Payment.Statuses.SENT).count()

        if paid_payments == total_payments:
            return self.PaymentLotStatuses.PAID
        elif paid_payments > 0:
            return self.PaymentLotStatuses.PARTIALLY_PAID
        elif sent_payments == total_payments:
            return self.PaymentLotStatuses.SENT
        else:
            return self.PaymentLotStatuses.NEW

    def save(self, *args, **kwargs):
        if not self.pk:
            self.status = self.PaymentLotStatuses.NEW
        else:
            self.status = self.compute_status()
        super().save(*args, **kwargs)

    def __str__(self):
        return "%s - %s" % (self.name, self.created_at.strftime("%Y-%m-%d %H:%M:%S"))


@receiver(post_save, sender=Payment)
def update_payment_lot_status(sender, instance, **kwargs):
    if instance.payment_lot:
        instance.payment_lot.save()
