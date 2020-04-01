import typing
from django.db import transaction
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers, permissions, parsers
from rest_framework.authentication import BasicAuthentication
import iaso.models as m

from iaso.models import Form, FormVersion, Mapping, MappingVersion
from iaso.odk import parsing
from .common import ModelViewSet, TimestampField, DynamicFieldsModelSerializer
from .auth.authentication import CsrfExemptSessionAuthentication
from .forms import HasFormPermission


class MappingVersionSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = MappingVersion
        default_fields = ["id", "form_version", "mapping"]
        fields = ["id", "form_version", "mapping", "dataset", "question_mappings"]
        read_only_fields = ["id", "form_version"]

    question_mappings = serializers.SerializerMethodField()
    form_version = serializers.SerializerMethodField()
    mapping = serializers.SerializerMethodField()
    dataset = serializers.SerializerMethodField()

    def get_question_mappings(self, mapping_version):
        return mapping_version.json.get("question_mappings", {})

    def get_mapping(self, mapping_version):
        m = mapping_version.mapping
        return {
            "mapping_type": m.mapping_type,
            "data_source": {"id": m.data_source.id, "name": m.data_source.name},
        }

    def get_form_version(self, mapping_version):
        v = mapping_version.form_version
        return {
            "id": v.id,
            "form": {"id": v.form.id, "name": v.form.name},
            "version_id": v.version_id,
        }

    def get_dataset(self, mapping_version):
        return {
            "id": mapping_version.json.get("data_set_id", None),
            "name": mapping_version.json.get("data_set_name", None),
        }

    # {'formversion': {'id': 638}, 'mapping': {'type': 'AGGREGATE', 'datasource': {'id': 710}}}
    def validate(self, _unuseddata: typing.MutableMapping):
        data = self.context["request"].data
        if self.context["request"].method == "POST":
            return self.validate_create(data)
        else:
            return data

    def validate_create(self, data):
        profile = self.context["request"].user.iaso_profile

        form_version = None
        try:
            form_version = m.FormVersion.objects.filter(
                form__projects__account=profile.account
            ).get(pk=data["form_version"]["id"])
        except ObjectDoesNotExist:
            raise serializers.ValidationError({"form_version": "object doesn't exist"})

        datasource = None
        try:
            datasource = m.DataSource.objects.filter(
                projects__account=profile.account
            ).get(pk=data["mapping"]["datasource"]["id"])
        except ObjectDoesNotExist:
            raise serializers.ValidationError(
                {"mapping.datasource": "object doesn't exist"}
            )

        mapping_type = data["mapping"]["type"]

        return {
            "form_version": form_version,
            "datasource": datasource,
            "mapping_type": mapping_type,
        }

    def create(self, validated_data: typing.MutableMapping):
        form_version = validated_data["form_version"]
        datasource = validated_data["datasource"]
        mapping_type = validated_data["mapping_type"]
        mapping, created = m.Mapping.objects.get_or_create(
            form=form_version.form, data_source=datasource, mapping_type=mapping_type
        )

        mapping_version = m.MappingVersion.objects.create(
            mapping=mapping, form_version=form_version, json={"question_mappings": {}}
        )
        return mapping_version

    def update(self, instance, validated_data):
        # partial update only question mappings
        for question_name, dataelement in validated_data["question_mappings"].items():
            instance.json["question_mappings"][question_name] = dataelement

        instance.save()
        return instance


class MappingVersionsViewSet(ModelViewSet):
    """Mapping versions API: /api/mappingversions/"""

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = MappingVersionSerializer
    results_key = "mapping_versions"
    queryset = MappingVersion.objects.all()
    http_method_names = ("get", "post", "patch")

    def get_queryset(self):
        profile = self.request.user.iaso_profile
        return MappingVersion.objects.filter(
            form_version_id__in=FormVersion.objects.filter(
                form__projects__account=profile.account
            )
        )
