import typing

from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, serializers

import iaso.models as m

from dynamic_fields.filter_backends import DynamicFieldsFilterBackendBackwardCompatible
from dynamic_fields.serializer import DynamicFieldsModelSerializerBackwardCompatible
from hat.audit.models import MAPPING_VERSION_API, log_modification, serialize_instance
from iaso.models import MappingVersion
from iaso.permissions.core_permissions import CORE_MAPPINGS_PERMISSION

from .common import HasPermission, ModelViewSet, TimestampField


def get_question_mapping_shape_error(mapping_type, data_element):
    """The shape a question mapping must have for the exporters of its mapping type, or None if it is valid.

    The id and valueType of plain data element mappings are checked separately."""
    if isinstance(data_element, dict) and data_element.get("type") == MappingVersion.QUESTION_MAPPING_NEVER_MAPPED:
        return None

    if mapping_type == m.EVENT_TRACKER:
        if not isinstance(data_element, list) or not data_element:
            return "should be a list for EVENT_TRACKER mappings"
        for item in data_element:
            if not isinstance(item, dict):
                return "should only contain objects"
            is_data_element = isinstance(item.get("dataElement"), dict) and item["dataElement"].get("id")
            is_attribute = isinstance(item.get("trackedEntityAttribute"), dict) and item["trackedEntityAttribute"].get(
                "id"
            )
            is_repeat_group = item.get("type") == "repeat" and item.get("program_id")
            if not (is_data_element or is_attribute or is_repeat_group):
                return "should map a data element, a tracked entity attribute or a repeat group"
        return None

    if not isinstance(data_element, dict):
        return f"should not be a list for {mapping_type} mappings"
    if data_element.get("type") == MappingVersion.QUESTION_MAPPING_MULTIPLE:
        values = data_element.get("values")
        if not isinstance(values, dict) or not all(isinstance(v, dict) and v.get("id") for v in values.values()):
            return "should map each choice to a data element id"
    return None


def is_unmap(data_element):
    return isinstance(data_element, dict) and data_element.get("action") == "unmap"


def get_question_mapping_error(question_name, data_element, mapping_type, mappable_questions):
    """Why a question mapping of a PATCH can't be saved, or None if it is valid."""
    # unmapping stays allowed, to clean up mappings of questions removed from the form
    if is_unmap(data_element):
        return None

    if mappable_questions and question_name not in mappable_questions:
        return "question does not exist in this form version"

    if data_element is None:
        return None

    shape_error = get_question_mapping_shape_error(mapping_type, data_element)
    if shape_error:
        return shape_error

    if (
        isinstance(data_element, dict)
        and data_element
        and data_element.get("type")
        not in (MappingVersion.QUESTION_MAPPING_MULTIPLE, MappingVersion.QUESTION_MAPPING_NEVER_MAPPED)
    ):
        if data_element.get("id") is None:
            return "should have a least an data element id"
        if data_element.get("valueType") is None:
            return "should have a valueType"
    return None


class MappingVersionSerializer(DynamicFieldsModelSerializerBackwardCompatible):
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
        # serialized before any change: question mappings are edited in place in instance.json
        past_value = serialize_instance(instance)

        # partial update only question mappings
        if "question_mappings" in validated_data:
            question_mappings = validated_data["question_mappings"]
            # empty when the form version has no descriptor: nothing to check against
            mappable_questions = instance.form_version.mappable_questions_by_name()

            # validate every question mapping first, to report all the errors of an import at once
            errors = {}
            for question_name, data_element in question_mappings.items():
                error = get_question_mapping_error(
                    question_name, data_element, instance.mapping.mapping_type, mappable_questions
                )
                if error:
                    errors["question_mappings." + question_name] = error
            if errors:
                raise serializers.ValidationError(errors)

            for question_name, data_element in question_mappings.items():
                if is_unmap(data_element):
                    instance.json["question_mappings"].pop(question_name, None)
                else:
                    instance.json["question_mappings"][question_name] = data_element

        if "event_date_source" in validated_data:
            instance.json["event_date_source"] = validated_data["event_date_source"]

        instance.save()
        log_modification(past_value, instance, source=MAPPING_VERSION_API, user=self.context["request"].user)

        return instance


@extend_schema(tags=["Mapping versions"])
class MappingVersionsViewSet(ModelViewSet):
    f"""Mapping versions API

    This API is restricted to authenticated users having the "{CORE_MAPPINGS_PERMISSION}" permission

    GET /api/mappingversions/
        order
        projectsIds orgUnitTypeIds (comma seperated ids)
        mappingTypes
        formId form_id (comma seperated ids)
    GET /api/mappingversions/<id>
    POST /api/mappingversions/
    PATCH /api/mappingversions/<id>
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission(CORE_MAPPINGS_PERMISSION)]  # type: ignore
    serializer_class = MappingVersionSerializer
    filter_backends = [DjangoFilterBackend, DynamicFieldsFilterBackendBackwardCompatible]
    results_key = "mapping_versions"
    queryset = MappingVersion.objects.all()
    http_method_names = ["get", "post", "patch", "head", "options", "trace"]

    def get_queryset(self):
        orders = self.request.GET.get(
            "order", "form_version__form__name,form_version__version_id,mapping__mapping_type"
        ).split(",")

        queryset = MappingVersion.objects.filter_for_user(self.request.user)

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
