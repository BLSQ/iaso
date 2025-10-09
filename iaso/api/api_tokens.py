from rest_framework import serializers, viewsets
from rest_framework.response import Response

from iaso.utils.tokens import get_user_token


class APITokenSerializer(serializers.Serializer):
    token = serializers.CharField()


class APITokenViewSet(viewsets.ViewSet):
    """
    Used to obtain a token usable for the API.
    This is only really useful when the login/password authentication is disabled and only SSO is active.
    """

    def list(self, request):
        token = get_user_token(request.user)

        serializer = APITokenSerializer({"token": token})
        return Response(serializer.data)
