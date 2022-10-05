from enum import Enum

from django.db import transaction
from drf_yasg.utils import swagger_serializer_method
from rest_framework import serializers

from iaso.models.microplanning import Team
from plugins.polio.models import Campaign
from plugins.polio.serializers import CampaignSerializer
from .models import BudgetStep
from .workflow import get_workflow, next_transitions, can_user_transition


class TransitionSerializer(serializers.Serializer):
    key = serializers.CharField()
    label = serializers.CharField()
    help_text = serializers.CharField()
    allowed = serializers.BooleanField()
    reason_not_allowed = serializers.CharField(required=False)
    required_fields = serializers.ListField(child=serializers.CharField())
    displayed_fields = serializers.ListField(child=serializers.CharField())


# noinspection PyMethodMayBeStatic
class CampaignBudgetSerializer(CampaignSerializer):
    # Todo set dynamic serializer
    class Meta:
        model = Campaign
        fields = ["created_at", "id", "obr_name", "country_name", "current_state", "next_transitions"]

    current_state = serializers.SerializerMethodField()
    next_transitions = serializers.SerializerMethodField()
    # will need to use country__name for sorting
    country_name = serializers.SlugRelatedField(source="country", slug_field="name", read_only=True)

    def get_current_state(self, campaign: Campaign):
        return {
            "key": campaign.budget_current_state_key,
            "label": campaign.budget_current_state_label,
        }

    @swagger_serializer_method(serializer_or_field=TransitionSerializer)
    def get_next_transitions(self, campaign):
        # // get transition from workflow engine.
        workflow = get_workflow()
        transitions = next_transitions(workflow.transitions, campaign.budget_current_state_key)
        user = self.context["request"].user
        for transition in transitions:
            allowed = can_user_transition(transition, user)
            transition.allowed = allowed
            if not allowed:
                transition.reason_not_allowed = "User doesn't have permission"

        return TransitionSerializer(transitions, many=True).data


class TransitionError(Enum):
    INVALID_TRANSITION = "invalid_transition"
    NOT_ALLOWED = "user_not_allowed"
    MISSING_FIELD = "missing_field"


class TransitionToSerializer(serializers.Serializer):
    transition_key = serializers.CharField()
    campaign = serializers.PrimaryKeyRelatedField(queryset=Campaign.objects.all())
    comment = serializers.CharField()
    files = serializers.ListField(child=serializers.FileField(), required=False)
    links = serializers.ListField(child=serializers.CharField(), required=False)
    amount = serializers.FloatField(required=False)

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
        if not can_user_transition(transition, user):
            raise serializers.ValidationError({"transition_key": [TransitionError.NOT_ALLOWED]})

        for field in transition.required_fields:
            if field not in data:
                raise Exception(TransitionError.MISSING_FIELD)

        # first team the user belong to that can make the event
        created_by_team = Team.objects.filter(id__in=transition.teams_ids_can_transition).filter(users=user).first()
        if not created_by_team:
            created_by_team = Team.objects.filter(users=user).first()
        # this will raise if not found, sould only happen for invalid workflow.
        node = workflow.get_node_by_key(transition.to_node)
        with transaction.atomic():
            step = BudgetStep.objects.create(
                amount=data.get("amount"),
                links=data.get("links"),
                created_by=user,
                created_by_team=created_by_team,
                campaign=campaign,
                transition_key=transition.key,
            )
            campaign.budget_current_state_key = transition.to_node

            campaign.budget_current_state_label = node.label
            campaign.save()

        return step


class BudgetStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetStep
        fields = [
            "id",
            "created_at",
            "created_by_team",
            "created_by",
            "campaign_id",
            "comment",
            "links",
            "files",
            "amount",
            "transition_key",
            "transition_label",
        ]

    transition_label = serializers.SerializerMethodField()

    @swagger_serializer_method(serializer_or_field=serializers.CharField)
    def get_transition_label(self, budget_step: BudgetStep):
        workflow = get_workflow()
        transition = workflow.get_transition_by_key(budget_step.transition_key)
        return transition.label
