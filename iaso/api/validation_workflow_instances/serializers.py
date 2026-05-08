from django.db.models import Case, Exists, F, IntegerField, OuterRef, Q, When, Window
from django.db.models.functions import Lag
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.validation_workflows.serializers.common import UserDisplayNameField
from iaso.models import Instance, UserRole, ValidationNode, ValidationNodeTemplate
from iaso.models.common import ValidationWorkflowArtefactStatus
from iaso.models.validation_workflow.validation_node import ValidationNodeStatus


class NestedUserRoleSerializer(ModelSerializer):
    name = serializers.CharField(read_only=True, source="group.name")

    class Meta:
        model = UserRole
        fields = ["id", "name"]


class NestedTimelineSerializer(ModelSerializer):
    name = serializers.CharField(read_only=True, source="node.name")
    node_template_slug = serializers.CharField(read_only=True, source="node.slug")
    updated_by = UserDisplayNameField()
    type = serializers.SerializerMethodField(read_only=True)
    user_can_do_actions = serializers.SerializerMethodField(read_only=True)
    order = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ValidationNode
        fields = [
            "id",
            "name",
            "node_template_slug",
            "comment",
            "updated_at",
            "created_at",
            "status",
            "updated_by",
            "type",
            "user_can_do_actions",
            "order",
        ]

    def get_type(self, obj):
        return "TIMELINE"

    def get_user_can_do_actions(self, obj):
        user = self.context["request"].user
        if user.is_superuser:
            return True

        user_role_ids = user.iaso_profile.user_roles.values_list("pk", flat=True)

        required_roles_id = obj.node.roles_required.values_list("pk", flat=True)

        if not set(required_roles_id).issubset(set(user_role_ids)):
            return False

        return True

    def get_order(self, obj):
        list_nodes = list(obj.instance.form.validation_workflow.dump_nodes())
        return list_nodes.index(obj.node.slug) + 1


class NestedTimelineNextBypassSerializer(ModelSerializer):
    node_template_slug = serializers.CharField(read_only=True, source="slug")
    updated_by = serializers.SerializerMethodField(read_only=True)
    status = serializers.SerializerMethodField(read_only=True)
    comment = serializers.SerializerMethodField(read_only=True)
    type = serializers.SerializerMethodField(read_only=True)
    user_can_do_actions = serializers.SerializerMethodField(read_only=True)
    order = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ValidationNodeTemplate
        fields = [
            "id",
            "name",
            "node_template_slug",
            "comment",
            "updated_at",
            "created_at",
            "status",
            "updated_by",
            "type",
            "user_can_do_actions",
            "order",
        ]

    def get_status(self, obj):
        return None

    def get_updated_by(self, obj):
        return None

    def get_comment(self, obj):
        return None

    def get_type(self, obj):
        return "NEXT_BYPASS"

    def get_user_can_do_actions(self, obj):
        user = self.context["request"].user

        if user.is_superuser:
            return True

        user_role_ids = user.iaso_profile.user_roles.values_list("pk", flat=True)

        required_roles_id = obj.roles_required.values_list("pk", flat=True)

        if not set(required_roles_id).issubset(set(user_role_ids)):
            return False

        return True

    def get_order(self, obj):
        list_nodes = list(obj.workflow.dump_nodes())
        return list_nodes.index(obj.slug) + 1


class NestedSubmissionSerializer(serializers.ModelSerializer):
    general_validation_status = serializers.SerializerMethodField()
    timeline = serializers.SerializerMethodField()
    next_created_at = serializers.DateTimeField(read_only=True)
    created_by = UserDisplayNameField()
    active_steps = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ValidationNode
        fields = [
            "created_at",
            "created_by",
            "next_created_at",
            "general_validation_status",
            "timeline",
            "active_steps",
        ]

    def get_active_steps(self, obj):
        return (
            obj.instance.validationnode_set.exclude(
                Q(status=ValidationNodeStatus.NEW_VERSION) | Q(status=ValidationNodeStatus.SUBMISSION)
            )
            .filter(
                created_at__gte=obj.created_at, **{"created_at__lt": obj.next_created_at} if obj.next_created_at else {}
            )
            .count()
        )

    def get_general_validation_status(self, obj):
        if not obj.next_created_at:
            return obj.instance.general_validation_status

        if (
            obj.instance.validationnode_set.filter(created_at__gte=obj.created_at, created_at__lt=obj.next_created_at)
            .filter(status=ValidationNodeStatus.REJECTED)
            .exists()
        ):
            return ValidationWorkflowArtefactStatus.REJECTED
        return ValidationWorkflowArtefactStatus.PENDING

    def get_timeline(self, obj):
        # get history
        data = (
            obj.instance.validationnode_set.exclude(
                Q(status=ValidationNodeStatus.NEW_VERSION) | Q(status=ValidationNodeStatus.SUBMISSION)
            )
            .filter(
                created_at__gte=obj.created_at, **{"created_at__lt": obj.next_created_at} if obj.next_created_at else {}
            )
            .order_by("-updated_at")
        )

        next_bypass = None
        if (
            not obj.next_created_at
            and obj.instance.general_validation_status == ValidationWorkflowArtefactStatus.PENDING
        ):
            node_order = list(reversed(obj.instance.form.validation_workflow.dump_nodes()))

            ordering = Case(
                *[When(slug=slug, then=pos) for pos, slug in enumerate(node_order)],
                output_field=IntegerField(),
            )

            next_bypass = (
                ValidationNodeTemplate.objects.filter(
                    can_skip_previous_nodes=True,
                    workflow=obj.instance.form.validation_workflow,
                )
                .filter(
                    Q(
                        ~Exists(
                            ValidationNode.objects.exclude(created_at__lt=obj.created_at).filter(
                                instance=obj.instance,
                                node=OuterRef("pk"),
                            )
                        )
                    )
                    & Q(
                        ~Exists(
                            ValidationNode.objects.exclude(created_at__lt=obj.created_at).filter(
                                instance=obj.instance,
                                node=OuterRef("pk"),
                                status=ValidationNodeStatus.UNKNOWN,
                            )
                        )
                    )
                )
                .order_by(ordering)
            )

        return (
            NestedTimelineNextBypassSerializer(next_bypass, many=True, context=self.context).data
            + NestedTimelineSerializer(data, context=self.context, many=True).data
        )


class ValidationWorkflowInstanceRetrieveSerializer(ModelSerializer):
    validation_status = serializers.CharField(read_only=True, source="general_validation_status")
    submissions = serializers.SerializerMethodField(read_only=True)
    total_steps = serializers.SerializerMethodField(read_only=True)

    workflow = serializers.CharField(read_only=True, source="form.validation_workflow.slug")

    class Meta:
        model = Instance
        fields = ["workflow", "total_steps", "validation_status", "submissions"]

    @extend_schema_field(NestedSubmissionSerializer)
    def get_submissions(self, obj):
        data = (
            obj.validationnode_set.filter(
                Q(status=ValidationNodeStatus.SUBMISSION) | Q(status=ValidationNodeStatus.NEW_VERSION)
            )
            .annotate(next_created_at=Window(expression=Lag("created_at"), order_by=F("created_at").desc()))
            .order_by("-created_at")
        )
        return NestedSubmissionSerializer(data, many=True, context=self.context).data

    def get_total_steps(self, obj):
        return obj.form.validation_workflow.node_templates.count()
