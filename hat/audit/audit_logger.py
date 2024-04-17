from hat.audit.models import Modification
from rest_framework import serializers


class AuditLogger:
    """Logger class to help manually save Audit log, for cases when `AuditMixin` cannot be used or doesn't provide enough flexibility"""

    serializer: serializers.ModelSerializer
    default_source: str

    def serialize_instance(self, instance):
        "Serialize instance for audit"
        return [self.serializer(instance).data]

    def log_modification(self, instance, old_data_dump, request_user, source=None):
        source = source if source else self.default_source
        if not old_data_dump:
            old_data_dump = []
        Modification.objects.create(
            user=request_user,
            past_value=old_data_dump,
            new_value=self.serialize_instance(instance),
            content_object=instance,
            source=source,
        )
