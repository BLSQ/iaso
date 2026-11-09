import datetime

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import Count, OuterRef, Q
from django.db.models.expressions import Subquery
from typing_extensions import Self

from iaso.models.common import CreatedAndUpdatedModel
from iaso.models.device_log import DeviceLog


User = get_user_model()


class DeviceQuerySet(models.QuerySet):
    def filter_for_user(self, user: User) -> Self:
        iaso_profile = getattr(user, "iaso_profile", None)
        account = getattr(iaso_profile, "account", None)
        if not account:
            return self.none()
        return self.filter(account=account)

    def with_current_owner(self) -> Self:
        subquery = (
            DeviceOwnership.objects.filter(device_id=OuterRef("pk"))
            .filter(Q(end__gte=datetime.datetime.now(datetime.timezone.utc)) | Q(end__isnull=True))
            .select_related("user")
            .order_by("-start")
        )[:1]
        return self.annotate(current_owner_id=Subquery(subquery.values("user__id"))).annotate(
            current_owner_username=Subquery(subquery.values("user__username"))
        )

    def with_last_synced(self) -> Self:
        subquery = (DeviceLog.objects.filter(device_id=OuterRef("pk")).order_by("-created_at"))[:1]
        return self.annotate(last_synced_at=Subquery(subquery.values("created_at"))).annotate(
            last_app_version_id=Subquery(subquery.values("app_version"))
        )

    def with_first_synced(self) -> Self:
        subquery = (DeviceLog.objects.filter(device_id=OuterRef("pk")).order_by("created_at"))[:1]
        return self.annotate(first_synced_at=Subquery(subquery.values("created_at")))

    def with_instance_count(self) -> Self:
        return self.annotate(instance_count=Count("instance"))


class Device(CreatedAndUpdatedModel):
    installation_id = models.CharField(max_length=250, unique=True)
    account = models.ForeignKey("Account", on_delete=models.CASCADE, null=True, related_name="devices")
    test_device = models.BooleanField(default=False)
    projects = models.ManyToManyField("Project", related_name="devices", blank=True)

    objects = DeviceQuerySet.as_manager()

    def __str__(self) -> str:
        return f"{self.installation_id} "


class DeviceOwnership(models.Model):
    device = models.ForeignKey("Device", on_delete=models.CASCADE, related_name="owners")
    project = models.ForeignKey("Project", blank=True, null=True, on_delete=models.DO_NOTHING)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    start = models.DateTimeField(auto_now_add=True)
    end = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.device} - {self.user}"
