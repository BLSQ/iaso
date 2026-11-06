import jsonpatch

from django.core.exceptions import ImproperlyConfigured
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from hat.audit.models import Modification
from iaso.api.common import ModelSerializer
from iaso.api.common.serializer import JsonPatchOperationSerializer
from iaso.utils.pii import filter_serialized_instance_values, filter_submission_files, get_allowed_fields


class InstanceModificationSerializer(ModelSerializer):
    files = serializers.SerializerMethodField()
    possible_fields = serializers.SerializerMethodField()
    form_descriptor = serializers.SerializerMethodField()
    content_type = serializers.CharField(read_only=True, source="content_type.name")
    diff = serializers.SerializerMethodField()

    class Meta:
        model = Modification
        fields = [
            "created_at",
            "content_type",
            "object_id",
            "diff",
            "past_value",
            "new_value",
            "files",
            "possible_fields",
            "form_descriptor",
        ]
        read_only_fields = [
            "created_at",
            "content_type",
            "object_id",
            "diff",
            "past_value",
            "new_value",
            "files",
            "possible_fields",
            "form_descriptor",
        ]

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
            files = {instance_file.name: instance_file.file.url for instance_file in instance.active_files}
            request = self.context.get("request")
            if get_allowed_fields(instance.form, request.user if request else None) is not None:
                # attachments can't be matched to snapshots here, only keep the ones of the current visible answers
                visible_urls = set(
                    filter_submission_files(
                        list(files.values()),
                        filter_serialized_instance_values(
                            [{"fields": {"json": instance.json}}], instance.form, request.user
                        )[0]["fields"]["json"],
                    )
                )
                files = {name: url for name, url in files.items() if url in visible_urls}
            self.context[cache_key] = {
                "files": files,
                "possible_fields": (
                    form_version.possible_fields if form_version and form_version.possible_fields else []
                ),
                "form_descriptor": form_version.form_descriptor if form_version else None,
            }
        return self.context[cache_key]

    def _values(self, obj):
        """Snapshots without the personal data the current user can't see."""
        request = self.context.get("request")
        user = request.user if request else None
        return (
            filter_serialized_instance_values(obj.past_value, self.context["instance"].form, user),
            filter_serialized_instance_values(obj.new_value, self.context["instance"].form, user),
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["past_value"], data["new_value"] = self._values(instance)
        return data

    @extend_schema_field(JsonPatchOperationSerializer(many=True, allow_empty=True, read_only=True))
    def get_diff(self, obj):
        past_values, new_values = self._values(obj)
        past_value = past_values[0].get("fields", None) if past_values else None
        new_value = new_values[0].get("fields", None) if new_values else None
        return jsonpatch.JsonPatch.from_diff(past_value, new_value).patch

    @extend_schema_field(serializers.DictField(child=serializers.URLField(), allow_empty=True, read_only=True))
    def get_files(self, obj):
        return self._get_instance_data()["files"]

    @extend_schema_field(serializers.ListField(child=serializers.JSONField(), allow_empty=True, read_only=True))
    def get_possible_fields(self, obj):
        return self._get_instance_data()["possible_fields"]

    @extend_schema_field(serializers.JSONField(allow_null=True, read_only=True))
    def get_form_descriptor(self, obj):
        return self._get_instance_data()["form_descriptor"]
