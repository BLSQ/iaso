from django.http import HttpRequest, HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes

from hat.api.authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication

from hat.vector_control.gpximport import gpximport


@csrf_exempt
@api_view(http_method_names=['POST'])
# @throttle_classes([AnonRateThrottle])
@authentication_classes((CsrfExemptSessionAuthentication, BasicAuthentication))
@permission_classes([])
def gpx_upload(request: HttpRequest) -> HttpResponse:
    imports = []
    for gpx_file in request.FILES.getlist('gpx'):
        gpx_import = gpximport(gpx_file.name, gpx_file.file, request.user)  # Should get user from request
        imports.append(
            {
                'gpx_import_id': gpx_import.id,
                'count': gpx_import.target_set.count(),
                'fileName': gpx_file.name
            }
        )
    print ('imports', imports)

    if len(imports) > 0:
        return JsonResponse(
            { "imports": imports },
            status=status.HTTP_201_CREATED)
    else :
        return JsonResponse({"Error": "No gpx file provided"}, status=status.HTTP_400_BAD_REQUEST)