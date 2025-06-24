from rest_framework import serializers

from iaso.api.query_params import IMAGE_ONLY


class ImageOnlySerializer(serializers.Serializer):
    f"""
    Serializer for `{IMAGE_ONLY}` when passed in query_params.
    If `raise_exception` is `False` but the data is not valid, `False` is returned.

    Used to handle parsing and errors:

        image_only = ImageOnlySerializer(data=self.request.query_params).get_image_only(raise_exception=True)
    """

    image_only = serializers.BooleanField(default=False)

    def get_image_only(self, raise_exception: bool) -> bool:
        if not self.is_valid(raise_exception=raise_exception):
            return False
        return self.data[IMAGE_ONLY]
