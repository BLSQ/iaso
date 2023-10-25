from datetime import date, datetime
from enum import Enum
from typing import TypedDict
from typing_extensions import Annotated

from django.db import transaction
from drf_yasg.utils import swagger_serializer_method
from rest_framework import serializers

from iaso.api.common import DynamicFieldsModelSerializer, TimestampField
from iaso.models.microplanning import Team
from plugins.polio.models import Campaign, Round
from plugins.polio.api.campaigns.campaigns import CampaignSerializer
from plugins.polio.api.shared_serializers import UserSerializer
from .models import (
    BudgetStep,
    BudgetStepFile,
    BudgetStepLink,
    model_field_exists,
    send_budget_mails,
    get_workflow,
    BudgetProcess,
)
from .workflow import next_transitions, can_user_transition, Category, effective_teams


class TransitionSerializer(serializers.Serializer):
    key = serializers.CharField()
    # https://github.com/typeddjango/djangorestframework-stubs/issues/78 bug in mypy remove in future
    label = serializers.CharField()  # type: ignore
    help_text = serializers.CharField()  # type: ignore
    allowed = serializers.BooleanField()
    reason_not_allowed = serializers.CharField(required=False)
    required_fields = serializers.ListField(child=serializers.CharField())
    displayed_fields = serializers.ListField(child=serializers.CharField())
    # Note : implemented as a Css class in the frontend. Color of the button for approval
    color = serializers.ChoiceField(choices=["primary", "green", "red"], required=False)
    emails_destination_team_ids = serializers.ListField(child=serializers.IntegerField(), required=False)


class NestedTransitionSerializer(TransitionSerializer):
    key = serializers.CharField()
    # https://github.com/typeddjango/djangorestframework-stubs/issues/78 bug in mypy remove in future
    label = serializers.CharField()  # type: ignore


class NodeSerializer(serializers.Serializer):
    key = serializers.CharField()
    # https://github.com/typeddjango/djangorestframework-stubs/issues/78 bug in mypy remove in future
    label = serializers.CharField()  # type: ignore


class WorkflowSerializer(serializers.Serializer):
    states = NodeSerializer(many=True, source="nodes")


class CategoryItemSerializer(serializers.Serializer):
    # https://github.com/typeddjango/djangorestframework-stubs/issues/78 bug in mypy remove in future
    label = serializers.CharField()  # type: ignore
    performed_by = UserSerializer(required=False)
    performed_at = serializers.DateTimeField(required=False)
    step_id = serializers.IntegerField(required=False)
    skipped = serializers.BooleanField(required=False)
    cancelled = serializers.BooleanField(required=False)


class CategorySerializer(serializers.Serializer):
    key = serializers.CharField()
    # https://github.com/typeddjango/djangorestframework-stubs/issues/78 bug in mypy remove in future
    label = serializers.CharField()  # type: ignore
    color = serializers.CharField(help_text="Color completed according to the progress")
    items = CategoryItemSerializer(many=True)
    completed = serializers.BooleanField(help_text="Every step in the category is done")
    active = serializers.BooleanField(help_text="Category has been started")


class TimelineSerializer(serializers.Serializer):
    categories = CategorySerializer(many=True)


class RoundSerializerForProcesses(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = ["id", "number"]


# noinspection PyMethodMayBeStatic
class CampaignBudgetSerializer(CampaignSerializer, DynamicFieldsModelSerializer):
    class Meta:
        model = Campaign
        fields = [
            "created_at",
            "id",
            "obr_name",
            "country_name",
            "current_state",
            "next_transitions",
            "budget_last_updated_at",
            "possible_states",
            "cvdpv2_notified_at",
            "possible_transitions",
            "timeline",
            "processes",
        ]
        default_fields = [
            "created_at",
            "id",
            "obr_name",
            "country_name",
            "current_state",
            "budget_last_updated_at",
            "processes",
        ]

    # added via annotation
    budget_last_updated_at = serializers.DateTimeField(required=False, help_text="Last budget update on the campaign")
    current_state = serializers.SerializerMethodField()
    # To be used for override
    possible_states = serializers.SerializerMethodField()
    possible_transitions = serializers.SerializerMethodField()
    timeline = serializers.SerializerMethodField()
    processes = serializers.SerializerMethodField()

    next_transitions = serializers.SerializerMethodField()
    # will need to use country__name for sorting
    country_name: serializers.SlugRelatedField = serializers.SlugRelatedField(
        source="country", slug_field="name", read_only=True
    )

    @staticmethod
    def get_processes(campaign: Campaign):
        processes = BudgetProcess.objects.filter(rounds__campaign=campaign)
        return BudgetProcessSerializer(processes, many=True).data

    def get_current_state(self, campaign: Campaign):
        workflow = get_workflow()
        try:
            node = workflow.get_node_by_key(campaign.budget_current_state_key)
        except:
            return {
                "key": campaign.budget_current_state_key,
                "label": campaign.budget_current_state_key,
            }
        else:
            return {
                "key": campaign.budget_current_state_key,
                "label": node.label,
            }

    @swagger_serializer_method(serializer_or_field=TransitionSerializer(many=True))
    def get_next_transitions(self, campaign):
        # // get transition from workflow engine.
        workflow = get_workflow()
        transitions = next_transitions(workflow.transitions, campaign.budget_current_state_key)
        user = self.context["request"].user
        for transition in transitions:
            allowed = can_user_transition(transition, user, campaign)
            transition.allowed = allowed
            if not allowed:
                if not effective_teams(campaign, transition.teams_ids_can_transition):
                    reason = "No team configured for this country and transition"
                else:
                    reason = "User doesn't have permission"
                transition.reason_not_allowed = reason

            # FIXME: filter on effective teams, need campaign
            teams = []
            for _, teams_ids in transition.emails_to_send:
                teams += effective_teams(campaign, teams_ids).values_list("id", flat=True)
            transition.emails_destination_team_ids = set(teams)

        return TransitionSerializer(transitions, many=True).data

    # this is used for filter dropdown
    @swagger_serializer_method(serializer_or_field=NodeSerializer(many=True))
    def get_possible_states(self, _campaign):
        workflow = get_workflow()
        nodes = workflow.nodes
        return NodeSerializer(nodes, many=True).data

    # this is used for filter dropdown
    @swagger_serializer_method(serializer_or_field=TransitionSerializer(many=True))
    def get_possible_transitions(self, _campaign):
        workflow = get_workflow()
        transitions = workflow.transitions
        return NestedTransitionSerializer(transitions, many=True).data

    @swagger_serializer_method(serializer_or_field=TimelineSerializer())
    def get_timeline(self, campaign):
        """Represent the progression of the budget process, per category

        State/Nodes are stored in category.
        For each category, we return a merge between the Step leading to that node and the node that we still need to visit
        (marked as mandatory).

        So you will get something like
        CategoryA:
           NodeA : Performed by Xavier on 1 Jan
           NodeB : Performed by Olivier on 2 Feb
           NodeC : to do

        We also return a color to mark the progress in each category. In the future we may want to modulate this
        color according to the delay.

        We may want to cache this in the future because this a bit of calculation, and only change when a step is done,
        but it is not critical for now as we only query one campaign at the time in the current design.

        """
        workflow = get_workflow()
        r = []
        c: Category
        steps = list(campaign.budget_steps.filter(deleted_at__isnull=True).order_by("created_at"))

        override_steps = list(
            campaign.budget_steps.filter(deleted_at__isnull=True)
            .filter(transition_key="override")
            .order_by("created_at")
        )
        all_nodes = workflow.nodes

        for c in workflow.categories:
            items = []
            node_dict = {node.key: node for node in c.nodes}
            node_passed_by = set()  # Keys
            node_remaining = set()
            step: BudgetStep
            for step in steps:
                to_node_key = step.node_key_to
                # mitigation for old steps with don't have node_key_to
                if not step.node_key_to:
                    if step.transition_key not in workflow.transitions_dict:
                        continue
                    transition = workflow.transitions_dict[step.transition_key]
                    to_node_key = transition.to_node
                    # if step.transition_key == "override"
                    # we need to access the actual step to get the to_node_key, as the one in the workflow is generic and not to be used

                if to_node_key in node_dict.keys():
                    # If this is in the category
                    node = node_dict[to_node_key]
                    for other_key in node.mark_nodes_as_completed:
                        if other_key not in node_passed_by:
                            other_node = node_dict.get(other_key)
                            items.append(
                                {
                                    "label": other_node.label,
                                    "performed_by": step.created_by,
                                    "performed_at": step.created_at,
                                    "step_id": step.id,
                                    "order": other_node.order,
                                    "key": other_node.key,
                                    "mandatory": other_node.mandatory,
                                }
                            )
                            node_passed_by.add(other_key)

                    items.append(
                        {
                            "label": node.label,
                            "performed_by": step.created_by,
                            "performed_at": step.created_at,
                            "step_id": step.id,
                            "order": node.order,
                            "key": node.key,
                            "mandatory": node.mandatory,
                        }
                    )
                    node_passed_by.add(to_node_key)
            for node in c.nodes:  # Node are already sorted
                if not node.mandatory:
                    continue
                if node.key in node_passed_by:
                    continue
                node_remaining.add(node.key)
                items.append(
                    {
                        "label": node.label,
                        "order": node.order,
                        "key": node.key,
                        "mandatory": node.mandatory,
                    }
                )
            r.append(
                {
                    "label": c.label,
                    "key": c.key,
                    "items": items,
                }
            )

        override_step: BudgetStep
        for override_step in override_steps:
            start_node_key = override_step.node_key_from
            destination_node_key = override_step.node_key_to
            # TODO check if list contains one and only one element
            start_node_list = [node for node in all_nodes if node.key == start_node_key]
            start_node = start_node_list[0]
            start_position = start_node.order
            destination_node_list = [node for node in all_nodes if node.key == destination_node_key]
            destination_node = destination_node_list[0]  # This is buggy with the latest config  migration
            destination_position = destination_node.order
            is_skipping = destination_position >= start_position
            reference_date = override_step.created_at
            for section in r:
                for item in section["items"]:
                    if reference_date >= item.get(
                        "performed_at", reference_date
                    ):  # I think using reference date wold create problems with overrides that don't happen on the same day
                        item_order = item["order"]
                        if (
                            is_skipping
                            and item_order > start_position
                            and item_order < destination_position
                            and not item.get("step_id", None)
                        ):
                            item["skipped"] = True
                            item["cancelled"] = False
                        # This is an edge case for when 2 steps have the same order (ie: have to done at the same time,
                        # but with no determined priority, eg: UNICEF Co sends budget and WHO CO sends budget)
                        # We then add a check on the label.
                        elif (
                            is_skipping
                            and item_order >= start_position
                            and item_order < destination_position
                            and item["label"] != start_node.label
                            and not item.get("step_id", None)
                        ):
                            item["skipped"] = True
                            item["cancelled"] = False
                        elif item_order <= start_position and item_order > destination_position and not is_skipping:
                            if item.get("skipped", False) and not item.get("step_id", None):
                                item["cancelled"] = False
                                item["skipped"] = False
                            else:
                                item["skipped"] = False
                                item["cancelled"] = True

        for index, section in enumerate(r):
            mandatory_nodes = list(filter(lambda node: node.mandatory == True, workflow.categories[index].nodes))
            mandatory_nodes_passed = list(filter(lambda x: x.get("mandatory") == True, section["items"]))
            uncancelled_mandatory_nodes_passed = list(
                filter(
                    lambda i: i.get("step_id", None) or i.get("skipped", False),
                    list(filter(lambda i: i.get("cancelled", False) != True, mandatory_nodes_passed)),
                )
            )

            uncancelled_mandatory_nodes_labels = []
            for uncancelled_node in uncancelled_mandatory_nodes_passed:
                uncancelled_mandatory_nodes_labels.append(uncancelled_node["label"])
            unique_nodes_passed = set(uncancelled_mandatory_nodes_labels)
            if len(unique_nodes_passed) == len(mandatory_nodes):
                section["completed"] = True
                section["active"] = False
                section["color"] = "green"
            elif len(unique_nodes_passed) > 0:
                section["completed"] = False
                section["active"] = True
                section["color"] = "yellow"
            else:
                section["completed"] = False
                section["active"] = False
                section["color"] = "grey"

        return TimelineSerializer({"categories": r}).data


class TransitionError(Enum):
    INVALID_TRANSITION = "invalid_transition"
    NOT_ALLOWED = "user_not_allowed"
    MISSING_FIELD = "missing_field"


class BudgetLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetStepLink
        fields = [
            "id",
            "url",
            "alias",
        ]


class TransitionToSerializer(serializers.Serializer):
    transition_key = serializers.CharField()
    campaign = serializers.PrimaryKeyRelatedField(queryset=Campaign.objects.all())
    comment = serializers.CharField(required=False)
    files = serializers.ListField(child=serializers.FileField(), required=False)
    links = serializers.JSONField(required=False)
    amount = serializers.FloatField(required=False)

    def validate(self, attrs):
        return attrs
        pass

    def validate_links(self, value):
        return value

    def save(self, **kwargs):
        data = self.validated_data
        campaign: Campaign = data["campaign"]
        user = self.context["request"].user
        transition_key = data["transition_key"]

        workflow = get_workflow()

        n_transitions = next_transitions(workflow.transitions, campaign.budget_current_state_key)
        # find transition
        transitions = [t for t in n_transitions if t.key == transition_key]
        if not transitions:
            raise serializers.ValidationError(
                {
                    "transition_key": [
                        TransitionError.INVALID_TRANSITION,
                        f"Valid transitions: {[t.key for t in n_transitions]}",
                    ]
                }
            )
        transition = transitions[0]
        if not can_user_transition(transition, user, campaign):
            raise serializers.ValidationError({"transition_key": [TransitionError.NOT_ALLOWED]})

        for field in transition.required_fields:
            if field == "attachments":
                if len(data.get("files", [])) < 1 and len(data.get("links", [])) < 1:
                    raise Exception(TransitionError.MISSING_FIELD)
            elif field not in data:
                raise Exception(TransitionError.MISSING_FIELD)

        created_by_team = None
        # first team the user belong to that can make the event
        if transition.teams_ids_can_transition:
            created_by_team = Team.objects.filter(id__in=transition.teams_ids_can_transition).filter(users=user).first()
        if not created_by_team:
            created_by_team = Team.objects.filter(users=user).first()
        # this will raise if not found, should only happen for invalid workflow.
        node = workflow.get_node_by_key(transition.to_node)
        with transaction.atomic():
            step = BudgetStep.objects.create(
                amount=data.get("amount"),
                created_by=user,
                created_by_team=created_by_team,
                campaign=campaign,
                comment=data.get("comment"),
                transition_key=transition.key,
                node_key_from=campaign.budget_current_state_key,
                node_key_to=transition.to_node,
            )
            for link_data in data.get("links", []):
                link_serializer = BudgetLinkSerializer(data=link_data)
                link_serializer.is_valid(raise_exception=True)
                link_serializer.save(step=step)

            campaign.budget_current_state_key = transition.to_node
            for file in data.get("files", []):
                step.files.create(file=file, filename=file.name)
            campaign.budget_current_state_label = node.label
            campaign.save()

            send_budget_mails(step, transition, self.context["request"])
            step.is_email_sent = True
            step.save()
            processes = BudgetProcess.objects.filter(rounds__pk__in=[c_round.pk for c_round in campaign.rounds.all()])
            # FIXME Must Be saved to BudgetProcess instead of campaign
            with transaction.atomic():
                field = transition.to_node + "_at_WFEDITABLE"
                if model_field_exists(campaign, field):
                    # Write the value only if doesn't exist yet, this way we keep track of when a step was first submitted
                    if not getattr(campaign, field, None):
                        setattr(campaign, field, step.created_at)
                        setattr(campaign, "budget_status", transition.to_node)
                        # Custom checks for current workflow. Since we're checking the destination, we'll miss the data for the "concurrent steps".
                        # eg: if we move from state "who_sent_budget" to "gpei_consolidated_budgets", we will miss "unicef_sent_budget" without this check
                        # Needs to be updated when state key names change
                        if transition.to_node == "gpei_consolidated_budgets":
                            if campaign.who_sent_budget_at_WFEDITABLE is None:
                                setattr(campaign, "who_sent_budget_at_WFEDITABLE", step.created_at)
                            elif campaign.unicef_sent_budget_at_WFEDITABLE is None:
                                setattr(campaign, "unicef_sent_budget_at_WFEDITABLE", step.created_at)
                        if transition.to_node == "approved":
                            if campaign.approved_by_who_at_WFEDITABLE is None:
                                setattr(campaign, "approved_by_who_at_WFEDITABLE", step.created_at)
                            elif campaign.approved_by_unicef_at_WFEDITABLE is None:
                                setattr(campaign, "approved_by_unicef_at_WFEDITABLE", step.created_at)
                        campaign.save()

        return step


class TransitionOverrideSerializer(serializers.Serializer):
    new_state_key = serializers.CharField()
    campaign = serializers.PrimaryKeyRelatedField(queryset=Campaign.objects.all())
    comment = serializers.CharField(required=False)
    files = serializers.ListField(child=serializers.FileField(), required=False)
    links = serializers.JSONField(required=False)
    amount = serializers.FloatField(required=False)

    def save(self, **kwargs):
        data = self.validated_data
        campaign: Campaign = data["campaign"]
        user = self.context["request"].user
        node_keys = data["new_state_key"]
        workflow = get_workflow()

        n_transitions = next_transitions(workflow.transitions, campaign.budget_current_state_key)
        # find the override transition in the workflow
        transition_as_list = list(filter(lambda tr: tr.key == "override", workflow.transitions))
        if len(transition_as_list) == 0:
            raise Exception("override step not found in workflow")
        transition = transition_as_list[0]

        created_by_team = None
        if not created_by_team:
            created_by_team = Team.objects.filter(users=user).first()
        # we can get several keys aggregated eg: "submitted_to_rrt,re_submitted_to_rrt", so we split and keep the first one
        node_key = node_keys.split(",")[0]
        # this will raise if not found, should only happen for invalid workflow.
        to_node = workflow.get_node_by_key(node_key)
        with transaction.atomic():
            step = BudgetStep.objects.create(
                amount=data.get("amount"),
                created_by=user,
                created_by_team=created_by_team,
                campaign=campaign,
                comment=data.get("comment"),
                transition_key="override",
                node_key_to=to_node.key,
                node_key_from=campaign.budget_current_state_key,
            )
            for link_data in data.get("links", []):
                link_serializer = BudgetLinkSerializer(data=link_data)
                link_serializer.is_valid(raise_exception=True)
                link_serializer.save(step=step)

            # campaign.budget_current_state_key = node_key
            # for file in data.get("files", []):
            #     step.files.create(file=file, filename=file.name)
            # campaign.budget_current_state_label = to_node.label
            # campaign.save()
            # saving step before sending email to allow send_budget_emails to have access to the step's transition_key
            step.save()
            send_budget_mails(step, transition, self.context["request"])
            step.is_email_sent = True
            step.save()
            with transaction.atomic():
                field = to_node.key + "_at_WFEDITABLE"
                if model_field_exists(campaign, field):
                    # since we override, we don't check that the field is empty
                    setattr(campaign, field, step.created_at)
                    setattr(campaign, "budget_status", to_node.key)
                    order = to_node.order
                    nodes_to_cancel = workflow.get_nodes_after(order)
                    campaign_fields_to_cancel = [node.key + "_at_WFEDITABLE" for node in nodes_to_cancel]
                    # steps that come after the step we override to are cancelled
                    for field_to_cancel in campaign_fields_to_cancel:
                        if model_field_exists(campaign, field):
                            if getattr(campaign, field_to_cancel, None):
                                setattr(campaign, field_to_cancel, None)
                    campaign.save()

            campaign.budget_current_state_key = node_key
            for file in data.get("files", []):
                step.files.create(file=file, filename=file.name)
            campaign.budget_current_state_label = to_node.label
            campaign.save()

        return step


class BudgetFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetStepFile
        fields = [
            "id",
            "file",  # url
            "filename",
            "permanent_url",
        ]

    permanent_url = serializers.URLField(source="get_absolute_url", read_only=True)


class BudgetStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetStep
        fields = [
            "id",
            "created_at",
            "created_by_team",
            "created_by",
            "deleted_at",
            "campaign_id",
            "comment",
            "links",
            "files",
            "amount",
            "transition_key",
            "transition_label",
        ]

    transition_label = serializers.SerializerMethodField()
    files = BudgetFileSerializer(many=True)
    links = BudgetLinkSerializer(many=True)
    created_by_team: serializers.SlugRelatedField = serializers.SlugRelatedField(slug_field="name", read_only=True)
    created_by = UserSerializer()

    @swagger_serializer_method(serializer_or_field=serializers.CharField)
    def get_transition_label(self, budget_step: BudgetStep) -> str:
        workflow = get_workflow()
        return workflow.get_transition_label_safe(budget_step.transition_key)


class UpdateBudgetStepSerializer(serializers.ModelSerializer):
    """Update serializer for budget update, the only allowed field is deleted_at to restore it"""

    class Meta:
        model = BudgetStep
        fields = [
            "deleted_at",
        ]


class LastBudgetAnnotation(TypedDict):
    budget_last_updated_at: datetime


# TODO: TO DELETE REPLACE BY ExportBudgetProcessSerializer
# noinspection PyMethodMayBeStatic
class ExportCampaignBudgetSerializer(CampaignBudgetSerializer):
    class Meta:
        model = Campaign
        fields = ["obr_name", "budget_current_state_label", "country", "cvdpv2_notified_at", "budget_last_updated_at"]
        labels = {
            "obr_name": "OBR name",
            "budget_last_updated_at": "Last update",
            "cvdpv2_notified_at": "Notification date",
            "country": "Country",
            "budget_current_state_label": "Budget state",
        }

    country = serializers.SerializerMethodField()
    budget_last_updated_at = serializers.SerializerMethodField()  # type: ignore

    def get_country(self, campaign: Campaign):
        return campaign.country.name if campaign.country else None

    def get_budget_last_updated_at(self, campaign: Annotated[Campaign, LastBudgetAnnotation]):
        if campaign.budget_last_updated_at:
            return campaign.budget_last_updated_at.strftime("%Y-%m-%d")


class BudgetProcessForBudgetSerializer(serializers.ModelSerializer):
    rounds = RoundSerializerForProcesses(many=True, read_only=True)
    campaign = serializers.SerializerMethodField()

    class Meta:
        model = BudgetProcess
        fields = [
            "id",
            "created_at",
            "updated_at",
            "rounds",
            "teams",
            "budget_status",
            "ra_completed_at_WFEDITABLE",
            "who_sent_budget_at_WFEDITABLE",
            "unicef_sent_budget_at_WFEDITABLE",
            "gpei_consolidated_budgets_at_WFEDITABLE",
            "submitted_to_rrt_at_WFEDITABLE",
            "feedback_sent_to_gpei_at_WFEDITABLE",
            "re_submitted_to_rrt_at_WFEDITABLE",
            "submitted_to_orpg_operations1_at_WFEDITABLE",
            "feedback_sent_to_rrt1_at_WFEDITABLE",
            "re_submitted_to_orpg_operations1_at_WFEDITABLE",
            "submitted_to_orpg_wider_at_WFEDITABLE",
            "submitted_to_orpg_operations2_at_WFEDITABLE",
            "feedback_sent_to_rrt2_at_WFEDITABLE",
            "re_submitted_to_orpg_operations2_at_WFEDITABLE",
            "submitted_for_approval_at_WFEDITABLE",
            "feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE",
            "feedback_sent_to_orpg_operations_who_at_WFEDITABLE",
            "approved_by_who_at_WFEDITABLE",
            "approved_by_unicef_at_WFEDITABLE",
            "approved_at_WFEDITABLE",
            "approval_confirmed_at_WFEDITABLE",
            "payment_mode",
            "budget_responsible",
            "budget_current_state_key",
            "budget_current_state_label",
            "district_count",
            "no_regret_fund_amount",
            "who_disbursed_to_co_at",
            "who_disbursed_to_moh_at",
            "unicef_disbursed_to_co_at",
            "unicef_disbursed_to_moh_at",
            "campaign",
        ]

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    @staticmethod
    def get_campaign(budget_process: BudgetProcess) -> str:
        campaign = Campaign.objects.filter(pk=budget_process.rounds.all()[0].campaign.pk)
        serializer = CampaignBudgetSerializer(campaign, many=True).data
        serializer.is_valid()
        return serializer.data


class BudgetProcessSerializer(serializers.ModelSerializer):
    rounds = RoundSerializerForProcesses(many=True, read_only=True)

    class Meta:
        model = BudgetProcess
        fields = [
            "id",
            "created_at",
            "updated_at",
            "rounds",
            "teams",
            "budget_status",
            "ra_completed_at_WFEDITABLE",
            "who_sent_budget_at_WFEDITABLE",
            "unicef_sent_budget_at_WFEDITABLE",
            "gpei_consolidated_budgets_at_WFEDITABLE",
            "submitted_to_rrt_at_WFEDITABLE",
            "feedback_sent_to_gpei_at_WFEDITABLE",
            "re_submitted_to_rrt_at_WFEDITABLE",
            "submitted_to_orpg_operations1_at_WFEDITABLE",
            "feedback_sent_to_rrt1_at_WFEDITABLE",
            "re_submitted_to_orpg_operations1_at_WFEDITABLE",
            "submitted_to_orpg_wider_at_WFEDITABLE",
            "submitted_to_orpg_operations2_at_WFEDITABLE",
            "feedback_sent_to_rrt2_at_WFEDITABLE",
            "re_submitted_to_orpg_operations2_at_WFEDITABLE",
            "submitted_for_approval_at_WFEDITABLE",
            "feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE",
            "feedback_sent_to_orpg_operations_who_at_WFEDITABLE",
            "approved_by_who_at_WFEDITABLE",
            "approved_by_unicef_at_WFEDITABLE",
            "approved_at_WFEDITABLE",
            "approval_confirmed_at_WFEDITABLE",
            "payment_mode",
            "budget_responsible",
            "budget_current_state_key",
            "budget_current_state_label",
            "district_count",
            "no_regret_fund_amount",
            "who_disbursed_to_co_at",
            "who_disbursed_to_moh_at",
            "unicef_disbursed_to_co_at",
            "unicef_disbursed_to_moh_at",
        ]

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)


class BudgetProcessCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetProcess
        fields = [
            "id",
            "created_at",
            "updated_at",
            "rounds",
            "teams",
            "budget_status",
            "ra_completed_at_WFEDITABLE",
            "who_sent_budget_at_WFEDITABLE",
            "unicef_sent_budget_at_WFEDITABLE",
            "gpei_consolidated_budgets_at_WFEDITABLE",
            "submitted_to_rrt_at_WFEDITABLE",
            "feedback_sent_to_gpei_at_WFEDITABLE",
            "re_submitted_to_rrt_at_WFEDITABLE",
            "submitted_to_orpg_operations1_at_WFEDITABLE",
            "feedback_sent_to_rrt1_at_WFEDITABLE",
            "re_submitted_to_orpg_operations1_at_WFEDITABLE",
            "submitted_to_orpg_wider_at_WFEDITABLE",
            "submitted_to_orpg_operations2_at_WFEDITABLE",
            "feedback_sent_to_rrt2_at_WFEDITABLE",
            "re_submitted_to_orpg_operations2_at_WFEDITABLE",
            "submitted_for_approval_at_WFEDITABLE",
            "feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE",
            "feedback_sent_to_orpg_operations_who_at_WFEDITABLE",
            "approved_by_who_at_WFEDITABLE",
            "approved_by_unicef_at_WFEDITABLE",
            "approved_at_WFEDITABLE",
            "approval_confirmed_at_WFEDITABLE",
            "payment_mode",
            "budget_responsible",
            "budget_current_state_key",
            "budget_current_state_label",
            "district_count",
            "no_regret_fund_amount",
            "who_disbursed_to_co_at",
            "who_disbursed_to_moh_at",
            "unicef_disbursed_to_co_at",
            "unicef_disbursed_to_moh_at",
        ]

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["created_by"] = user
        instance = super(BudgetProcessCreateSerializer, self).create(validated_data)

        return instance

    def validate_rounds(self, value):
        # Check if a BudgetProcess with the same round(s) already exists
        if self.instance and self.instance.pk:
            existing_budget_processes = BudgetProcess.objects.exclude(pk=self.instance.pk).filter(rounds__in=value)
        else:
            existing_budget_processes = BudgetProcess.objects.filter(rounds__in=value)

        if existing_budget_processes.exists():
            raise serializers.ValidationError("A BudgetProcess with the same Round(s) already exists.")

        return value


class ExportBudgetProcessSerializer(serializers.ModelSerializer):

    """This serializer is for data representation only, therefore all fields are ready_only"""

    obr_name = serializers.SerializerMethodField()
    country = serializers.SerializerMethodField()
    cvdpv2_notified_at = serializers.SerializerMethodField()
    budget_last_updated_at = serializers.SerializerMethodField()

    class Meta:
        model = BudgetProcess
        fields = ["obr_name", "budget_current_state_label", "country", "cvdpv2_notified_at", "budget_last_updated_at"]
        labels = {
            "obr_name": "OBR name",
            "budget_last_updated_at": "Last update",
            "cvdpv2_notified_at": "Notification date",
            "country": "Country",
            "budget_current_state_label": "Budget state",
        }
        read_only_fields = [
            "obr_name",
            "budget_current_state_label",
            "country",
            "cvdpv2_notified_at",
            "budget_last_updated_at",
        ]

        cvdpv2_notified_at = TimestampField(read_only=True)
        budget_last_updated_at = TimestampField(read_only=True)

    @staticmethod
    def get_obr_name(obj: BudgetProcess) -> str:
        return obj.campaign.obr_name

    @staticmethod
    def get_country(obj: BudgetProcess) -> str:
        return obj.campaign.country

    @staticmethod
    def get_cvdpv2_notified_at(obj: BudgetProcess) -> date:
        return obj.campaign.cvdpv2_notified_at

    @staticmethod
    def get_budget_last_updated_at(obj: BudgetProcess) -> date:
        return obj.updated_at
