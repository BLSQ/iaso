# iaso/api/exception_handler.py
from rest_framework import status
from rest_framework.exceptions import NotAuthenticated
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if isinstance(exc, NotAuthenticated):
        return Response(
            {"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED
        )

    return response
