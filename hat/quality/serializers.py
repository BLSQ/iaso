import sys
from rest_framework import serializers

from hat.quality.models import Check
from hat.cases.models import RES_UNUSED


class CheckSerializer(serializers.Serializer):
    result = serializers.IntegerField(min_value=-3, max_value=4, required=False)
    validator = serializers.CharField(required=False)
    test_id = serializers.IntegerField()
    comment = serializers.CharField(required=False, allow_blank=True)
    level = serializers.IntegerField(required=False)
    is_clear = serializers.NullBooleanField(required=False)
    is_good_place = serializers.NullBooleanField(required=False)
    is_confirmed_case = serializers.NullBooleanField(required=False)
    has_other_parasite = serializers.NullBooleanField(required=False)

    def create(self, validated_data):
        validator = self.context["request"].user
        level = self.context["request"].user.profile.level
        check = Check(
            result=validated_data.get("result", RES_UNUSED),
            validator=validator,
            test_id=validated_data.get("test_id"),
            comment=validated_data.get("comment"),
            level=level,
            is_clear=validated_data.get("is_clear", False),
            is_good_place=validated_data.get("is_good_place", False),
            is_confirmed_case=validated_data.get("is_confirmed_case", False),
            has_other_parasite=validated_data.get("has_other_parasite", False),
        )
        check.save()
        return check

    def update(self, instance, validated_data):
        instance.result = validated_data.get("result", instance.result)
        instance.validator = self.context["request"].user
        instance.level = self.context["request"].user.profile.level
        instance.test_id = validated_data.get("test_id", instance.test_id)
        instance.save()
        return instance
