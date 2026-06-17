from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers


class ModuleListSerializer(serializers.Serializer):
    name = serializers.CharField()
    codename = serializers.CharField()
    is_activated_for_user = serializers.SerializerMethodField()

    class Meta:
        fields = ["name", "codename", "is_activated_for_user"]

    @extend_schema_field(serializers.BooleanField)
    def get_is_activated_for_user(self, obj):
        user = getattr(self.context.get("request", None), "user", None)
        iaso_profile = getattr(user, "iaso_profile", None)
        if iaso_profile:
            return obj.codename in iaso_profile.account.modules
        return False
