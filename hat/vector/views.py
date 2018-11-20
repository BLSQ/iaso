from django.http import HttpRequest, HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes

from hat.vector.gpximport import gpximport


@csrf_exempt
@api_view(http_method_names=['POST'])
# @throttle_classes([AnonRateThrottle])
@authentication_classes([])
@permission_classes([])
def gpx_upload(request: HttpRequest) -> HttpResponse:
    gpx_file = request.FILES['gpx']
    if not gpx_file:
        return JsonResponse({"Error": "No gpx file provided"}, status=status.HTTP_400_BAD_REQUEST)

    gpx_import = gpximport(gpx_file.name, gpx_file.file, None)  # Should get user from request
    return JsonResponse(
        {'gpx_import_id': gpx_import.id, 'items': len(gpx_import.gpswaypoint_set)},
        status=status.HTTP_201_CREATED)
