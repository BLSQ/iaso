import sys
from rest_framework import serializers

from hat.quality.models import Check

from hat.cases.models import RES_POSITIVE, RES_NEGATIVE


class CheckSerializer(serializers.Serializer):
    result = serializers.IntegerField(min_value=-4, max_value=4, required=False)
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
        result = validated_data.get("result", None)
        if (
            result is None
        ):  # results for videos are handled differently, this is a way to identify them
            result = (
                RES_POSITIVE
                if validated_data.get("is_confirmed_case", False)
                else RES_NEGATIVE
            )

        check = Check(
            result=result,
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
