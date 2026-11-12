from uuid import uuid4

from django.contrib.gis.db.models import PointField
from django.db import models
from django.utils.translation import gettext_lazy as _


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
    def latitude(self) -> float | None:
        return self.location.y if self.location is not None else None

    @property
    def longitude(self) -> float | None:
        return self.location.x if self.location is not None else None

    @property
    def altitude(self) -> float | None:
        return self.location.z if self.location is not None else None

    def __str__(self) -> str:
        return str(self.uuid) + " - " + str(self.device)
