import jsonpatch

from django.core.exceptions import ImproperlyConfigured
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from hat.audit.models import Modification
from iaso.api.common import ModelSerializer
from iaso.api.common.serializer import JsonPatchOperationSerializer


class ModificationSerializer(ModelSerializer):
    content_type = serializers.CharField(read_only=True, source="content_type.name")
    diff = serializers.SerializerMethodField()

    class Meta:
        model = Modification
        fields = ["created_at", "content_type", "object_id", "diff", "past_value", "new_value"]

    @extend_schema_field(JsonPatchOperationSerializer(many=True, allow_empty=True))
    def get_diff(self, obj):
        return jsonpatch.JsonPatch.from_diff(obj.past_value[0]["fields"], obj.new_value[0]["fields"]).patch


class InstanceModificationSerializer(ModificationSerializer):
    INSTANCE_SELECT_RELATED = ("form_version",)
    INSTANCE_PREFETCH_RELATED = ("instancefile_set",)

    files = serializers.SerializerMethodField()
    possible_fields = serializers.SerializerMethodField()
    form_descriptor = serializers.SerializerMethodField()

    class Meta(ModificationSerializer.Meta):
        fields = [*ModificationSerializer.Meta.fields, "files", "possible_fields", "form_descriptor"]

    @classmethod
    def instance_queryset(cls, queryset):
        return queryset.select_related(*cls.INSTANCE_SELECT_RELATED).prefetch_related(*cls.INSTANCE_PREFETCH_RELATED)

    def _get_instance_data(self):
        # files, possible_fields and form_descriptor depend on the Instance, not on each
        # Modification. When this serializer runs with many=True, DRF calls each
        # SerializerMethodField once per row, which would otherwise rebuild the same
        # dict three times per modification. Cache the result on self.context so it is
        # computed once per HTTP request regardless of page size.
        # The view must pass a prefetched instance (see instance_queryset) so the
        # initial build does not trigger N+1 queries on form_version or instancefile_set.
        cache_key = "_instance_modification_data"
        if cache_key not in self.context:
            instance = self.context.get("instance")
            if instance is None:
                raise ImproperlyConfigured(
                    "InstanceModificationSerializer requires an 'instance' key in the serializer context."
                )
            form_version = instance.form_version
            self.context[cache_key] = {
                "files": {
                    instance_file.name: instance_file.file.url for instance_file in instance.instancefile_set.all()
                },
                "possible_fields": (
                    form_version.possible_fields if form_version and form_version.possible_fields else []
                ),
                "form_descriptor": form_version.form_descriptor if form_version else None,
            }
        return self.context[cache_key]

    @extend_schema_field(serializers.DictField(child=serializers.URLField()))
    def get_files(self, obj):
        return self._get_instance_data()["files"]

    @extend_schema_field(serializers.ListField(child=serializers.JSONField()))
    def get_possible_fields(self, obj):
        return self._get_instance_data()["possible_fields"]

    @extend_schema_field(serializers.JSONField())
    def get_form_descriptor(self, obj):
        return self._get_instance_data()["form_descriptor"]
