from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from oauth2client import client, crypt
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
    throttle_classes
)
from rest_framework.throttling import AnonRateThrottle
from rest_framework.response import Response
from django.http.request import HttpRequest
from django.http import HttpResponse
import logging

from .couchdb_helpers import create_or_update_user
from .models import MobileUser, DeviceDB

logger = logging.getLogger(__name__)


# Sync credentials endpoint
# Needs to be open since the mobile app doesn't have any creds
# is throttled
@csrf_exempt
@api_view(http_method_names=['POST'])
@throttle_classes([AnonRateThrottle])
@authentication_classes([])
@permission_classes([])
def signin(request: HttpRequest) -> HttpResponse:
    '''
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

    '''
    if settings.GOOGLE_CLIENT_ID == '':
        msg = 'Server is missing google client id'
        logger.error(msg)
        return Response(msg, status.HTTP_500_INTERNAL_SERVER_ERROR)

    token = request.data.get('idToken', '')
    if token == '':
        msg = 'No "idToken" sent'
        logger.error(msg)
        return Response(msg, status.HTTP_400_BAD_REQUEST)

    device_id = request.data.get('deviceId', '')
    if device_id == '':
        msg = 'No "deviceId" sent'
        logger.error(msg)
        return Response(msg, status.HTTP_400_BAD_REQUEST)

    # decrypt JWT token,
    # check signature against google's certs
    # checks that the token was generated for our clientId
    try:
        user_data = client.verify_id_token(
            token,
            settings.GOOGLE_CLIENT_ID
        )
    except client.VerifyJwtTokenError as err:
        logger.exception(str(err))
        return Response('Could not verify ID token', status.HTTP_500_INTERNAL_SERVER_ERROR)
    except crypt.AppIdentityError:
        msg = 'Invalid ID Token'
        logger.error(msg)
        return Response(msg, status.HTTP_401_UNAUTHORIZED)

    email = user_data.get('email', '')
    if email == '':
        msg = 'User data are missing email'
        logger.error(msg)
        return Response(msg, status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Check if mobile user does exist and is therefore allowed to sync
    try:
        MobileUser.objects.get(email=email)
    except MobileUser.DoesNotExist:
        # This is a user that comes from our app, but is not added to MobileUser list
        # That should trigger a different error message on the device
        msg = 'Mobile user does not exist'
        logger.error(msg)
        return Response(msg, status.HTTP_403_FORBIDDEN)

    # Create/Update the couch user of the mobile user and give permissions to the device db
    try:
        couchdb_config = create_or_update_user(email, device_id)
    except ValueError as err:
        logger.exception(str(err))
        return Response('Creating credentials failed', status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Get/Create the device db record and couchdb db
    try:
        device_db = DeviceDB.objects.get(device_id=device_id)
    except DeviceDB.DoesNotExist:
        logger.info('Creating db for device {}'.format(device_id))
        device_db = DeviceDB(device_id=device_id)
        device_db.save()

    payload = {
        'username': couchdb_config['username'],
        'password': couchdb_config['password'],
        # Send the url of the couchdb device-db for replication
        'url': request.build_absolute_uri('/_couchdb/' + device_db.db_name)
    }
    return Response(payload, status.HTTP_201_CREATED)
