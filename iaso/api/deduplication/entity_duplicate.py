import math
import xml.etree.ElementTree as ET

from copy import copy, deepcopy
from logging import getLogger
from typing import Dict, Optional
from uuid import UUID, uuid4

from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.db.models import Q
from django.http import JsonResponse
from django.utils.text import slugify
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions, serializers, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

import iaso.api.deduplication.filters as dedup_filters  # type: ignore
import iaso.models.base as base
import iaso.permissions as core_permissions

from hat.audit.models import ENTITY_DUPLICATE_MERGE, log_modification
from iaso.api.common import HasPermission, ModelViewSet
from iaso.api.workflows.serializers import find_question_by_name
from iaso.models import Entity, EntityDuplicate, EntityDuplicateAnalyzis, EntityType, Form, Instance
from iaso.models.deduplication import ValidationStatus  # type: ignore
from iaso.utils.emoji import fix_emoji


logger = getLogger(__name__)


class EntityDuplicateNestedFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = Form
        fields = ["id", "name"]


class EntityDuplicateNestedEntityTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityType
        fields = ["id", "name"]


class EntityDuplicatedNestedOrgunitSerializer(serializers.ModelSerializer):
    class Meta:
        model = base.OrgUnit
        fields = ["id", "name"]


class EntityDuplicatedNestedEntitySerializer(serializers.ModelSerializer):
    org_unit = EntityDuplicatedNestedOrgunitSerializer(source="attributes.org_unit")
    json = serializers.DictField(source="attributes.json")

    class Meta:
        model = Entity
        fields = ["id", "created_at", "updated_at", "org_unit", "json"]


class EntityDuplicateNestedAnalyzisSerializer(serializers.ModelSerializer):
    analyze_id = serializers.IntegerField(source="id")
    type = serializers.CharField(source="algorithm")
    the_fields = serializers.SerializerMethodField()

    def get_the_fields(self, obj):
        return obj.metadata["fields"]

    class Meta:
        model = EntityDuplicateAnalyzis
        fields = ["analyze_id", "created_at", "finished_at", "the_fields", "type"]


# credit https://stackoverflow.com/questions/53847404/how-to-check-uuid-validity-in-python
def is_UUID(value, version=4):
    if isinstance(value, str):
        return False
    try:
        uuid_obj = UUID(value, version=version)
    except ValueError:
        return False
    return str(uuid_obj) == value


class EntityDuplicateSerializer(serializers.ModelSerializer):
    entity_type = EntityDuplicateNestedEntityTypeSerializer(source="entity1.entity_type")
    form = EntityDuplicateNestedFormSerializer(source="entity1.entity_type.reference_form")
    the_fields = serializers.SerializerMethodField()
    entity1 = EntityDuplicatedNestedEntitySerializer()
    entity2 = EntityDuplicatedNestedEntitySerializer()
    analyzis = serializers.SerializerMethodField()
    similarity = serializers.SerializerMethodField()
    similarity_star = serializers.SerializerMethodField()
    ignored = serializers.SerializerMethodField()
    ignored_reason = serializers.SerializerMethodField()
    merged = serializers.SerializerMethodField()

    def get_analyzis(self, obj):
        return [EntityDuplicateNestedAnalyzisSerializer(obj.analyze).data]

    def get_ignored(self, obj):
        return obj.validation_status == ValidationStatus.IGNORED

    def get_merged(self, obj):
        return obj.validation_status == ValidationStatus.VALIDATED

    def get_ignored_reason(self, obj):
        if "ignored_reason" in obj.metadata:
            return obj.metadata["ignored_reason"]
        return ""

    def get_similarity(self, obj):
        return obj.similarity_score

    def get_similarity_star(self, obj):
        return math.floor(obj.similarity_score / 20.0)

    def get_the_fields(self, obj):
        the_fields = obj.analyze.metadata["fields"]

        ret_val = []
        etype = obj.entity1.entity_type
        ref_form = etype.reference_form
        possible_fields = ref_form.possible_fields

        for f in the_fields:
            the_q = find_question_by_name(f, possible_fields)
            if the_q is not None:
                ret_val.append({"field": the_q["name"], "label": the_q["label"], "type": the_q["type"]})

        return ret_val

    class Meta:
        model = EntityDuplicate
        fields = [
            "id",
            "entity_type",
            "form",
            "the_fields",
            "entity1",
            "entity2",
            "analyzis",
            "similarity",
            "similarity_star",
            "ignored",
            "ignored_reason",
            "merged",
        ]


class EntityDuplicatePostAnswerSerializer(serializers.Serializer):
    entity1_id = serializers.IntegerField(required=True)
    entity2_id = serializers.IntegerField(required=True)
    new_entity_id = serializers.IntegerField(required=False)
    ignored = serializers.BooleanField(required=False, default=False)


def merge_attributes(e1: Entity, e2: Entity, new_entity_uuid: UUID, merge_def: Dict):
    new_uuid = uuid4()
    att1: Optional[Instance] = e1.attributes
    att2: Optional[Instance] = e2.attributes

    if att1 is None or att2 is None or att1.form is None or att2.form is None:
        raise Exception("One of the entities has no attributes")

    lookup = {e1.pk: att1, e2.pk: att2}

    root = _xmlfile_to_element(att1.file)

    for field_name, e_id in merge_def.items():
        the_val = lookup[e_id].json[field_name]
        try:
            the_field = root.find(".//" + field_name)
            if the_field is not None:
                the_field.text = the_val
        except Exception as e:
            logger.exception("Error updating xml field %s: %s", field_name, e)

    entity_uuid = root.find("entityUuid")
    if entity_uuid is not None:
        entity_uuid.text = str(new_entity_uuid)

    meta_instance_id = root.find("meta/instanceID")
    if meta_instance_id is not None:
        meta_instance_id.text = "uuid:" + str(new_uuid)

    new_xml_string = ET.tostring(root, encoding="utf-8", xml_declaration=False)
    new_xml_content = ContentFile(new_xml_string)  # .decode("utf-8")

    new_file_name = f"{slugify(att1.form.name)}_{new_uuid}_merged_{e1.pk}-{e2.pk}.xml"  # type: ignore
    new_attributes = deepcopy(att1)
    new_attributes.uuid = new_uuid  # type: ignore
    new_attributes.entity_id = None
    new_attributes.file_name = new_file_name
    new_attributes.pk = None
    new_attributes.json = None
    new_attributes.file.save(new_file_name, new_xml_content, save=True)  # saves the model here
    new_attributes.get_and_save_json_of_xml()

    return new_attributes


def copy_instance(inst: Instance, new_entity: Entity):
    new_uuid = uuid4()
    new_inst = deepcopy(inst)

    if inst.form is None:
        raise Exception("Instance has no form")

    root = _xmlfile_to_element(inst.file)

    entity_uuid = root.find("entityUuid")
    if entity_uuid is not None:
        entity_uuid.text = str(new_entity.uuid)

    meta_instance_id = root.find("meta/instanceID")
    if meta_instance_id is not None:
        meta_instance_id.text = "uuid:" + str(new_uuid)

    new_xml_string = ET.tostring(root, encoding="utf-8", xml_declaration=False)
    new_xml_content = ContentFile(new_xml_string.decode("utf-8"))

    new_inst.pk = None
    new_inst.entity = new_entity
    new_inst.uuid = new_uuid  # type: ignore
    new_inst.json = None
    new_inst.file_name = f"{slugify(inst.form.name)}_{new_uuid}.xml"
    new_inst.file.save(new_inst.file_name, new_xml_content, save=True)
    new_inst.get_and_save_json_of_xml()
    return new_inst


def _xmlfile_to_element(file):
    """
    Read XML file, sanitize content to support emoji, and return a parsed Element
    (xml.etree.ElementTree.Element)
    """
    raw_content = file.read().decode("utf-8")
    fixed_content = fix_emoji(raw_content).decode("utf-8")

    return ET.fromstring(fixed_content)


def merge_entities(e1: Entity, e2: Entity, merge_def: Dict, current_user: User):
    new_entity_uuid = uuid4()
    new_attributes = merge_attributes(e1, e2, new_entity_uuid, merge_def)

    new_entity = Entity.objects.create(
        name=e1.name,
        entity_type=e1.entity_type,
        account=e1.account,
        attributes=new_attributes,
        uuid=new_entity_uuid,
    )

    new_entity.save()
    new_attributes.entity = new_entity
    new_attributes.save()

    for inst in e1.instances.exclude(id=e1.attributes_id):
        copy_instance(inst, new_entity)

    for inst in e2.instances.exclude(id=e2.attributes_id):
        copy_instance(inst, new_entity)

    instances_to_soft_delete = [
        e1.attributes,
        e2.attributes,
        *e1.instances.all(),
        *e2.instances.all(),
    ]
    for inst in set(instances_to_soft_delete):  # use set() to remove duplicates
        original = copy(inst)
        inst.soft_delete()
        log_modification(original, inst, ENTITY_DUPLICATE_MERGE, user=current_user)

    e1.merged_to = new_entity
    e1.save()
    e2.merged_to = new_entity
    e2.save()

    e1.delete()
    e2.delete()

    return new_entity


class EntityDuplicatePostSerializer(serializers.Serializer):
    entity1_id = serializers.IntegerField(required=True)
    entity2_id = serializers.IntegerField(required=True)
    merge = serializers.DictField(child=serializers.IntegerField(), required=False)
    ignore = serializers.BooleanField(required=False, default=False)
    reason = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, data):
        if data["entity1_id"] == data["entity2_id"]:
            raise serializers.ValidationError("Entities 1 and 2 must be different")

        try:
            entity1 = Entity.objects.get(pk=data["entity1_id"])
        except Entity.DoesNotExist:
            logger.exception(f"Entity merge failed: entity 1 does not exist: {data}")
            raise serializers.ValidationError("Entity 1 does not exist")

        try:
            entity2 = Entity.objects.get(pk=data["entity2_id"])
        except Entity.DoesNotExist:
            logger.exception(f"Entity merge failed: entity 2 does not exist: {data}")
            raise serializers.ValidationError("Entity 2 does not exist")

        if entity1.entity_type != entity2.entity_type:
            logger.exception(f"Entity merge failed: Entities must be of the same type: {data}")
            raise serializers.ValidationError("Entities must be of the same type")

        if data["ignore"] == False:  # merge the duplicates
            etype = entity1.entity_type
            ref_form = etype.reference_form
            possible_fields = ref_form.possible_fields

            for kk, vv in data["merge"].items():
                if vv != data["entity1_id"] and vv != data["entity2_id"]:
                    raise serializers.ValidationError("The merge must be done with one of the two entities")

                the_q = find_question_by_name(kk, possible_fields)

                if the_q is None:
                    raise serializers.ValidationError(f"Question {kk} does not exist in the reference form")

        return {
            "entity1": entity1,
            "entity2": entity2,
            "merge": data.get("merge", None),
            "ignore": data.get("ignore", False),
            "reason": data.get("reason", ""),
        }

    def create(self, validated_data):
        ed = EntityDuplicate.objects.get(entity1=validated_data["entity1"], entity2=validated_data["entity2"])

        if ed.validation_status != ValidationStatus.PENDING:
            raise serializers.ValidationError("This duplicate has already been validated or ignored")

        if validated_data["ignore"]:
            ed.validation_status = ValidationStatus.IGNORED
            ed.metadata["ignored_reason"] = validated_data["reason"]
            ed.save()

            return {
                "ignored": True,
                "entity1_id": validated_data["entity1"].pk,
                "entity2_id": validated_data["entity2"].pk,
            }
        # Actualy merge the entities
        e1 = validated_data["entity1"]
        e2 = validated_data["entity2"]

        current_user = self.context.get("request").user
        new_entity = merge_entities(e1, e2, validated_data["merge"], current_user)

        # Leave audit trail from both entity reference forms to the new merged one
        log_modification(
            e1.attributes,
            new_entity.attributes,
            ENTITY_DUPLICATE_MERGE,
            user=current_user,
        )
        log_modification(
            e2.attributes,
            new_entity.attributes,
            ENTITY_DUPLICATE_MERGE,
            user=current_user,
        )

        # needs to add the id of the new entity as metadata to the entity duplicate
        ed.metadata["new_entity_id"] = new_entity.pk
        ed.validation_status = ValidationStatus.VALIDATED
        ed.save()

        return {
            "new_entity_id": new_entity.pk,
            "entity1_id": validated_data["entity1"].pk,
            "entity2_id": validated_data["entity2"].pk,
        }


duplicate_detail_entities_param = openapi.Parameter(
    name="entities",
    in_=openapi.IN_QUERY,
    description="Comma separeted list of 2 entities ids to to retrieve the duplicate about",
    type=openapi.TYPE_STRING,
    required=True,
)


class EntityDuplicateViewSet(ModelViewSet):
    """
    Entity Duplicates API.

    - `GET /api/entityduplicates/` retrieve potentially duplicated entities
    - `GET /api/entityduplicates/<pk>/` retrieve details about a potential duplicate
    - `POST /api/entityduplicates/` merge duplicate entities or ignore the match
    """

    filter_backends = [
        dedup_filters.EntitiesFilterBackend,
        dedup_filters.IgnoredMergedFilterBackend,
        dedup_filters.SubmitterFilterBackend,
        dedup_filters.SubmitterTeamFilterBackend,
        dedup_filters.EntityIdFilterBackend,
        dedup_filters.EntitySearchFilterBackend,
        dedup_filters.AlgorithmFilterBackend,
        dedup_filters.EntityTypeFilterBackend,
        dedup_filters.SimilarityFilterBackend,
        dedup_filters.FormFilterBackend,
        dedup_filters.OrgUnitFilterBackend,
        dedup_filters.StartEndDateFilterBackend,
        dedup_filters.CustomOrderingFilter,
        DjangoFilterBackend,
    ]

    model = EntityDuplicate
    ordering_fields = ["created_at", "similarity_score", "id", "similarity_star"]
    permission_classes = [permissions.IsAuthenticated, HasPermission(core_permissions.ENTITIES_DUPLICATE_READ)]
    serializer_class = EntityDuplicateSerializer

    def get_queryset(self):
        user_account = self.request.user.iaso_profile.account
        return EntityDuplicate.objects.filter(entity1__account=user_account, entity2__account=user_account)

    @swagger_auto_schema(manual_parameters=[duplicate_detail_entities_param])
    @action(detail=False, methods=["get"], url_path="detail", pagination_class=None, filter_backends=[])
    def detail_view(self, request):
        """
        Retrieve details about a potential duplicate.

        `GET /api/entityduplicates/detail/?entities=A,B`

        For all the 'fields' of the analyzis it will return
        {
        "the_field": {
            "field": string, // The key of the field
            label: string | { "English": string, "French":string } // either a string or an object with the translations
            },
        "entity1":{
            "value":string | number| boolean, // I think the value types cover what we can expect
            "id": int // The id of the entity
            },
        "entity2":{
            "value":string |number|boolean,
            "id": int
            }
        "final":{
            "value"?:string |number|boolean, // No value if the entities mismatch
            "id"?: int // The value of the entity it was taken from
            }
        }
        So basically it returns an array of those objects
        """
        try:
            entities = request.GET.get("entities", "").split(",")
            entity1_id = int(entities[0])
            entity2_id = int(entities[1])
        except ValueError:
            raise ValidationError(
                "Entities parameter is required and must be a comma separated list of 2 entities IDs."
            )

        duplicate = (
            self.get_queryset()
            .filter(
                Q(entity1__pk=entity1_id, entity2__pk=entity2_id) | Q(entity1__pk=entity2_id, entity2__pk=entity1_id)
            )
            .first()
        )

        if not duplicate:
            return Response(status=status.HTTP_404_NOT_FOUND, data={"error": "Entity duplicate not found."})

        # we need to create the expected answer from all the fields
        # we need to get the fields from the analyze
        analyze = duplicate.analyze
        entity_type_id = analyze.metadata["entity_type_id"]

        try:
            et = EntityType.objects.get(pk=int(entity_type_id))
        except EntityType.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND, data={"error": "EntityType not found."})

        fields_data = []

        possible_fields = et.reference_form.possible_fields

        e1_json = duplicate.entity1.attributes.json
        e2_json = duplicate.entity2.attributes.json

        for the_q in possible_fields:
            try:
                e1_val = e1_json[the_q["name"]]
                # FIXME: find a better way to exclude the instance id
                if "uuid" in e1_val:
                    continue
                if is_UUID(e1_val):
                    continue
            except:
                e1_val = "Not Found"

            try:
                e2_val = e2_json[the_q["name"]]
            except:
                e2_val = "Not Found"

            fields_data.append(
                {
                    "the_field": {
                        "field": the_q["name"],
                        "label": the_q["label"],
                    },
                    "entity1": {
                        "value": e1_val,
                        "id": duplicate.entity1.id,
                    },
                    "entity2": {
                        "value": e2_val,
                        "id": duplicate.entity2.id,
                    },
                    "final": {
                        "value": e1_val if e1_val == e2_val else "",  # this needs to be fixed !
                        "id": duplicate.entity1.id,  # this needs to be fixed !
                    },
                }
            )

        version1 = duplicate.entity1.attributes.get_form_version()
        version2 = duplicate.entity2.attributes.get_form_version()

        if not version1:
            return Response(
                status=status.HTTP_404_NOT_FOUND,
                data={"error": f"No form version for attibutes of entity {duplicate.entity1.pk}"},
            )

        if not version2:
            return Response(
                status=status.HTTP_404_NOT_FOUND,
                data={"error": f"No form version for attibutes of entity {duplicate.entity2.pk}"},
            )

        return_data = {
            "fields": fields_data,
            "descriptor1": version1.get_or_save_form_descriptor(),
            "descriptor2": version2.get_or_save_form_descriptor(),
        }

        return JsonResponse(return_data, safe=False)

    @swagger_auto_schema(request_body=EntityDuplicatePostSerializer(many=False))
    def create(self, request, pk=None, *args, **kwargs):
        """
        POST /api/entityduplicates/
        one
        {
            "entity1_id": Int,
            "entity2_id": Int,
            "merge": {
                "key1": "entity1_id",
                "key2": "entity1_id",
                "key3": "entity2_id",
                ...
            }
            "ignore": true | false,
            "reason": "optional reason"
        }
        in the body
        Provides an API to merge duplicate entities or to ignore the match
        """

        serializer = EntityDuplicatePostSerializer(data=request.data, context={"request": request})

        serializer.is_valid(raise_exception=True)
        res = serializer.save()

        return_data = EntityDuplicatePostAnswerSerializer(res).data

        return Response(return_data)
