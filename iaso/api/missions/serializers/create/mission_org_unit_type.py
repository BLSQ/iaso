from django.db import transaction
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.common.serializer_fields import CurrentAccountDefault
from iaso.models import Form, OrgUnitType
from iaso.models.microplanning import MissionOrgUnitType
from iaso.models.microplanning.missions import MissionOrgUnitTypeThroughForm


class NestedMissionOrgUnitTypeThroughFormCreateSerializer(ModelSerializer):
    form = serializers.PrimaryKeyRelatedField(queryset=Form.objects.none(), write_only=True)

    class Meta:
        model = MissionOrgUnitTypeThroughForm
        fields = ["form", "min_cardinality", "max_cardinality"]
        extra_kwargs = {
            "min_cardinality": {"write_only": True},
            "max_cardinality": {"write_only": True},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if getattr(self.context.get("request", None), "user", None):
            self.fields["form"].queryset = Form.objects.filter_on_user_projects(self.context["request"].user)

    def set_context(self, context):
        # method to trigger again the queryset computation
        self.context.update(context)
        if getattr(self.context.get("request", None), "user", None):
            self.fields["form"].queryset = Form.objects.filter_on_user_projects(self.context["request"].user)

    def validate(self, attrs):
        min_val = attrs.get("min_cardinality", 0)
        max_val = attrs.get("max_cardinality")
        if max_val is not None and min_val > max_val:
            raise serializers.ValidationError(
                {"min_cardinality": _("Minimum cardinality must be inferior than the maximum cardinality")}
            )
        return attrs


class MissionOrgUnitTypeCreateSerializer(ModelSerializer):
    created_by = serializers.HiddenField(default=serializers.CurrentUserDefault(), write_only=True)
    account_id = serializers.HiddenField(default=CurrentAccountDefault(), write_only=True)
    org_unit_type = serializers.PrimaryKeyRelatedField(queryset=OrgUnitType.objects.none(), write_only=True)
    forms = NestedMissionOrgUnitTypeThroughFormCreateSerializer(
        many=True, required=True, allow_empty=False, write_only=True
    )

    class Meta:
        model = MissionOrgUnitType
        fields = [
            "name",
            "description",
            "created_by",
            "account_id",
            "org_unit_type",
            "forms",
            "min_cardinality",
            "max_cardinality",
        ]

        extra_kwargs = {
            "min_cardinality": {"write_only": True},
            "max_cardinality": {"write_only": True},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if getattr(self.context.get("request", None), "user", None):
            self.fields["org_unit_type"].queryset = OrgUnitType.objects.filter_for_user_and_app_id(
                self.context["request"].user
            )

    def validate(self, attrs):
        min_val = attrs.get("min_cardinality", 0)
        max_val = attrs.get("max_cardinality")
        if max_val is not None and min_val > max_val:
            raise serializers.ValidationError(
                {"min_cardinality": _("Minimum cardinality must be inferior than the maximum cardinality")}
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        through_data = validated_data.pop("forms")

        mission = self.Meta.model.objects.create(**validated_data)

        through_instances = []

        for item_data in through_data:
            instance = NestedMissionOrgUnitTypeThroughFormCreateSerializer.Meta.model(
                mission_org_unit_type=mission, **item_data
            )
            through_instances.append(instance)

        MissionOrgUnitTypeThroughForm.objects.bulk_create(through_instances)

        return mission
