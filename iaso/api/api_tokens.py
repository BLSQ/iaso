from rest_framework import serializers, viewsets
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken  # type: ignore


class APITokenSerializer(serializers.Serializer):
    token = serializers.CharField()


class APITokenViewSet(viewsets.ViewSet):
    """
    Used to obtain a token usable for the API.
    This is only really useful when the login/password authentication is disabled and only SSO is active.
    """

    def list(self, request):
        refresh = RefreshToken.for_user(request.user)
        token = str(refresh.access_token)

        serializer = APITokenSerializer({"token": token})
        return Response(serializer.data)
