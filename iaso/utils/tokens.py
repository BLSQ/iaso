"""
Token utility functions for Iaso API authentication.
"""

from rest_framework_simplejwt.tokens import RefreshToken  # type: ignore


def get_user_token(user):
    """
    Generate a JWT access token for a given user.

    Args:
        user: Django User instance

    Returns:
        str: JWT access token string
    """
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)


def get_user_refresh_token(user):
    """
    Generate a JWT refresh token for a given user.

    Args:
        user: Django User instance

    Returns:
        str: JWT refresh token string
    """
    refresh = RefreshToken.for_user(user)
    return str(refresh)
