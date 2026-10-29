import datetime

from uuid import uuid4

from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.gis.db.models import PointField
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Count, OuterRef, Q
from django.db.models.expressions import Subquery
from django.utils.translation import gettext_lazy as _

from iaso.models.common import CreatedAndUpdatedModel


class DeviceQuerySet(models.QuerySet):
    def filter_for_user(self, user: User) -> "DeviceQuerySet":
        iaso_profile = getattr(user, "iaso_profile", None)
        account = getattr(iaso_profile, "account", None)
        if not account:
            return self.none()
        return self.filter(account=account)

    def with_current_owner(self) -> "DeviceQuerySet":
        subquery = (
            DeviceOwnership.objects.filter(device_id=OuterRef("pk"))
            .filter(Q(end__gte=datetime.datetime.now()) | Q(end__isnull=True))
            .select_related("user")
            .order_by("-start")
        )[:1]
        return self.annotate(current_owner_id=Subquery(subquery.values("user__id"))).annotate(
            current_owner_username=Subquery(subquery.values("user__username"))
        )

    def with_last_synced(self) -> "DeviceQuerySet":
        subquery = (DeviceLog.objects.filter(device_id=OuterRef("pk")).order_by("-created_at"))[:1]
        return self.annotate(last_synced_at=Subquery(subquery.values("created_at"))).annotate(
            last_app_version_id=Subquery(subquery.values("app_version"))
        )

    def with_first_synced(self) -> "DeviceQuerySet":
        subquery = (DeviceLog.objects.filter(device_id=OuterRef("pk")).order_by("created_at"))[:1]
        return self.annotate(first_synced_at=Subquery(subquery.values("created_at")))

    def with_instance_count(self) -> "DeviceQuerySet":
        return self.annotate(instance_count=Count("instance"))


class Device(CreatedAndUpdatedModel):
    installation_id = models.CharField(max_length=250, unique=True)
    account = models.ForeignKey("Account", on_delete=models.CASCADE, null=True, related_name="devices")
    test_device = models.BooleanField(default=False)
    projects = models.ManyToManyField("Project", related_name="devices", blank=True)

    objects = DeviceQuerySet.as_manager()

    def __str__(self):
        return f"{self.installation_id} "


class DeviceOwnership(models.Model):
    device = models.ForeignKey("Device", on_delete=models.CASCADE, related_name="owners")
    project = models.ForeignKey("Project", blank=True, null=True, on_delete=models.DO_NOTHING)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    start = models.DateTimeField(auto_now_add=True)
    end = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.device} - {self.user}"


class DevicePosition(models.Model):
    CAR = "car"
    FOOT = "foot"
    TRUCK = "truck"

    TRANSPORT_TYPE_CHOICES = ((CAR, _("Car")), (FOOT, _("Foot")), (TRUCK, _("Truc")))

    uuid = models.UUIDField(default=uuid4, unique=True)
    device = models.ForeignKey("Device", on_delete=models.CASCADE)
    location = PointField(dim=3, srid=4326)
    transport = models.CharField(max_length=32, choices=TRANSPORT_TYPE_CHOICES)
    accuracy = models.DecimalField(decimal_places=2, max_digits=7)
    captured_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def latitude(self):
        return self.location.y if self.location is not None else None

    @property
    def longitude(self):
        return self.location.x if self.location is not None else None

    @property
    def altitude(self):
        return self.location.z if self.location is not None else None

    def __str__(self):
        return str(self.uuid) + " - " + str(self.device)


class DeviceLog(models.Model):
    device = models.ForeignKey("Device", on_delete=models.CASCADE, related_name="logs")
    user = models.OneToOneField(User, null=True, on_delete=models.CASCADE)
    data = models.JSONField(null=True, blank=True)
    app_id = models.CharField(max_length=250)
    app_version = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)
    projects = models.ManyToManyField("Project", related_name="device_logs", blank=True)

    def save(self, *args, **kwargs):
        if DeviceLog.objects.filter(id=self.id).exists():
            raise ValidationError(f"DeviceLog {self.id} already exists")
        super().save(*args, **kwargs)
