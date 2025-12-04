import logging

import jwt

from django.contrib.auth.models import User
from django.http import HttpResponse, JsonResponse
from django.http.request import HttpRequest
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, authentication_classes, permission_classes

from hat.audit.models import INSTANCE_API, log_modification
from hat.settings import SECRET_KEY
from iaso.models import FeatureFlag, Instance, InstanceFile


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


def process_instance_file(instance, file, user):
    instance.file = file
    instance.created_by = user
    instance.last_modified_by = user
    instance.save()

    instance.get_and_save_json_of_xml()
    try:
        instance.convert_location_from_field()
        instance.convert_device()
        instance.convert_correlation()
    except ValueError as error:
        logger.exception(error)

    return instance


def create_instance_file(instance, file_name, file):
    fi = InstanceFile()
    fi.file = file
    fi.instance_id = instance.id
    fi.name = file_name
    fi.save()
    return fi


@csrf_exempt
@api_view(http_method_names=["POST"])
@authentication_classes([])
@permission_classes([])
def form_upload(request: HttpRequest) -> HttpResponse:
    """
    This endpoint is called when uploading instances "manually" (not in bulk).
    It should be the second call (after POST /api/instances/) but sometimes, it is not (network error...).
    This endpoint takes the empty instance (no actual files) created by the previous call and fills it with missing data.
    """
    main_file = request.FILES["xml_submission_file"]
    instances = Instance.objects.filter(file_name=main_file.name)
    i: Instance
    if instances:
        # TODO: investigate: can we have an empty QS here?
        i = instances.first()  # type: ignore
    else:
        i = Instance(file_name=main_file.name)

    user = request.user if not request.user.is_anonymous else detect_user_request(request)

    try:
        i = process_instance_file(i, request.FILES["xml_submission_file"], user)
    except:
        pass

    for file_name in request.FILES:
        if file_name != "xml_submission_file":
            create_instance_file(i, file_name, request.FILES[file_name])

    if i.project and i.project.has_feature(FeatureFlag.INSTANT_EXPORT):
        i.export()

    log_modification(i, i, source=INSTANCE_API, user=user)

    return JsonResponse({"result": "success"}, status=201)
