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
import logging

from hat.sync.credentials import create_or_update
from hat.sync.models import MobileUser

logger = logging.getLogger(__name__)


# Sync credentials endpoint
# Needs to be open since the mobile app doesn't have any creds
# is throttled
@csrf_exempt
@api_view(http_method_names=['POST'])
@throttle_classes([AnonRateThrottle])
@authentication_classes([])
@permission_classes([])
def setup_sync_user(request):
    if settings.GOOGLE_CLIENT_ID == '':
        return Response('Server is missing google client id',
                        status.HTTP_500_INTERNAL_SERVER_ERROR)

    token = request.data.get('idToken', '')
    if token == '':
        return Response('No "idToken" sent', status.HTTP_400_BAD_REQUEST)

    # decrypt JWT token,
    # check signature against google's certs
    # checks that the token was generated for our clientId
    try:
        user_data = client.verify_id_token(
            token,
            settings.GOOGLE_CLIENT_ID
        )
    except client.VerifyJwtTokenError as err:
        logger.exception(err)
        return Response('Could not verify ID token', status.HTTP_500_INTERNAL_SERVER_ERROR)
    except crypt.AppIdentityError:
        return Response('Invalid ID Token', status.HTTP_401_UNAUTHORIZED)

    email = user_data.get('email', '')
    if email == '':
        return Response('User data is missing email', status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        user = MobileUser.objects.get(email=email)
    except MobileUser.DoesNotExist:
        # This is a user that comes from our app, but is not added to MobileUser list
        # That should trigger a different error message on the device
        return Response('Mobile user does not exist', status.HTTP_403_FORBIDDEN)

    try:
        credentials = create_or_update(email)
    except ValueError as err:
        logger.exception(err)
        return Response('Creating credentials failed', status.HTTP_500_INTERNAL_SERVER_ERROR)

    user.db_name = credentials['db_name']
    user.couchdb_id = credentials['_id']
    user.save()

    payload = {
        **credentials,
        # Send the url of couchdb for replication
        'couchdb_url': request.build_absolute_uri('/_couchdb')
    }
    return Response(payload, status.HTTP_201_CREATED)
