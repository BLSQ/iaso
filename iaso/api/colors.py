from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from iaso.constants import COLOR_CHOICES


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def colors_list(request):
    """Return the list of available colors for the application"""
    colors = [{"value": color[0], "label": color[1]} for color in COLOR_CHOICES]
    return Response(colors)

