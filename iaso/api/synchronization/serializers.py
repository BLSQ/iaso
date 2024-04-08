from rest_framework import serializers


class ZipFileSerializer(serializers.Serializer):
    zip_file = serializers.FileField()

    def validateZipFile(self):
        if self.is_valid():
            return self.validated_data["zip_file"]
        raise ValueError("Zip file not valid")
