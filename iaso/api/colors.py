from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from iaso.utils.colors import COLOR_CHOICES, DISPERSED_COLOR_ORDER


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def colors_list(request):
    """Return the list of available colors for the application

    Query parameters:
    - dispersed: if 'true', returns colors in a dispersed order where similar colors are not adjacent
    """
    dispersed = request.query_params.get("dispersed", "").lower() == "true"

    if dispersed:
        colors = [{"value": COLOR_CHOICES[i][0], "label": COLOR_CHOICES[i][1]} for i in DISPERSED_COLOR_ORDER]
    else:
        colors = [{"value": color[0], "label": color[1]} for color in COLOR_CHOICES]

    return Response(colors)
