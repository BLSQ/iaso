from django.db import transaction
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.common.serializer_fields import CurrentAccountDefault
from iaso.models import Form, MissionForm
from iaso.models.missions import MissionFormThroughForm


class NestedMissionFormThroughFormUpdateSerializer(ModelSerializer):
    form = serializers.PrimaryKeyRelatedField(queryset=Form.objects.none(), write_only=True)

    class Meta:
        model = MissionFormThroughForm
        fields = ["form", "min_cardinality", "max_cardinality"]
        extra_kwargs = {
            "min_cardinality": {"write_only": True, "required": True},
            "max_cardinality": {"write_only": True},
        }

    def set_context(self, context):
        # method to trigger again the queryset computation
        self.context.update(context)
        if getattr(self.context.get("request", None), "user", None):
            self.fields["form"].queryset = Form.objects.filter_for_user_and_app_id(self.context["request"].user)

    def validate(self, attrs):
        min_val = attrs.get("min_cardinality")
        max_val = attrs.get("max_cardinality")
        if max_val is not None and min_val > max_val:
            raise serializers.ValidationError(
                {"min_cardinality": _("Minimum cardinality must be inferior than the maximum cardinality")}
            )
        return attrs


class MissionFormUpdateSerializer(ModelSerializer):
    forms = NestedMissionFormThroughFormUpdateSerializer(many=True, required=True, allow_empty=False, write_only=True)
    created_by = serializers.HiddenField(default=serializers.CurrentUserDefault(), write_only=True)
    account_id = serializers.HiddenField(default=CurrentAccountDefault(returns_id=True), write_only=True)

    class Meta:
        model = MissionForm
        fields = ["id", "name", "description", "forms", "created_by", "account_id"]
        read_only_fields = ["id"]

        extra_kwargs = {"id": {"read_only": True}, "name": {"write_only": True}, "description": {"write_only": True}}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["forms"].child.set_context(self.context)

    def validate_forms(self, forms):
        form_ids = [item["form"].pk for item in forms]

        if len(form_ids) != len(set(form_ids)):
            raise serializers.ValidationError(_("Each form may only be specified once."))

        return forms

    @transaction.atomic
    def update(self, instance, validated_data):
        through_data = validated_data.pop("forms")

        instance = super().update(instance, validated_data)

        # get the current m2m fields
        existing = {obj.form_id: obj for obj in instance.missionformthroughform_set.all()}
        incoming = {item["form"].id: item for item in through_data}

        # delete
        MissionFormThroughForm.objects.filter(
            form_id__in=list(existing.keys() - incoming.keys()), mission_form__id=instance.id
        ).delete()

        # update existing
        bulk_updates = []

        for form_id in existing.keys() & incoming.keys():
            obj = existing[form_id]
            data = incoming[form_id]

            obj.min_cardinality = data["min_cardinality"]
            obj.max_cardinality = data["max_cardinality"]

            bulk_updates.append(obj)

        MissionFormThroughForm.objects.bulk_update(bulk_updates, fields=["min_cardinality", "max_cardinality"])

        # create new
        MissionFormThroughForm.objects.bulk_create(
            [
                MissionFormThroughForm(**incoming[form_id], mission_form_id=instance.id)
                for form_id in incoming.keys() - existing.keys()
            ]
        )

        return instance
