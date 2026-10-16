from django.db import transaction
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.common.serializer_fields import CurrentAccountDefault
from iaso.models import EntityType, Form, MissionEntityType
from iaso.models.missions import MissionFormThroughForm


class EntityTypeScopedFormField(serializers.PrimaryKeyRelatedField):
    def get_queryset(self):
        if not getattr(self.context.get("request", None), "user", None):
            return Form.objects.none()

        entity_type_pk = self.parent.parent.parent.initial_data.get("entity_type")

        if not entity_type_pk:
            return Form.objects.none()

        return (
            Form.objects.filter_for_user_and_app_id(self.context["request"].user)
            .filter_on_entity_type(entity_type_pk)
            .distinct()
        )


class NestedMissionFormThroughFormUpdateSerializer(ModelSerializer):
    form = EntityTypeScopedFormField(queryset=Form.objects.none(), write_only=True)

    class Meta:
        model = MissionFormThroughForm
        fields = ["form", "min_cardinality", "max_cardinality"]
        extra_kwargs = {
            "min_cardinality": {"write_only": True, "required": True},
            "max_cardinality": {"write_only": True},
        }

    def validate(self, attrs):
        min_val = attrs.get("min_cardinality")
        max_val = attrs.get("max_cardinality")
        if max_val is not None and min_val > max_val:
            raise serializers.ValidationError(
                {"min_cardinality": _("Minimum cardinality must be inferior than the maximum cardinality")}
            )
        return attrs


class MissionEntityTypeUpdateSerializer(ModelSerializer):
    created_by = serializers.HiddenField(default=serializers.CurrentUserDefault(), write_only=True)
    account_id = serializers.HiddenField(default=CurrentAccountDefault(returns_id=True), write_only=True)
    entity_type = serializers.PrimaryKeyRelatedField(queryset=EntityType.objects.none(), write_only=True)
    forms = NestedMissionFormThroughFormUpdateSerializer(many=True, required=True, allow_empty=False, write_only=True)

    class Meta:
        model = MissionEntityType
        fields = [
            "name",
            "description",
            "created_by",
            "account_id",
            "entity_type",
            "forms",
            "min_cardinality",
            "max_cardinality",
        ]

        extra_kwargs = {
            "min_cardinality": {"write_only": True, "required": True},
            "max_cardinality": {"write_only": True},
            "name": {"write_only": True},
            "description": {"write_only": True},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = getattr(self.context.get("request", None), "user", None)
        iaso_profile = getattr(user, "iaso_profile", None)
        account = getattr(iaso_profile, "account", None)
        if account:
            self.fields["entity_type"].queryset = EntityType.objects.filter(account=account)

    def validate(self, attrs):
        min_val = attrs.get("min_cardinality")
        max_val = attrs.get("max_cardinality")
        if max_val is not None and min_val > max_val:
            raise serializers.ValidationError(
                {"min_cardinality": _("Minimum cardinality must be inferior than the maximum cardinality")}
            )
        return attrs

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
            obj.max_cardinality = data.get("max_cardinality", None)

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
