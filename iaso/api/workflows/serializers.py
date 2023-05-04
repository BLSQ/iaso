from django.shortcuts import get_object_or_404
from rest_framework import serializers

import iaso.api.workflows.utils as utils
from iaso.models import (
    Form,
    EntityType,
    Workflow,
    WorkflowVersion,
    WorkflowChange,
    WorkflowFollowup,
)
from iaso.models.workflow import WorkflowVersionsStatus

CALCULATE_TYPE = "calculate"


class FormNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Form
        fields = ["id", "name"]


class EntityTypeNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityType
        fields = ["id", "name", "reference_form"]


class WorkflowVersionSerializer(serializers.ModelSerializer):
    version_id = serializers.IntegerField(source="id")

    class Meta:
        model = WorkflowVersion

        fields = ["status", "created_at", "updated_at", "version_id", "name"]


class WorkflowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workflow

        fields = [
            "entity_type_id",
            "created_at",
            "updated_at",
        ]


class WorkflowChangeSerializer(serializers.ModelSerializer):
    form = FormNestedSerializer(many=False)

    class Meta:
        model = WorkflowChange
        fields = ["id", "form", "mapping", "created_at", "updated_at"]


def find_question_by_name(name, questions):
    if questions is not None:
        for q in questions:
            if q["name"] == name:
                return q
    return None


class WorkflowChangeCreateSerializer(serializers.Serializer):
    form = serializers.IntegerField()
    mapping = serializers.JSONField()

    def validate_form(self, form_id):
        user = self.context["request"].user

        # Checking if the form exists
        if not Form.objects.filter(pk=form_id).exists():
            raise serializers.ValidationError(f"Form {form_id} does not exist")

        # Checking that user has access to the form
        form = Form.objects.get(pk=form_id)
        can_access = False
        for p in form.projects.all():
            if p.account == user.iaso_profile.account:
                can_access = True
                break

        if not can_access:
            raise serializers.ValidationError(f"User doesn't have access to form {form_id}")
        # Checking that the form is not the reference form
        version_id = self.context["version_id"]
        wfv = get_object_or_404(WorkflowVersion, pk=version_id)

        if form.id == wfv.workflow.entity_type.reference_form.id:
            raise serializers.ValidationError(
                f"Cannot create a WorkflowChange where form and reference form are the same"
            )

        return form_id

    def validate_mapping(self, mapping):
        version_id = self.context["version_id"]
        wfv = get_object_or_404(WorkflowVersion, pk=version_id)
        reference_form = wfv.reference_form

        if not Form.objects.filter(pk=self.initial_data["form"]).exists():
            raise serializers.ValidationError(f"Form {self.initial_data['form']} does not exist")

        source_form = Form.objects.get(pk=self.initial_data["form"])

        s_questions = source_form.possible_fields
        r_questions = reference_form.possible_fields

        # We cannot have two identical keys mapping to the same value because it's a dictionary
        # But we can have two different keys mapping to the same value, we need to check for it

        if len(mapping.values()) != len(list(set(mapping.values()))):
            raise serializers.ValidationError(f"Mapping cannot have two identical values")

        for _source, _target in mapping.items():

            q = find_question_by_name(_source, s_questions)
            if q is None:
                raise serializers.ValidationError(f"Question {_source} does not exist in source form")
            else:
                s_type = q["type"]

            q = find_question_by_name(_target, r_questions)
            if q is None:
                raise serializers.ValidationError(f"Question {_target} does not exist in reference/target form")
            else:
                r_type = q["type"]

            if s_type != r_type and s_type != CALCULATE_TYPE and r_type != CALCULATE_TYPE:
                raise serializers.ValidationError(f"Question {_source} and {_target} do not have the same type")

        return mapping

    def create(self, validated_data):
        version_id = self.context["version_id"]
        wfv = get_object_or_404(WorkflowVersion, pk=version_id)
        form = get_object_or_404(Form, pk=validated_data["form"])

        # We must first verify that we don't have a workflow change with the same form
        if WorkflowChange.objects.filter(workflow_version=wfv, form=form).exists():
            raise serializers.ValidationError(f"WorkflowChange for form {form.id} already exists !")

        # If it does, we return an error
        # If it doesn't, we create the change

        wc = WorkflowChange.objects.create(
            workflow_version=wfv,
            form=form,
            mapping=validated_data["mapping"],
        )

        wc.save()

        return wc

    def update(self, instance, validated_data):
        instance.mapping = validated_data["mapping"]
        form = get_object_or_404(Form, pk=validated_data["form"])
        instance.form = form
        instance.save()
        return instance


class WorkflowFollowupSerializer(serializers.ModelSerializer):
    forms = FormNestedSerializer(many=True)

    class Meta:
        model = WorkflowFollowup
        fields = ["id", "order", "condition", "forms", "created_at", "updated_at"]


class WorkflowFollowupModifySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    order = serializers.IntegerField(required=False)
    condition = serializers.JSONField(required=False)
    form_ids = serializers.ListField(child=serializers.IntegerField(), required=False, allow_empty=False)

    def validate(self, data):
        if "order" not in data and "form_ids" not in data and "condition" not in data:
            raise serializers.ValidationError("No data to update")

        if "order" in data and data["order"] < 0:
            raise serializers.ValidationError("order must be positive")

        if "form_ids" in data:
            if len(data["form_ids"]) == 0:
                raise serializers.ValidationError("form_ids must not be empty")
            else:
                for f in data["form_ids"]:
                    if not Form.objects.filter(id=f).exists():
                        raise serializers.ValidationError("form_ids must be valid form ids")

                    f = Form.objects.get(id=f)
                    # TODO this is crashing while saving
                    if f.projects.filter(account=self.context["request"].user.iaso_profile.account).count() == 0:
                        raise serializers.ValidationError(f"form_id {f.id} is not accessible to the user")
        follow_up = get_object_or_404(WorkflowFollowup, id=data["id"])
        utils.validate_version_id(follow_up.workflow_version.id, self.context["request"].user)

        return data

    def update(self, instance, validated_data):
        if "condition" in validated_data:
            instance.condition = validated_data["condition"]

        if "order" in validated_data:
            instance.order = validated_data["order"]

        if "form_ids" in validated_data:
            instance.forms.set(validated_data["form_ids"])

        instance.save()

        return instance


class WorkflowFollowupCreateSerializer(serializers.Serializer):
    order = serializers.IntegerField()
    condition = serializers.JSONField()
    form_ids = serializers.ListField(child=serializers.IntegerField())

    def validate_form_ids(self, form_ids):
        user = self.context["request"].user

        for form_id in form_ids:
            if not Form.objects.filter(pk=form_id).exists():
                raise serializers.ValidationError(f"Form {form_id} does not exist")

            form = Form.objects.get(pk=form_id)
            for p in form.projects.all():
                if p.account != user.iaso_profile.account:
                    raise serializers.ValidationError(f"User doesn't have access to form {form_id}")

        return form_ids

    def validate_order(self, order_val):
        if order_val < 0:
            raise serializers.ValidationError("order must be positive")

        return order_val

    def create(self, validated_data):
        version_id = self.context["version_id"]

        wfv = get_object_or_404(WorkflowVersion, pk=version_id)
        wf = WorkflowFollowup.objects.create(
            order=validated_data["order"],
            condition=validated_data["condition"],
            workflow_version=wfv,
        )

        wf.conditions = validated_data["condition"]
        wf.order = validated_data["order"]

        wf.forms.set(validated_data["form_ids"])
        wf.save()
        return wf


class WorkflowVersionDetailSerializer(serializers.ModelSerializer):
    version_id = serializers.IntegerField(source="pk")
    reference_form = FormNestedSerializer()
    entity_type = EntityTypeNestedSerializer(source="workflow.entity_type")
    follow_ups = serializers.SerializerMethodField()

    @staticmethod
    def get_follow_ups(obj):
        sorted_obj = obj.follow_ups.all().order_by("order")
        return WorkflowFollowupSerializer(sorted_obj, many=True).data

    class Meta:
        model = WorkflowVersion

        fields = [
            "version_id",
            "status",
            "name",
            "entity_type",
            "reference_form",
            "created_at",
            "updated_at",
            "follow_ups",
        ]


class WorkflowPostSerializer(serializers.Serializer):
    entity_type_id = serializers.IntegerField(required=True)
    name = serializers.CharField(required=False)

    def validate_name(self, new_name):
        if len(new_name) <= 1:
            raise serializers.ValidationError("name '" + new_name + "' is too short")
        return new_name

    def validate_entity_type_id(self, entity_type_id):
        et = EntityType.objects.get(pk=entity_type_id)

        if not et.account == self.context["request"].user.iaso_profile.account:
            raise serializers.ValidationError("User doesn't have access to Entity Type : " + str(entity_type_id))

        return entity_type_id

    def create(self, validated_data):
        entity_type_id = validated_data["entity_type_id"]
        wf, wf_created = Workflow.objects.get_or_create(entity_type_id=entity_type_id)

        wfv = WorkflowVersion.objects.create(workflow=wf)
        if "name" in validated_data:
            wfv.name = validated_data["name"]
        wfv.save()
        return wfv


class WorkflowPartialUpdateSerializer(serializers.Serializer):

    status = serializers.CharField(required=False)
    name = serializers.CharField(required=False)

    def validate_status(self, new_status):
        if hasattr(WorkflowVersionsStatus, new_status):
            return new_status
        else:
            raise serializers.ValidationError(new_status + "is not recognized as proper status value")

    def validate_name(self, new_name):
        if len(new_name) <= 1:
            raise serializers.ValidationError("name '" + new_name + "' is too short")
        return new_name

    def update(self, instance, validated_data):
        instance_changed = False

        if "name" in validated_data:
            instance.name = validated_data["name"]
            instance_changed = True

        if "status" in validated_data:
            res = instance.transition_to_status(validated_data["status"], do_save=False)

            if not res["success"]:
                raise serializers.ValidationError(res["error"])
            else:
                instance_changed = True

        if instance_changed:
            instance.save()

        return instance
