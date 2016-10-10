from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from oauth2client import client, crypt
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
import logging

from hat.sync.credentials import create_or_update
from hat.sync.models import MobileUser

logger = logging.getLogger(__name__)


# TODO: add @throttle_classes
# This view is accessed from the mobile app,
# is there a way to do csrf or do we just have to accept exempt?
@csrf_exempt
@api_view(http_method_names=['POST'])
@authentication_classes([])
@permission_classes([])
def setup_sync_user(request):
    try:
        token = request.data['idToken']

        assert token, 'No token set'
        assert settings.GOOGLE_CLIENT_ID, \
            'No Client ID Set, that means the token can come from anywhere!'

        # decrypt JWT token,
        # check signature against google's certs
        # checks that the token was generated for our clientId
        user_data = client.verify_id_token(
                token,
                settings.GOOGLE_CLIENT_ID
            )

        email = user_data['email']

        assert email

        user = MobileUser.objects.get(email=email)
        credentials = create_or_update(email)
        user.db_name = credentials['db_name']
        user.couchdb_id = credentials['_id']
        user.save()
        return Response(credentials, status.HTTP_201_CREATED)
    except ValueError:
        return Response('No Token Sent', status.HTTP_400_BAD_REQUEST)
    except crypt.AppIdentityError:
        return Response('Invalid ID Token', status.HTTP_401_UNAUTHORIZED)
    # This is a user that comes from our app, but is not added to MobileSync list
    # That should trigger a different error message on the device
    except MobileUser.DoesNotExist:
        return Response('User not allowed to sync', status.HTTP_403_FORBIDDEN)
    except AssertionError:
        return Response('Malformed Token.', status.HTTP_400_BAD_REQUEST)
    except Exception as err:
        logger.exception(err)
        return Response('Internal server error', status.HTTP_500_INTERNAL_SERVER_ERROR)
