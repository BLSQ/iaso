from django.db.models import Case, Exists, IntegerField, OuterRef, Q, When
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
    updated_by = UserDisplayNameField(allow_null=True)
    type = serializers.SerializerMethodField(read_only=True)
    user_can_do_actions = serializers.SerializerMethodField(read_only=True)
    order = serializers.SerializerMethodField(read_only=True)
    comment = serializers.CharField(read_only=True, allow_null=True, allow_blank=True)
    status = serializers.ChoiceField(choices=ValidationNodeStatus.choices, read_only=True, allow_null=True)

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

    @extend_schema_field(serializers.ChoiceField(choices=["TIMELINE", "NEXT_BYPASS"]))
    def get_type(self, obj):
        return "TIMELINE"

    @extend_schema_field(serializers.BooleanField)
    def get_user_can_do_actions(self, obj):
        user = self.context["request"].user
        if user.is_superuser:
            return True

        if "user_roles" in self.context:
            user_role_ids = self.context["user_roles"]
        else:
            user_role_ids = user.iaso_profile.user_roles.values_list("pk", flat=True)

        required_roles_id = [x.pk for x in obj.node.roles_required.all()]

        return set(required_roles_id).issubset(set(user_role_ids))

    @extend_schema_field(serializers.IntegerField)
    def get_order(self, obj):
        list_nodes = list(self.context["node_dumps"])
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

    @extend_schema_field(serializers.BooleanField)
    def get_user_can_do_actions(self, obj):
        user = self.context["request"].user

        if user.is_superuser:
            return True

        if "user_roles" in self.context:
            user_role_ids = self.context["user_roles"]
        else:
            user_role_ids = user.iaso_profile.user_roles.values_list("pk", flat=True)

        required_roles_id = [x.pk for x in obj.roles_required.all()]

        if not set(required_roles_id).issubset(set(user_role_ids)):
            return False

        return True

    @extend_schema_field(serializers.IntegerField)
    def get_order(self, obj):
        list_nodes = list(self.context["node_dumps"])
        return list_nodes.index(obj.slug) + 1


class NestedSubmissionSerializer(serializers.ModelSerializer):
    general_validation_status = serializers.SerializerMethodField()
    timeline = serializers.SerializerMethodField()
    next_created_at = serializers.DateTimeField(read_only=True, allow_null=True)
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

    def _get_instance(self, obj):
        if "instance" in self.context:
            instance = self.context.get("instance")
        else:
            instance = obj.instance
        return instance

    @extend_schema_field(serializers.IntegerField)
    def get_active_steps(self, obj):
        instance = self._get_instance(obj)
        nodes = instance.prefetched_validation_nodes

        nodes = [
            n
            for n in nodes
            if n.status not in [ValidationNodeStatus.NEW_VERSION, ValidationNodeStatus.SUBMISSION]
            and n.created_at >= obj.created_at
        ]

        if obj.next_created_at:
            nodes = [n for n in nodes if n.created_at < obj.next_created_at]
        return len(nodes)

    @extend_schema_field(serializers.ChoiceField(choices=ValidationWorkflowArtefactStatus.choices))
    def get_general_validation_status(self, obj):
        instance = self._get_instance(obj)

        if not obj.next_created_at:
            return instance.general_validation_status

        nodes = instance.prefetched_validation_nodes
        rejected_nodes = [
            n
            for n in nodes
            if n.created_at >= obj.created_at
            and n.created_at < obj.next_created_at
            and n.status == ValidationNodeStatus.REJECTED
        ]
        if len(rejected_nodes):
            return ValidationWorkflowArtefactStatus.REJECTED
        return ValidationWorkflowArtefactStatus.PENDING

    @extend_schema_field(NestedTimelineSerializer(many=True))
    def get_timeline(self, obj):
        instance = self._get_instance(obj)

        # get history
        nodes = instance.prefetched_validation_nodes
        nodes_timeline = [
            n for n in nodes if n.status not in [ValidationNodeStatus.NEW_VERSION, ValidationNodeStatus.SUBMISSION]
        ]
        nodes_timeline = [n for n in nodes_timeline if n.created_at >= obj.created_at]
        if obj.next_created_at:
            nodes_timeline = [n for n in nodes_timeline if n.created_at < obj.next_created_at]
        nodes_timeline = sorted(nodes_timeline, key=lambda n: n.updated_at, reverse=True)

        next_bypass = None
        if not obj.next_created_at and instance.general_validation_status == ValidationWorkflowArtefactStatus.PENDING:
            node_order = list(reversed(self.context["node_dumps"]))

            ordering = Case(
                *[When(slug=slug, then=pos) for pos, slug in enumerate(node_order)],
                output_field=IntegerField(),
            )

            next_bypass = (
                ValidationNodeTemplate.objects.prefetch_related("roles_required")
                .filter(
                    can_skip_previous_nodes=True,
                    workflow=instance.form.validation_workflow,
                )
                .filter(
                    Q(
                        ~Exists(
                            ValidationNode.objects.exclude(created_at__lt=obj.created_at).filter(
                                instance=instance,
                                node=OuterRef("pk"),
                            )
                        )
                    )
                    & Q(
                        ~Exists(
                            ValidationNode.objects.exclude(created_at__lt=obj.created_at).filter(
                                instance=instance,
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
            + NestedTimelineSerializer(nodes_timeline, context=self.context, many=True).data
        )


class ValidationWorkflowInstanceRetrieveSerializer(ModelSerializer):
    validation_status = serializers.CharField(read_only=True, source="general_validation_status")
    submissions = serializers.SerializerMethodField(read_only=True)
    total_steps = serializers.SerializerMethodField(read_only=True)

    workflow = serializers.CharField(read_only=True, source="form.validation_workflow.slug")

    class Meta:
        model = Instance
        fields = ["workflow", "total_steps", "validation_status", "submissions"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance:
            self.context["node_dumps"] = self.instance.form.validation_workflow.dump_nodes()
        request = self.context["request"]
        if request:
            user = request.user
            if user.iaso_profile:
                self.context["user_roles"] = user.iaso_profile.user_roles.values_list("pk", flat=True)

    @extend_schema_field(NestedSubmissionSerializer(many=True))
    def get_submissions(self, obj):
        nodes = obj.prefetched_submission_nodes
        return NestedSubmissionSerializer(nodes, many=True, context={**self.context, "instance": obj}).data

    @extend_schema_field(serializers.IntegerField)
    def get_total_steps(self, obj):
        return len(self.context.get("node_dumps", []))
