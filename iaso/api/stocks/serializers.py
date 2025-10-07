from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework.relations import PrimaryKeyRelatedField

from iaso.api.common import TimestampField
from iaso.models import (
    Form,
    Instance,
    OrgUnit,
    OrgUnitType,
    Project,
    StockImpacts,
    StockItem,
    StockItemRule,
    StockKeepingUnit,
    StockKeepingUnitChildren,
    StockLedgerItem,
    StockRulesVersion,
    StockRulesVersionsStatus,
)
from iaso.utils.serializer.id_or_uuid_field import IdOrUuidRelatedField


class StockKeepingUnitNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockKeepingUnit
        fields = ["id", "name", "short_name"]
        ref_name = "StockKeepingUnitNestedSerializerForStockItem"


class StockKeepingUnitChildrenSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True, source="child_id")

    class Meta:
        model = StockKeepingUnitChildren
        fields = ["id", "value"]


class ProjectNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "color"]
        ref_name = "ProjectNestedSerializerForStockKeepingUnit"


class OrgUnitTypeNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ["id", "name"]
        ref_name = "OrgUnitTypeNestedSerializerForStockKeepingUnit"


class OrgUnitNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnit
        fields = ["id", "name"]
        ref_name = "OrgUnitNestedSerializerForStockKeepingUnit"


class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]
        ref_name = "UserNestedSerializerForStockKeepingUnit"


class FormNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Form
        fields = ["id", "name"]
        ref_name = "FormNestedSerializerForStockKeepingUnit"


class StockKeepingUnitSerializer(serializers.ModelSerializer):
    projects = ProjectNestedSerializer(many=True)
    org_unit_types = OrgUnitTypeNestedSerializer(many=True)
    forms = FormNestedSerializer(many=True)
    created_at = TimestampField()
    created_by = UserNestedSerializer()
    updated_at = TimestampField()
    updated_by = UserNestedSerializer()
    children = StockKeepingUnitChildrenSerializer(source="children_reverse", many=True)
    deleted_at = TimestampField()

    class Meta:
        model = StockKeepingUnit
        fields = [
            "id",
            "name",
            "short_name",
            "projects",
            "org_unit_types",
            "forms",
            "children",
            "display_unit",
            "display_precision",
            "created_at",
            "created_by",
            "updated_at",
            "updated_by",
            "deleted_at",
        ]
        read_only_fields = ["created_at", "updated_at", "created_by", "updated_by", "deleted_at"]


class StockKeepingUnitWriteSerializer(serializers.ModelSerializer):
    projects = PrimaryKeyRelatedField(
        many=True,
        queryset=Project.objects.all(),
        required=False,
    )
    org_unit_types = PrimaryKeyRelatedField(
        many=True,
        queryset=OrgUnitType.objects.all(),
        required=False,
    )
    forms = PrimaryKeyRelatedField(
        many=True,
        queryset=Form.objects.all(),
        required=False,
    )

    class Meta:
        model = StockKeepingUnit
        fields = [
            "id",
            "name",
            "short_name",
            "projects",
            "org_unit_types",
            "forms",
            "display_unit",
            "display_precision",
        ]

    def validate(self, validated_data):
        request = self.context.get("request")
        account_id = request.user.iaso_profile.account_id
        if "projects" in validated_data and not all(p.account_id == account_id for p in validated_data["projects"]):
            raise serializers.ValidationError("User doesn't have access to one or more of those projects")

        if "org_unit_types" in validated_data and not all(
            any(p.account_id == account_id for p in t.projects.all()) for t in validated_data["org_unit_types"]
        ):
            raise serializers.ValidationError("User doesn't have access to one or more of those OrgUnit types")

        if "forms" in validated_data and not all(
            any(p.account_id == account_id for p in f.projects.all()) for f in validated_data["forms"]
        ):
            raise serializers.ValidationError("User doesn't have access to one or more of those forms")

        return validated_data

    def update(self, instance, validated_data):
        request = self.context.get("request")
        instance.updated_by = request.user
        return super().update(instance, validated_data)


class StockItemSerializer(serializers.ModelSerializer):
    org_unit = OrgUnitNestedSerializer()
    sku = StockKeepingUnitNestedSerializer()
    created_at = TimestampField()
    updated_at = TimestampField()

    class Meta:
        model = StockItem
        fields = [
            "id",
            "org_unit",
            "sku",
            "value",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class StockItemWriteSerializer(serializers.ModelSerializer):
    sku = PrimaryKeyRelatedField(
        queryset=StockKeepingUnit.objects.all(),
        required=True,
    )
    org_unit = PrimaryKeyRelatedField(
        queryset=OrgUnit.objects.all(),
        required=True,
    )
    value = serializers.IntegerField(min_value=0)

    class Meta:
        model = StockItem
        fields = [
            "sku",
            "org_unit",
            "value",
        ]

    def validate(self, validated_data):
        request = self.context.get("request")
        sku = validated_data.get("sku")
        account_id = request.user.iaso_profile.account_id
        if sku.account_id != account_id:
            raise serializers.ValidationError("User doesn't have access to this SKU")
        if not any(p.account_id == account_id for p in validated_data["org_unit"].org_unit_type.projects.all()):
            raise serializers.ValidationError("User doesn't have access to this OrgUnit")
        return validated_data

    def update(self, instance, validated_data):
        request = self.context.get("request")
        instance.updated_by = request.user
        return super().update(instance, validated_data)


class StockItemUpdateSerializer(serializers.ModelSerializer):
    value = serializers.IntegerField(min_value=0, required=True)

    class Meta:
        model = StockItem
        fields = ["value"]


class StockLedgerItemSerializer(serializers.ModelSerializer):
    org_unit = OrgUnitNestedSerializer()
    sku = StockKeepingUnitNestedSerializer()
    rule = PrimaryKeyRelatedField(queryset=StockItemRule.objects.all())
    created_at = TimestampField()
    created_by = UserNestedSerializer()

    class Meta:
        model = StockLedgerItem
        fields = [
            "id",
            "org_unit",
            "sku",
            "rule",
            "submission_id",
            "question",
            "value",
            "impact",
            "created_at",
            "created_by",
        ]
        read_only_fields = ["created_at", "created_by"]


class StockLedgerItemWriteSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=True)
    sku = PrimaryKeyRelatedField(
        queryset=StockKeepingUnit.objects.all(),
        required=True,
    )
    org_unit = PrimaryKeyRelatedField(
        queryset=OrgUnit.objects.all(),
        required=True,
    )
    rule = PrimaryKeyRelatedField(
        queryset=StockItemRule.objects.all(),
        required=False,
    )
    submission_id = IdOrUuidRelatedField(source="submission", queryset=Instance.objects.all(), required=True)
    question = serializers.CharField(required=True)
    value = serializers.IntegerField(min_value=0, required=True)
    impact = serializers.ChoiceField(required=True, choices=StockImpacts.choices)

    class Meta:
        model = StockLedgerItem
        fields = ["id", "org_unit", "sku", "rule", "submission_id", "question", "value", "impact"]

    def update(self, instance, validated_data):
        request = self.context.get("request")
        instance.updated_by = request.user
        return super().update(instance, validated_data)


class StockItemRuleSerializer(serializers.ModelSerializer):
    sku = StockKeepingUnitNestedSerializer()
    form = FormNestedSerializer()
    created_at = TimestampField()
    created_by = UserNestedSerializer()
    updated_at = TimestampField()
    updated_by = UserNestedSerializer()

    class Meta:
        model = StockItemRule
        fields = [
            "id",
            "version_id",
            "sku",
            "form",
            "question",
            "impact",
            "order",
            "created_at",
            "created_by",
            "updated_at",
            "updated_by",
        ]
        read_only_fields = ["created_at", "updated_at", "created_by", "updated_by"]


class StockItemRuleWriteSerializer(serializers.ModelSerializer):
    version = PrimaryKeyRelatedField(
        queryset=StockRulesVersion.objects.all(),
        required=True,
    )
    sku = PrimaryKeyRelatedField(
        queryset=StockKeepingUnit.objects.all(),
        required=True,
    )
    form = PrimaryKeyRelatedField(
        queryset=Form.objects.all(),
        required=True,
    )
    question = serializers.CharField(required=True)
    impact = serializers.ChoiceField(required=True, choices=StockImpacts.choices)

    class Meta:
        model = StockItemRule
        fields = [
            "sku",
            "form",
            "version",
            "question",
            "impact",
            "order",
        ]

    def validate(self, validated_data):
        request = self.context.get("request")
        account_id = request.user.iaso_profile.account_id
        if validated_data.get("sku").account_id != account_id:
            raise serializers.ValidationError("User doesn't have access to this SKU")
        if validated_data.get("version").account_id != account_id:
            raise serializers.ValidationError("User doesn't have access to this version")
        if validated_data.get("sku").account_id != validated_data.get("version").account_id:
            raise serializers.ValidationError("SKU's account and version's account do not match")
        if validated_data.get("version").status != StockRulesVersionsStatus.DRAFT:
            raise PermissionDenied("You can only create items for draft versions")
        return validated_data

    def update(self, instance, validated_data):
        request = self.context.get("request")
        instance.updated_by = request.user
        return super().update(instance, validated_data)


class StockItemRuleUpdateSerializer(serializers.ModelSerializer):
    question = serializers.CharField(required=True)
    impact = serializers.ChoiceField(required=True, choices=StockImpacts.choices)

    class Meta:
        model = StockItemRule
        fields = [
            "question",
            "impact",
            "order",
        ]


class StockRulesVersionListSerializer(serializers.ModelSerializer):
    created_at = TimestampField()
    created_by = UserNestedSerializer()
    updated_at = TimestampField()
    updated_by = UserNestedSerializer()
    deleted_at = TimestampField()

    class Meta:
        model = StockRulesVersion
        fields = [
            "id",
            "name",
            "status",
            "created_at",
            "created_by",
            "updated_at",
            "updated_by",
            "deleted_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "created_by", "updated_by", "deleted_at"]


class StockRulesVersionSerializer(serializers.ModelSerializer):
    rules = StockItemRuleSerializer(many=True)
    created_at = TimestampField()
    created_by = UserNestedSerializer()
    updated_at = TimestampField()
    updated_by = UserNestedSerializer()
    deleted_at = TimestampField()

    class Meta:
        model = StockRulesVersion
        fields = [
            "name",
            "status",
            "rules",
            "created_at",
            "created_by",
            "updated_at",
            "updated_by",
            "deleted_at",
        ]
        read_only_fields = ["created_at", "updated_at", "created_by", "updated_by", "deleted_at"]


class StockRulesVersionWriteSerializer(serializers.ModelSerializer):
    name = serializers.CharField(min_length=1, max_length=StockRulesVersion.NAME_MAX_LENGTH)

    class Meta:
        model = StockRulesVersion
        fields = [
            "name",
            "status",
        ]

    def update(self, instance: StockRulesVersion, validated_data):
        instance_changed = False

        if "name" in validated_data:
            instance.name = validated_data["name"]
            instance_changed = True

        if "status" in validated_data and validated_data["status"] != instance.status:
            res = instance.transition_to_status(validated_data["status"], do_save=False)

            if not res["success"]:
                raise serializers.ValidationError(res["error"])
            instance_changed = True

        if instance_changed:
            request = self.context.get("request")
            instance.updated_by = request.user
            instance.save()

        return instance
