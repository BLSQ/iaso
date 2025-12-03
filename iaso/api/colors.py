from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from iaso.utils.colors import COLOR_CHOICES, DISPERSED_COLOR_ORDER


class ColorsQueryParamsSerializer(serializers.Serializer):
    dispersed = serializers.BooleanField(
        default=False,
        required=False,
        help_text="If true, returns colors in a dispersed order where similar colors are not adjacent",
    )


@api_view(["GET"])
# public API to avoid breaking embedded pages
@permission_classes([])
def colors_list(request):
    """Return the list of available colors for the application

    Query parameters:
    - dispersed: if 'true', returns colors in a dispersed order where similar colors are not adjacent
    """
    serializer = ColorsQueryParamsSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    dispersed = serializer.validated_data["dispersed"]

    if dispersed:
        colors = [{"value": COLOR_CHOICES[i][0], "label": COLOR_CHOICES[i][1]} for i in DISPERSED_COLOR_ORDER]
    else:
        colors = [{"value": color[0], "label": color[1]} for color in COLOR_CHOICES]

    return Response(colors)
