from rest_framework import serializers

from iaso.api.query_params import IMAGE_ONLY


class ImageOnlySerializer(serializers.Serializer):
    f"""
    Serializer for `{IMAGE_ONLY}` when passed in query_params.
    """

    image_only = serializers.BooleanField(default=False)


class VideoOnlySerializer(serializers.Serializer):
    video_only = serializers.BooleanField(default=False)


class DocumentOnlySerializer(serializers.Serializer):
    document_only = serializers.BooleanField(default=False)


class OtherOnlySerializer(serializers.Serializer):
    other_only = serializers.BooleanField(default=False)
