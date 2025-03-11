import requests

from django.conf import settings
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status, viewsets
from rest_framework.response import Response


@swagger_auto_schema()
class SupersetTokenViewSet(viewsets.ViewSet):
    """
    POST /api/superset/token

    This endpoint creates a "guest token" to embed private Superset dashboards
    in an iframe in Iaso (typically via a "Page")

    See:
    https://www.npmjs.com/package/@superset-ui/embedded-sdk
    """

    def create(self, request):
        dashboard_id = request.data.get("dashboard_id")

        base_url = settings.SUPERSET_URL
        headers = {"Content-Type": "application/json"}

        # Log in to Superset to get access_token
        payload = {
            "username": settings.SUPERSET_ADMIN_USERNAME,
            "password": settings.SUPERSET_ADMIN_PASSWORD,
            "provider": "db",
            "refresh": True,
        }
        response = requests.post(base_url + "/api/v1/security/login", json=payload, headers=headers)
        access_token = response.json()["access_token"]
        headers["Authorization"] = f"Bearer {access_token}"

        # Fetch CSRF token
        response = requests.get(base_url + "/api/v1/security/csrf_token/", headers=headers)
        headers["X-CSRF-TOKEN"] = response.json()["result"]
        headers["Cookie"] = response.headers.get("Set-Cookie")
        headers["Referer"] = base_url

        # Fetch Guest token
        current_user = request.user

        row_level_security_clauses = []
        if current_user.trypelim_profile and current_user.trypelim_profile.coordination:
            row_level_security_clauses = [
                {"clause": f"\"Coordination\"='{current_user.trypelim_profile.coordination.name}'"},
            ]

        payload = {
            "user": {
                "username": current_user.username,
                "first_name": current_user.first_name,
                "last_name": current_user.last_name,
            },
            "resources": [{"type": "dashboard", "id": dashboard_id}],
            "rls": row_level_security_clauses,
        }

        response = requests.post(base_url + "/api/v1/security/guest_token/", json=payload, headers=headers)
        guest_token = response.json()["token"]

        return Response({"token": guest_token}, status=status.HTTP_201_CREATED)
