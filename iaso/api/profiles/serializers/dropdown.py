from rest_framework import serializers

from iaso.models import Profile


class ProfileDropdownSerializer(serializers.ModelSerializer):
    value = serializers.IntegerField(read_only=True, source="user_id")
    label = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Profile
        fields = ["value", "label"]

    def get_label(self, obj):
        if not obj.user:
            return None

        username = obj.user.username

        if not obj.user.first_name and not obj.user.last_name:
            return username or ""

        full_name = obj.user.get_full_name()

        return f"{obj.user.username} ({full_name})" if full_name else obj.user.username
