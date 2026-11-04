from rest_framework import serializers


class PlanningLevelTreeNodeSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    org_unit_type_id = serializers.IntegerField(read_only=True, allow_null=True)
    level = serializers.IntegerField(read_only=True)
    parent_id = serializers.IntegerField(
        read_only=True, allow_null=True, help_text="Closest ancestor in the level above"
    )
    has_geo_json = serializers.BooleanField(read_only=True)
    has_location = serializers.BooleanField(read_only=True)


class PlanningLevelGeometryQuerySerializer(serializers.Serializer):
    level = serializers.IntegerField(min_value=0, help_text="0 is the target geography of the planning")


class PlanningLevelFeaturePropertiesSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


class PlanningLevelFeatureSerializer(serializers.Serializer):
    type = serializers.CharField()
    id = serializers.IntegerField()
    geometry = serializers.JSONField()
    properties = PlanningLevelFeaturePropertiesSerializer()


class PlanningLevelGeometrySerializer(serializers.Serializer):
    type = serializers.CharField()
    features = PlanningLevelFeatureSerializer(many=True)
