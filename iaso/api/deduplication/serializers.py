from rest_framework import serializers
from rest_framework.relations import PrimaryKeyRelatedField

from iaso.models import EntityDuplicate


class BulkIgnoreRequestSerializer(serializers.Serializer):
    select_all = serializers.BooleanField(required=True)
    selected_ids = PrimaryKeyRelatedField(
        queryset=EntityDuplicate.objects.get_queryset(), many=True, required=True, allow_empty=True
    )
    unselected_ids = PrimaryKeyRelatedField(
        queryset=EntityDuplicate.objects.get_queryset(), many=True, required=True, allow_empty=True
    )

    def validate(self, validated_data):
        request = self.context.get("request")
        account = request.user.iaso_profile.account
        if not all(
            d.entity1.account == account and d.entity2.account == account for d in validated_data["selected_ids"]
        ):
            raise serializers.ValidationError("Not all duplicates are in the user's account")
        if not all(
            d.entity1.account == account and d.entity2.account == account for d in validated_data["unselected_ids"]
        ):
            raise serializers.ValidationError("Not all duplicates are in the user's account")
        return validated_data
