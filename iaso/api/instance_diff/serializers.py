import jsonpatch

from rest_framework import serializers

from hat.audit.models import Modification
from iaso.api.common import ModelSerializer


class ModificationSerializer(ModelSerializer):
    content_type = serializers.CharField(read_only=True, source="content_type.name")
    diff = serializers.SerializerMethodField()

    class Meta:
        model = Modification
        fields = ["created_at", "content_type", "object_id", "diff"]

    def get_diff(self, obj):
        return jsonpatch.JsonPatch.from_diff(obj.past_value[0]["fields"], obj.new_value[0]["fields"]).patch
