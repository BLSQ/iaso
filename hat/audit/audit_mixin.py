from hat.audit.models import Modification
from rest_framework import serializers


class AuditMixin:
    audit_serializer: serializers.ModelSerializer

    def perform_create(self, serializer):
        # noinspection PyUnresolvedReferences
        super().perform_create(serializer)
        instance = serializer.instance

        serialized = [self.audit_serializer(instance).data]
        Modification.objects.create(
            user=self.request.user,
            past_value=[],
            new_value=serialized,
            content_object=instance,
            source="API " + self.request.method + self.request.path,
        )

    def perform_update(self, serializer):
        instance = serializer.instance
        old_value = [self.audit_serializer(instance).data]
        # noinspection PyUnresolvedReferences
        super().perform_update(serializer)
        instance = serializer.instance
        new_value = [self.audit_serializer(instance).data]
        Modification.objects.create(
            user=self.request.user,
            past_value=old_value,
            new_value=new_value,
            content_object=instance,
            source="API " + self.request.method + self.request.path,
        )

    def perform_destroy(self, instance):
        old_value = [self.audit_serializer(instance).data]
        # noinspection PyUnresolvedReferences
        super().perform_destroy(instance)
        # for soft delete, we still have an existing instance
        new_value = [self.audit_serializer(instance).data]
        Modification.objects.create(
            user=self.request.user,
            past_value=old_value,
            new_value=new_value,
            content_object=instance,
            source=f"API {self.request.method} {self.request.path}",
        )
