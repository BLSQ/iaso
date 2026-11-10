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
        device, created = queryset.get_or_create(
            **{
                self.slug_field: data,
                "account": project.account,
            }
        )
        if created and user.is_authenticated:
            device.projects.set([project])
            DeviceOwnership.objects.create(
                device=device,
                project=project,
                user=user,
            )
        return device
