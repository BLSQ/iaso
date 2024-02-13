from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _

class Payment(models.Model):
    """
    Model to store the status of payments linked to multiple OrgUnitChangeRequest by the same user.
    """

    class Statuses(models.TextChoices):
        PENDING = "pending", _("Pending")
        SENT = "sent", _("Sent")
        REJECTED = "rejected", _("Rejected")

    status = models.CharField(choices=Statuses.choices, default=Statuses.PENDING, max_length=40)
    change_requests = models.ManyToManyField('OrgUnitChangeRequest', related_name="payment_statuses")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payment_statuses")
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="payment_created_set")
    updated_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="payment_updated_set")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)