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


class BaseNestedTimelineSerializer(ModelSerializer):
    user_can_do_actions = serializers.SerializerMethodField(read_only=True)
    order = serializers.SerializerMethodField(read_only=True)

    def get_required_roles(self, obj):
        raise NotImplementedError

    def get_node_slug(self, obj):
        raise NotImplementedError

    @extend_schema_field(serializers.BooleanField)
    def get_user_can_do_actions(self, obj):
        user = self.context["request"].user

        if user.is_superuser:
            return True

        user_role_ids = self.context.get(
            "user_roles",
            user.iaso_profile.user_roles.values_list("pk", flat=True),
        )

        required_role_ids = self.get_required_roles(obj)

        return set(required_role_ids).issubset(set(user_role_ids))

    @extend_schema_field(serializers.IntegerField)
    def get_order(self, obj):
        list_nodes = list(self.context["node_dumps"])
        return list_nodes.index(self.get_node_slug(obj)) + 1


class NestedTimelineSerializer(BaseNestedTimelineSerializer):
    name = serializers.CharField(read_only=True, source="node.name")
    node_template_slug = serializers.CharField(read_only=True, source="node.slug")
    updated_by = UserDisplayNameField(allow_null=True)
    type = serializers.SerializerMethodField(read_only=True)
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

    def get_node_slug(self, obj):
        return obj.node.slug

    def get_required_roles(self, obj):
        return [x.pk for x in obj.node.roles_required.all()]


class NestedTimelineNextBypassSerializer(BaseNestedTimelineSerializer):
    """
    Must be similar to NestedTimelineSerializer for swagger compliance (see get_timeline method) hence the get_methods that return None
    """

    node_template_slug = serializers.CharField(read_only=True, source="slug")
    updated_by = serializers.SerializerMethodField(read_only=True)
    status = serializers.SerializerMethodField(read_only=True)
    comment = serializers.SerializerMethodField(read_only=True)
    type = serializers.SerializerMethodField(read_only=True)

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

    def get_node_slug(self, obj):
        return obj.slug

    def get_required_roles(self, obj):
        return [x.pk for x in obj.roles_required.all()]


class NestedSubmissionSerializer(ModelSerializer):
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

    def _get_nodes_inside_submission_window(self, nodes, obj):
        nodes = [n for n in nodes if n.created_at >= obj.created_at]
        if obj.next_created_at:
            return [n for n in nodes if n.created_at < obj.next_created_at]
        return nodes

    @extend_schema_field(serializers.IntegerField)
    def get_active_steps(self, obj):
        instance = self._get_instance(obj)
        nodes = instance.prefetched_validation_nodes

        nodes = [
            n
            for n in self._get_nodes_inside_submission_window(nodes, obj)
            if n.status not in [ValidationNodeStatus.NEW_VERSION, ValidationNodeStatus.SUBMISSION]
        ]

        return len(nodes)

    @extend_schema_field(serializers.ChoiceField(choices=ValidationWorkflowArtefactStatus.choices))
    def get_general_validation_status(self, obj):
        instance = self._get_instance(obj)

        if not obj.next_created_at:
            return instance.general_validation_status

        nodes = instance.prefetched_validation_nodes
        rejected_nodes = [
            n for n in self._get_nodes_inside_submission_window(nodes, obj) if n.status == ValidationNodeStatus.REJECTED
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
            n
            for n in self._get_nodes_inside_submission_window(nodes, obj)
            if n.status not in [ValidationNodeStatus.NEW_VERSION, ValidationNodeStatus.SUBMISSION]
        ]
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
            vw = getattr(self.instance.form, "validation_workflow", None)
            if vw:
                self.context["node_dumps"] = vw.dump_nodes()
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
