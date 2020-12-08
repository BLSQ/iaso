from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from django.http.request import HttpRequest
from django.http import HttpResponse
from django.http import JsonResponse

import logging

from iaso.models import Instance, InstanceFile, FeatureFlag

logger = logging.getLogger(__name__)


@csrf_exempt
@api_view(http_method_names=["POST"])
# @throttle_classes([AnonRateThrottle])
@authentication_classes([])
@permission_classes([])
def form_upload(request: HttpRequest) -> HttpResponse:
    main_file = request.FILES["xml_submission_file"]
    instances = Instance.objects.filter(file_name=main_file.name)
    if instances:
        i = instances.first()
    else:
        i = Instance(file_name=main_file.name)

    i.file = request.FILES["xml_submission_file"]
    i.save()

    try:
        i.get_and_save_json_of_xml()
        try:
            i.convert_location_from_field()
            i.convert_device()
            i.convert_correlation()
        except ValueError as error:
            print(error)
    except:
        pass

    for file_name in request.FILES:
        if file_name != "xml_submission_file":
            fi = InstanceFile()
            fi.file = request.FILES[file_name]
            fi.instance_id = i.id
            fi.name = file_name
            fi.save()

    if i.project and i.project.has_feature(FeatureFlag.INSTANT_EXPORT):
        i.export()

    return JsonResponse({"result": "success"}, status=201)
