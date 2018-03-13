import sys
from rest_framework import serializers

from hat.quality.models import Check
from hat.cases.models import RES_UNUSED


class CheckSerializer(serializers.Serializer):
    result = serializers.IntegerField(min_value=-3, max_value=4, required=False)
    validator = serializers.CharField(required=False)
    test_id = serializers.IntegerField()

    def create(self, validated_data):
        validator = self.context['request'].user
        check = Check(
            result=validated_data.get('result', RES_UNUSED),
            validator=validator,
            test_id=validated_data.get('test_id')
        )
        check.save()
        return check

    def update(self, instance, validated_data):
        instance.result = validated_data.get('result', instance.result)
        instance.validator = self.context['request'].user
        instance.test_id = validated_data.get('test_id', instance.test_id)
        instance.save()
        return instance
