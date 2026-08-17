from django.db import transaction
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.common.serializer_fields import CurrentAccountDefault
from iaso.models import Form, OrgUnitType
from iaso.models.missions import MissionFormThroughForm, MissionOrgUnitType, MissionType


class OrgUnitTypeScopedFormField(serializers.PrimaryKeyRelatedField):
    def get_queryset(self):
        if not getattr(self.context.get("request", None), "user", None):
            return Form.objects.none()

        org_unit_type_pk = self.parent.parent.parent.initial_data.get("org_unit_type")

        if not org_unit_type_pk:
            return Form.objects.none()

        return Form.objects.filter_for_user_and_app_id(self.context["request"].user).filter(
            org_unit_types__id=org_unit_type_pk
        )


class NestedMissionFormThroughFormCreateSerializer(ModelSerializer):
    form = OrgUnitTypeScopedFormField(queryset=Form.objects.none(), write_only=True)

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


class MissionOrgUnitTypeCreateSerializer(ModelSerializer):
    created_by = serializers.HiddenField(default=serializers.CurrentUserDefault(), write_only=True)
    account_id = serializers.HiddenField(default=CurrentAccountDefault(returns_id=True), write_only=True)
    org_unit_type = serializers.PrimaryKeyRelatedField(
        queryset=OrgUnitType.objects.none(), write_only=True, required=True
    )
    forms = NestedMissionFormThroughFormCreateSerializer(many=True, required=True, allow_empty=False, write_only=True)
    mission_type = serializers.ChoiceField(
        choices=[MissionType.ORG_UNIT_AND_FORM.value], write_only=True, required=True
    )

    class Meta:
        model = MissionOrgUnitType
        fields = [
            "id",
            "name",
            "description",
            "created_by",
            "account_id",
            "org_unit_type",
            "forms",
            "min_cardinality",
            "max_cardinality",
            "mission_type",
        ]
        read_only_fields = ["id"]
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
            self.fields["org_unit_type"].queryset = OrgUnitType.objects.filter(projects__account=account)

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
    def create(self, validated_data):
        through_data = validated_data.pop("forms")

        mission = self.Meta.model.objects.create(**validated_data)

        through_instances = []

        for item_data in through_data:
            instance = MissionFormThroughForm(mission_form=mission, **item_data)
            through_instances.append(instance)

        MissionFormThroughForm.objects.bulk_create(through_instances)

        return mission
