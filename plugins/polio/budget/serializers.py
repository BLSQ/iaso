from drf_yasg.utils import swagger_serializer_method
from rest_framework import serializers

from plugins.polio.models import Campaign
from plugins.polio.serializers import CampaignSerializer
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
