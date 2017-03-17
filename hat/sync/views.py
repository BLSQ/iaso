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
        msg = 'User data is missing email'
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
