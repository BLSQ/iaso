from rest_framework import serializers


class FileTypeSerializer(serializers.Serializer):
    image_only = serializers.BooleanField(default=False)
    video_only = serializers.BooleanField(default=False)
    document_only = serializers.BooleanField(default=False)
    other_only = serializers.BooleanField(default=False)
