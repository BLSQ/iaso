import typing

from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q
from rest_framework import permissions, serializers

import iaso.models as m
import iaso.permissions as core_permissions

from iaso.models import FormVersion, MappingVersion

from .common import DynamicFieldsModelSerializer, HasPermission, ModelViewSet, TimestampField


class MappingVersionSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = MappingVersion
        default_fields = [
            "id",
            "form_version",
            "mapping",
            "total_questions",
            "mapped_questions",
            "created_at",
            "updated_at",
        ]
        fields = [
            "id",
            "form_version",
            "mapping",
            "dataset",
            "question_mappings",
            "total_questions",
            "mapped_questions",
            "derivate_settings",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "form_version", "mapped_questions", "created_at", "updated_at"]

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    question_mappings = serializers.SerializerMethodField()
    form_version = serializers.SerializerMethodField()
    mapping = serializers.SerializerMethodField()
    dataset = serializers.SerializerMethodField()
    mapped_questions = serializers.SerializerMethodField()
    total_questions = serializers.SerializerMethodField()
    derivate_settings = serializers.SerializerMethodField()

    def get_derivate_settings(self, mapping_version):
        return mapping_version.json

    def get_mapped_questions(self, mapping_version):
        return len(mapping_version.json.get("question_mappings", {}))

    def get_total_questions(self, mapping_version):
        questions_by_name = mapping_version.form_version.questions_by_name()
        return len(questions_by_name)

    def get_question_mappings(self, mapping_version):
        return mapping_version.json.get("question_mappings", {})

    def get_mapping(self, mapping_version):
        m = mapping_version.mapping
        return {"mapping_type": m.mapping_type, "data_source": {"id": m.data_source.id, "name": m.data_source.name}}

    def get_form_version(self, mapping_version):
        v = mapping_version.form_version
        return {
            "id": v.id,
            "form": {"id": v.form.id, "name": v.form.name, "periodType": v.form.period_type},
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
        return data

    def validate_create(self, data):
        profile = self.context["request"].user.iaso_profile

        try:
            form_version = (
                m.FormVersion.objects.filter(form__projects__account=profile.account)
                .distinct()
                .get(pk=data["form_version"]["id"])
            )
        except ObjectDoesNotExist:
            raise serializers.ValidationError({"form_version": "object doesn't exist"})

        try:
            datasource = (
                m.DataSource.objects.filter(projects__account=profile.account)
                .distinct()
                .get(pk=data["mapping"]["datasource"]["id"])
            )
        except ObjectDoesNotExist:
            raise serializers.ValidationError({"mapping.datasource": "object doesn't exist"})

        mapping_type = data["mapping"]["type"]

        validated_data = {"form_version": form_version, "datasource": datasource, "mapping_type": mapping_type}
        validated_data["json"] = {"question_mappings": {}}

        if mapping_type == "AGGREGATE":
            validated_data["json"]["data_set_id"] = data["dataset"]["id"]
            validated_data["json"]["data_set_name"] = data["dataset"]["name"]
        else:
            validated_data["json"]["program_id"] = data["program"]["id"]
            validated_data["json"]["program_name"] = data["program"]["name"]

        return validated_data

    def create(self, validated_data: typing.MutableMapping):
        form_version = validated_data["form_version"]
        datasource = validated_data["datasource"]
        mapping_type = validated_data["mapping_type"]

        mapping, created = m.Mapping.objects.get_or_create(
            form=form_version.form, data_source=datasource, mapping_type=mapping_type
        )

        existing_mapping_version = m.MappingVersion.objects.filter(mapping=mapping, form_version=form_version).first()
        if existing_mapping_version:
            # be idempotent return existing
            return existing_mapping_version
        return m.MappingVersion.objects.create(mapping=mapping, form_version=form_version, json=validated_data["json"])

    def update(self, instance, validated_data):
        # partial update only question mappings
        if "question_mappings" in validated_data:
            for question_name, data_element in validated_data["question_mappings"].items():
                path = "question_mappings." + question_name

                if type(data_element) is list:
                    instance.json["question_mappings"][question_name] = data_element
                else:
                    if data_element and data_element.get("action") == "unmap":
                        instance.json["question_mappings"].pop(question_name, None)
                        continue

                    if data_element and data_element.get("type") not in (
                        MappingVersion.QUESTION_MAPPING_MULTIPLE,
                        MappingVersion.QUESTION_MAPPING_NEVER_MAPPED,
                    ):
                        if data_element.get("id") is None:
                            raise serializers.ValidationError({path: "should have a least an data element id"})

                        if data_element.get("valueType") is None:
                            raise serializers.ValidationError({path: "should have a valueType"})

                instance.json["question_mappings"][question_name] = data_element

        if "event_date_source" in validated_data:
            instance.json["event_date_source"] = validated_data["event_date_source"]

        instance.save()

        return instance


class MappingVersionsViewSet(ModelViewSet):
    f"""Mapping versions API

    This API is restricted to authenticated users having the "{core_permissions.MAPPINGS}" permission

    GET /api/mappingversions/
        order
        projectsIds orgUnitTypeIds (comma seperated ids)
        mappingTypes
        formId form_id (comma seperated ids)
    GET /api/mappingversions/<id>
    POST /api/mappingversions/
    PATCH /api/mappingversions/<id>
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission(core_permissions.MAPPINGS)]  # type: ignore
    serializer_class = MappingVersionSerializer
    results_key = "mapping_versions"
    queryset = MappingVersion.objects.all()
    http_method_names = ["get", "post", "patch", "head", "options", "trace"]

    def get_queryset(self):
        orders = self.request.GET.get(
            "order", "form_version__form__name,form_version__version_id,mapping__mapping_type"
        ).split(",")

        profile = self.request.user.iaso_profile
        queryset = MappingVersion.objects.filter(
            form_version_id__in=FormVersion.objects.filter(form__projects__account=profile.account)
        )

        search_term = self.request.GET.get("search") or self.request.GET.get("search")
        if search_term:
            queryset = queryset.filter(
                Q(form_version__version_id__icontains=search_term) | Q(mapping__form__name__icontains=search_term)
            )

        # keep backward compatibiliy with previous api form_id and formId
        form_id = self.request.GET.get("form_id") or self.request.GET.get("formId")
        if form_id:
            form_ids = str(form_id).split(",")
            # todo fix client to not send undefined
            form_ids = [id for id in form_ids if id != "undefined"]
            if len(form_ids) > 0:
                queryset = queryset.filter(form_version__form_id__in=form_ids)

        mapping_types = self.request.GET.get("mappingTypes")

        if mapping_types:
            queryset = queryset.filter(mapping__mapping_type__in=mapping_types.split(","))

        org_unit_type_ids = self.request.query_params.get("orgUnitTypeIds")
        if org_unit_type_ids:
            queryset = queryset.filter(mapping__form__org_unit_types__id__in=org_unit_type_ids.split(","))

        projects_ids = self.request.query_params.get("projectsIds")
        if projects_ids:
            queryset = queryset.filter(mapping__form__projects__id__in=projects_ids.split(","))

        queryset = queryset.order_by(*orders)

        return queryset
