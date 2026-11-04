from django.contrib.auth import get_user_model
from django.db import models


User = get_user_model()


class DeviceLog(models.Model):
    device = models.ForeignKey("Device", on_delete=models.CASCADE, related_name="logs")
    user = models.OneToOneField(User, null=True, on_delete=models.SET_NULL)
    data = models.JSONField(null=True, blank=True)
    app_id = models.CharField(max_length=250)
    app_version = models.CharField(max_length=25)
    created_at = models.DateTimeField(auto_now_add=True)
    projects = models.ManyToManyField("Project", related_name="device_logs", blank=True)
