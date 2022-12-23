from iaso.models import Form, EntityType, Workflow, WorkflowVersion, WorkflowChange, WorkflowFollowup
from iaso.models.workflow import WorkflowVersionsStatus
from rest_framework import serializers
from django.shortcuts import get_object_or_404

import iaso.api.workflows.utils as utils


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
        fields = ["form", "mapping", "created_at", "updated_at"]


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
                    if f.projects.filter(self.context["user"].profile.account).count() == 0:
                        raise serializers.ValidationError(f"form_id {f.id} is not accessible to the user")

        follow_up = get_object_or_404(WorkflowFollowup, pk=data["id"])
        utils.validate_version_id(follow_up.workflow_version.workflow.id, self.context["request"].user)

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
            order=validated_data["order"], condition=validated_data["condition"], workflow_version=wfv
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
    changes = WorkflowChangeSerializer(many=True)
    follow_ups = WorkflowFollowupSerializer(many=True)

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
            "changes",
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
        et = EntityType.objects.get(pk=entity_type_id)
        wfv.reference_form = et.reference_form
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
