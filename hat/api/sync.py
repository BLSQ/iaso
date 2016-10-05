from django.core.exceptions import MultipleObjectsReturned
from django.conf import settings
from oauth2client import client, crypt
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from hat.sync.credentials import create_or_update
from hat.sync.models import MobileUser


@api_view(http_method_names=['POST'])
def setup_sync_user(request):
    token = request.data['idToken']

    try:
        # decrypt JWT token,
        # check signature against google's certs
        # checks that the token was generated for our clientId
        user_data = client.verify_id_token(
                token,
                settings.GOOGLE_CLIENT_ID
            )

        email = user_data['email']
        user = MobileUser.objects.get(email=email)
        credentials = create_or_update(email)
        user.db_name = credentials['db_name']
        user.couchdb_id = credentials['_id']
        user.save()
    except ValueError:
        return Response('No Token Sent', status.HTTP_400_BAD_REQUEST)
    except crypt.AppIdentityError:
        return Response('Invalid ID Token', status.HTTP_401_UNAUTHORIZED)
    # This is a user that comes from our app, but is not added to MobileSync list
    # That should trigger a different error message on the device
    except MobileUser.DoesNotExist:
        return Response('User not allowed to sync', status.HTTP_403_FORBIDDEN)
    except MultipleObjectsReturned:
        return Response('User not allowed to sync', status.HTTP_403_FORBIDDEN)
