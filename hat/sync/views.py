import logging

import jwt
from django.contrib.auth.models import User
from django.http import HttpResponse
from django.http import JsonResponse
from django.http.request import HttpRequest
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes, authentication_classes

from hat.audit.models import log_modification, INSTANCE_API
from hat.settings import SECRET_KEY
from iaso.models import Instance, InstanceFile, FeatureFlag

logger = logging.getLogger(__name__)


def detect_user_request(request):
    """Check if we can infer a user from the Authorization header of the upload request."""

    try:
        user = User.objects.get(
            pk=jwt.decode(request.headers["Authorization"][7:], SECRET_KEY, algorithms=["HS256"])["user_id"]
        )
        return user
    except:
        return None


@csrf_exempt
@api_view(http_method_names=["POST"])
@authentication_classes([])
@permission_classes([])
def form_upload(request: HttpRequest) -> HttpResponse:
    main_file = request.FILES["xml_submission_file"]
    instances = Instance.objects.filter(file_name=main_file.name)
    i: Instance
    if instances:
        # TODO: investigate: can we have an empty QS here?
        i = instances.first()  # type: ignore
    else:
        i = Instance(file_name=main_file.name)

    i.file = request.FILES["xml_submission_file"]
    user = request.user if not request.user.is_anonymous else detect_user_request(request)
    i.created_by = user
    i.last_modified_by = user
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

    log_modification(i, i, source=INSTANCE_API, user=user)

    return JsonResponse({"result": "success"}, status=201)
