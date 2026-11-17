from rest_framework import serializers

from iaso.models import DeviceOwnership


class GetOrCreateDeviceField(serializers.SlugRelatedField):
    """
    Extends `SlubRelatedField` in order to create the `Device` when it doesn't exist and pass validation.
    """

    def to_internal_value(self, data):
        try:
            return self._get_or_create_device(project=self.context["project"], user=self.context["user"], data=data)
        except (TypeError, ValueError):
            self.fail("invalid")

    def _get_or_create_device(self, project, user, data):
        queryset = self.get_queryset()
        lookup = {self.slug_field: data, "account": project.account}
        # Not get_or_create: installation_id isn't unique and prod has duplicates, reuse the oldest one.
        device = queryset.filter(**lookup).order_by("id").first()
        if device is None:
            device = queryset.create(**lookup)
            if user.is_authenticated:
                DeviceOwnership.objects.create(device=device, project=project, user=user)
        device.projects.add(project)
        return device
