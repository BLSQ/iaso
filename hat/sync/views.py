from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from oauth2client import client, crypt
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
    throttle_classes,
)
from rest_framework.throttling import AnonRateThrottle
from rest_framework.response import Response
from django.http.request import HttpRequest
from django.http import HttpResponse
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required, permission_required
from django.contrib.auth.models import User
from django.shortcuts import render, get_object_or_404, redirect

from hat.patient.identify import find_tests_by_image, find_tests_by_video
from .models import (
    ImageUpload,
    ImageUploadForm,
    VideoUpload,
    VideoUploadForm,
    DeviceEventForm,
)
from ..cases.models import TestGroup

import logging

from .couchdb_helpers import create_or_update_user
from .models import MobileUser, DeviceDB
from iaso.models import Instance, InstanceFile

logger = logging.getLogger(__name__)


@csrf_exempt
@api_view(http_method_names=["POST"])
@throttle_classes([AnonRateThrottle])
@authentication_classes([])
@permission_classes([])
def user_signin(request: HttpRequest) -> HttpResponse:
    """
    Endpoint that receives django user credentials and outputs corresponding couchdb credentials
    Allows only **POST** http method.
    `It's throttled. <http://www.django-rest-framework.org/api-guide/throttling/>`__
    Needs to be open since the mobile app doesn't have any dashboard credentials.

    **Steps**

    1. Checks ``deviceId`` parameter.

       .. warning:: If missing responses **400 -- Bad request**.
    2. Checks ``password`` and ``username`` parameters
    3. Creates/Updates the CouchDB user of the mobile user and grants
       permissions to the device database.

       .. warning:: The same google user account cannot be shared among devices
                    at the same time because every time the device signs in,
                    it changes the user CouchDB credentials.

       .. note:: The same device can have different google user accounts.

    4. Creates the DeviceDB record and the CouchDB database if missing.


    5. Responses **201 -- Created** with a payload with this schema:

        * ``username`` -- CouchDB credentials: username.
        * ``password`` -- CouchDB credentials: password.
        * ``url`` -- CouchDB device database url.

    """
    device_id = request.data.get("deviceId", "")
    if device_id == "":
        msg = 'No "deviceId" sent'
        logger.error(msg)
        return Response(msg, status.HTTP_400_BAD_REQUEST)

    username = request.data.get('username', '').rstrip()
    if username == '':
        msg = 'No "username" sent for device_id {}'.format(device_id)
        logger.error(msg)
        return Response(msg, status.HTTP_400_BAD_REQUEST)

    password = request.data.get('password', '').rstrip()
    if password == '':
        msg = 'No "password" sent (username "{}")'.format(username)
        logger.error(msg)
        return Response(msg, status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        msg = 'Username unknown: "{}"'.format(username)
        logger.error(msg)
        return Response(msg, status.HTTP_400_BAD_REQUEST)

    password_ok = user.check_password(password)

    if not password_ok:
        msg = 'Bad password for username: "{}"'.format(username)
        logger.error(msg)
        return Response(msg, status.HTTP_400_BAD_REQUEST)

    # Create/Update the couch user of the mobile user and give permissions to the device db
    try:
        couchdb_config = create_or_update_user(username, device_id)
    except ValueError as err:
        logger.exception(str(err))
        return Response(
            "Creating credentials failed", status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Get/Create the device db record and couchdb db
    try:
        device_db = DeviceDB.objects.get(device_id=device_id)
        if device_db.last_user != user:
            device_db.last_user = user
            device_db.save()
    except DeviceDB.DoesNotExist:
        logger.info('Creating db for device {} and user {} ({})'.format(device_id, username, user.id))
        device_db = DeviceDB(device_id=device_id, creator=user, last_user=user)
        device_db.save()

    payload = {
        "username": couchdb_config["username"],
        "password": couchdb_config["password"],
        # Send the url of the couchdb device-db for replication
        "url": request.build_absolute_uri("/_couchdb/" + device_db.db_name),
    }
    return Response(payload, status.HTTP_201_CREATED)


# Sync credentials endpoint
# Needs to be open since the mobile app doesn't have any creds
# is throttled
@csrf_exempt
@api_view(http_method_names=["POST"])
@throttle_classes([AnonRateThrottle])
@authentication_classes([])
@permission_classes([])
def signin(request: HttpRequest) -> HttpResponse:
    """
    Sync credentials endpoint.
    Allows only **POST** http method.
    `It's throttled. <http://www.django-rest-framework.org/api-guide/throttling/>`__
    Needs to be open since the mobile app doesn't have any dashboard credentials.

    **Steps**

    1. Checks internal ``GOOGLE_CLIENT_ID``.

       .. warning:: If missing responses **500 -- Internal server error**.

    2. Checks ``idToken`` parameter.

       .. warning:: If missing responses **400 -- Bad request**.

    3. Checks ``deviceId`` parameter.

       .. warning:: If missing responses **400 -- Bad request**.

    4. Verifies *ID token* against `GOOGLE API
       <https://console.developers.google.com/apis/credentials?project=sense-hat-mobile>`__
       and receives google user account data.

        .. warning:: If could not verify *ID token* responses **500 -- Internal server error**.
        .. warning:: If invalid *ID token* responses **401 -- Unauthorized**.

    5. Checks ``email`` in user account.

       .. warning:: If missing responses **500 -- Internal server error**.

    6. Checks if user account does exist and is therefore allowed to sync.

       .. warning:: If missing (was not added to :class:`hat.sync.models.MobileUser`)
                    responses **403 -- Forbidden**.

    7. Creates/Updates the CouchDB user of the mobile user and grants
       permissions to the device database.

       .. warning:: The same google user account cannot be shared among devices
                    at the same time because every time the device signs in,
                    it changes the user CouchDB credentials.

       .. note:: The same device can have different google user accounts.

    8. Creates the DeviceDB record and the CouchDB database if missing.


    9. Responses **201 -- Created** with a payload with this schema:

        * ``username`` -- CouchDB credentials: username.
        * ``password`` -- CouchDB credentials: password.
        * ``url`` -- CouchDB device database url.

    """
    if settings.GOOGLE_CLIENT_ID == "":
        msg = "Server is missing google client id"
        logger.error(msg)
        return Response(msg, status.HTTP_500_INTERNAL_SERVER_ERROR)

    token = request.data.get("idToken", "")
    if token == "":
        msg = 'No "idToken" sent'
        logger.error(msg)
        return Response(msg, status.HTTP_400_BAD_REQUEST)

    device_id = request.data.get("deviceId", "")
    if device_id == "":
        msg = 'No "deviceId" sent'
        logger.error(msg)
        return Response(msg, status.HTTP_400_BAD_REQUEST)

    # decrypt JWT token,
    # check signature against google's certs
    # checks that the token was generated for our clientId
    try:
        user_data = client.verify_id_token(token, settings.GOOGLE_CLIENT_ID)
    except client.VerifyJwtTokenError as err:
        logger.exception(str(err))
        return Response(
            "Could not verify ID token", status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except crypt.AppIdentityError:
        msg = "Invalid ID Token"
        logger.error(msg)
        return Response(msg, status.HTTP_401_UNAUTHORIZED)

    email = user_data.get("email", "")
    if email == "":
        msg = "User data are missing email"
        logger.error(msg)
        return Response(msg, status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Check if mobile user does exist and is therefore allowed to sync
    try:
        MobileUser.objects.get(email=email)
    except MobileUser.DoesNotExist:
        # This is a user that comes from our app, but is not added to MobileUser list
        # That should trigger a different error message on the device
        msg = "Mobile user does not exist"
        logger.error(msg)
        return Response(msg, status.HTTP_403_FORBIDDEN)

    # Create/Update the couch user of the mobile user and give permissions to the device db
    try:
        couchdb_config = create_or_update_user(email, device_id)
    except ValueError as err:
        logger.exception(str(err))
        return Response(
            "Creating credentials failed", status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Get/Create the device db record and couchdb db
    try:
        device_db = DeviceDB.objects.get(device_id=device_id)
    except DeviceDB.DoesNotExist:
        logger.info("Creating db for device {}".format(device_id))
        device_db = DeviceDB(
            device_id=device_id, creator=request.user, last_user=request.user
        )
        device_db.save()

    payload = {
        "username": couchdb_config["username"],
        "password": couchdb_config["password"],
        # Send the url of the couchdb device-db for replication
        "url": request.build_absolute_uri("/_couchdb/" + device_db.db_name),
    }
    return Response(payload, status.HTTP_201_CREATED)


@csrf_exempt
@api_view(http_method_names=["POST"])
# @throttle_classes([AnonRateThrottle])
@authentication_classes([])
@permission_classes([])
def form_upload(request: HttpRequest) -> HttpResponse:
    main_file = request.FILES["xml_submission_file"]
    i, created = Instance.objects.get_or_create(file_name=main_file.name)
    i.file = request.FILES["xml_submission_file"]
    i.save()

    for file_name in request.FILES:
        if file_name != "xml_submission_file":
            fi = InstanceFile()
            fi.file = request.FILES[file_name]
            fi.instance_id = i.id
            fi.name = file_name
            fi.save()

    return JsonResponse({"result": "success"}, status=201)


@csrf_exempt
@api_view(http_method_names=["POST"])
# @throttle_classes([AnonRateThrottle])
@authentication_classes([])
@permission_classes([])
def image_upload(request: HttpRequest) -> HttpResponse:
    img_form = ImageUploadForm(request.POST, request.FILES)
    if img_form.is_valid():
        try:
            img = img_form.save()
            if img.group_id:
                test_group, created = TestGroup.objects.get_or_create(
                    group_id=img.group_id
                )
                if created:
                    test_group.type = img.type
                    test_group.save()
            # Try to associate the image with a test
            tests = find_tests_by_image(request.FILES["image"].name, img.type, False)
            for test in tests:
                test.image = img
                test.save()
            return JsonResponse({"Result": "Upload ok"})
        except:
            logger.error(
                "Error saving picture %s", request.FILES["image"].name, exc_info=1
            )
            return JsonResponse({}, status=500)
    else:
        return JsonResponse(img_form.errors, status=400)


@csrf_exempt
@api_view(http_method_names=["POST"])
# @throttle_classes([AnonRateThrottle])
@authentication_classes([])
@permission_classes([])
def video_upload(request: HttpRequest) -> HttpResponse:
    video_form = VideoUploadForm(request.POST, request.FILES)
    if video_form.is_valid():
        video = video_form.save()
        # Try to associate the image with a test
        tests = find_tests_by_video(request.FILES["video"].name, video.type, False)
        for test in tests:
            test.video = video
            test.save()
        return JsonResponse({"Result": "Upload ok"})
    else:
        return JsonResponse(video_form.errors, status=400)


@login_required
@csrf_exempt
def device_event_form(request: HttpRequest, device_id) -> HttpResponse:
    if request.method == "POST":
        form = DeviceEventForm(request.POST)
        if form.is_valid():

            device_event = form.save(commit=False)
            device_event.reporter = request.user
            device_event.device_id = device_id
            device_event.save()
            return redirect("/dashboard/management")
        else:
            return JsonResponse(form.errors, status=400)
    else:
        form = DeviceEventForm()
    return render(
        request, "devices/device_event_form.html", {"user": request.user, "form": form}
    )
