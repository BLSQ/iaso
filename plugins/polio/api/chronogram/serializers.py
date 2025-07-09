from django.contrib.auth.models import User
from rest_framework import serializers

from iaso.api.common import DynamicFieldsModelSerializer
from plugins.polio import permissions as polio_permissions
from plugins.polio.models import Campaign, Chronogram, ChronogramTask, ChronogramTemplateTask, Round


class UserNestedSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="get_full_name")

    class Meta:
        model = User
        fields = ["id", "username", "full_name"]


class ChronogramTaskSerializer(DynamicFieldsModelSerializer, serializers.ModelSerializer):
    def get_fields(self, *args, **kwargs):
        fields = super().get_fields(*args, **kwargs)
        user = getattr(self.context.get("request", {}), "user", None)

        if user and user.has_perm(polio_permissions.POLIO_CHRONOGRAM):
            return fields

        # Restrict writable fields for the `POLIO_CHRONOGRAM_RESTRICTED_WRITE` permission.
        if user and user.has_perm(polio_permissions.POLIO_CHRONOGRAM_RESTRICTED_WRITE):
            allowed_fields = ["status", "user_in_charge", "comment"]
            read_only_fields = [field for field in fields if field not in allowed_fields]
            for field in read_only_fields:
                fields[field].read_only = True

        return fields

    created_by = UserNestedSerializer(read_only=True)
    updated_by = UserNestedSerializer(read_only=True)
    deadline_date = serializers.DateField(read_only=True, source="annotated_deadline_date")
    delay_in_days = serializers.IntegerField(read_only=True, source="annotated_delay_in_days")

    class Meta:
        model = ChronogramTask
        fields = [
            "id",
            "chronogram",
            "period",
            "get_period_display",
            "description",  # This will be automatically translated depending on the active language.
            "description_en",
            "description_fr",
            "start_offset_in_days",
            "deadline_date",
            "status",
            "get_status_display",
            "user_in_charge",
            "delay_in_days",
            "comment",
            "created_at",
            "created_by",
            "updated_at",
            "updated_by",
        ]
        default_fields = [
            "id",
            "chronogram",
            "period",
            "get_period_display",
            "description",
            "description_en",
            "description_fr",
            "start_offset_in_days",
            "deadline_date",
            "status",
            "get_status_display",
            "user_in_charge",
            "delay_in_days",
            "comment",
        ]
        extra_kwargs = {
            "id": {"read_only": True},
            "description": {"read_only": True},
            "deadline_date": {"read_only": True},
            "created_at": {"read_only": True},
            "updated_at": {"read_only": True},
            "get_period_display": {"read_only": True},
            "get_status_display": {"read_only": True},
        }


class ChronogramSerializer(DynamicFieldsModelSerializer, serializers.ModelSerializer):
    campaign_obr_name = serializers.CharField(source="round.campaign.obr_name")
    round_number = serializers.CharField(source="round.number")
    round_start_date = serializers.CharField(source="round.started_at")
    is_on_time = serializers.BooleanField(read_only=True, source="annotated_is_on_time")
    percentage_of_completion = serializers.DictField(read_only=True)
    num_task_delayed = serializers.IntegerField(read_only=True, source="annotated_num_task_delayed")
    tasks = ChronogramTaskSerializer(many=True, read_only=True)
    created_by = UserNestedSerializer(read_only=True)
    updated_by = UserNestedSerializer(read_only=True)

    class Meta:
        model = Chronogram
        fields = [
            "id",
            "campaign_obr_name",
            "round_number",
            "round_start_date",
            "is_on_time",
            "num_task_delayed",
            "percentage_of_completion",
            "tasks",
            "created_at",
            "created_by",
            "updated_at",
            "updated_by",
        ]
        default_fields = [
            "id",
            "campaign_obr_name",
            "round_number",
            "round_start_date",
            "is_on_time",
            "num_task_delayed",
            "percentage_of_completion",
        ]
        extra_kwargs = {
            "created_at": {"read_only": True},
            "updated_at": {"read_only": True},
        }


class ChronogramTemplateTaskSerializer(DynamicFieldsModelSerializer, serializers.ModelSerializer):
    class Meta:
        model = ChronogramTemplateTask
        fields = [
            "id",
            "account",
            "period",
            "get_period_display",
            "description",  # This will be automatically translated depending on the active language.
            "description_en",
            "description_fr",
            "start_offset_in_days",
            "created_at",
            "created_by",
            "updated_at",
            "updated_by",
        ]
        default_fields = [
            "id",
            "account",
            "period",
            "get_period_display",
            "description",
            "description_en",
            "description_fr",
            "start_offset_in_days",
        ]
        extra_kwargs = {
            "account": {"read_only": True},
            "created_at": {"read_only": True},
            "description": {"read_only": True},
            "updated_at": {"read_only": True},
            "get_period_display": {"read_only": True},
        }

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["created_by"] = UserNestedSerializer(instance.created_by, read_only=True).data
        representation["updated_by"] = UserNestedSerializer(instance.updated_by, read_only=True).data
        return representation


class ChronogramCreateSerializer(serializers.Serializer):
    round = serializers.PrimaryKeyRelatedField(queryset=Round.objects.all())

    def validate_round(self, round: Round) -> Round:
        if not round.started_at:
            raise serializers.ValidationError(f"Round ID {round.id} doesn't have a `started_at` value.")

        if Chronogram.objects.valid().filter(round=round).exists():
            raise serializers.ValidationError("A chronogram with this round already exists.")

        user = self.context["request"].user
        user_rounds = Campaign.polio_objects.filter_for_user(user).values_list("rounds", flat=True)
        if round.pk not in user_rounds:
            raise serializers.ValidationError("Unauthorized round for this user.")

        return round

    def save(self, **kwargs) -> Chronogram:
        round = self.validated_data["round"]
        return ChronogramTemplateTask.objects.create_chronogram(round=round, created_by=kwargs["created_by"])
