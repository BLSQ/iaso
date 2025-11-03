"""
Utilities for OpenHEXA integration.

Provides configuration management and decorators for accessing OpenHEXA workspace settings.
"""

import logging

from functools import wraps

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from rest_framework import status
from rest_framework.response import Response

from iaso.models.openhexa import OpenHEXAWorkspace


logger = logging.getLogger(__name__)


def get_openhexa_config(user):
    """
    Retrieve OpenHexa configuration from OpenHEXAWorkspace and OpenHEXAInstance models.

    Args:
        user: The authenticated user making the request

    Returns:
        tuple: (openhexa_url, openhexa_token, workspace_slug, workspace)

    Raises:
        ValidationError: If configuration not found or invalid
    """
    try:
        # Get the user's account
        account = user.iaso_profile.account

        # Fetch OpenHEXAWorkspace for this account
        try:
            workspace = OpenHEXAWorkspace.objects.select_related("openhexa_instance").get(account=account)
        except OpenHEXAWorkspace.DoesNotExist:
            logger.error(f"No OpenHEXA workspace configured for account '{account.name}' (ID: {account.id})")
            raise ValidationError(_("No OpenHEXA workspace configured for your account"))
        except OpenHEXAWorkspace.MultipleObjectsReturned:
            logger.error(f"Multiple OpenHEXA workspaces found for account '{account.name}' (ID: {account.id})")
            raise ValidationError(_("Multiple OpenHEXA workspaces configured for your account"))

        # Get workspace slug
        workspace_slug = workspace.slug
        if not workspace_slug:
            logger.error(f"OpenHEXA workspace for account '{account.name}' has no slug configured")
            raise ValidationError(_("OpenHEXA workspace has no slug configured"))

        # Get OpenHEXA instance configuration
        openhexa_instance = workspace.openhexa_instance
        openhexa_url = openhexa_instance.url
        openhexa_token = openhexa_instance.token

        if not openhexa_url:
            logger.error(f"OpenHEXA instance '{openhexa_instance.name}' has no URL configured")
            raise ValidationError(_("OpenHEXA instance has no URL configured"))

        if not openhexa_token:
            logger.error(f"OpenHEXA instance '{openhexa_instance.name}' has no token configured")
            raise ValidationError(_("OpenHEXA instance has no token configured"))

        # Validate that the URL contains 'graphql'
        if "graphql" not in openhexa_url.lower():
            logger.error(f"OpenHexa URL does not contain 'graphql': {openhexa_url}")
            raise ValidationError(_("OpenHEXA URL must contain 'graphql'"))

        return openhexa_url, openhexa_token, workspace_slug, workspace

    except AttributeError:
        logger.exception(f"User {user.id} has no iaso_profile or account")
        raise ValidationError(_("User profile or account not found"))
    except ValidationError:
        # Re-raise ValidationErrors from inner try block
        raise
    except Exception:
        logger.exception(f"Could not fetch OpenHEXA config for user {user.id}")
        raise ValidationError(_("OpenHexa configuration not found"))


def with_openhexa_config(func):
    """
    Generic decorator for standalone functions that need OpenHEXA config.

    The decorator calls get_openhexa_config() and injects the result as 'openhexa_config' kwarg.
    Raises ValidationError if configuration is invalid (caller must handle).

    Usage in management commands, tasks, or standalone functions:
        @with_openhexa_config
        def process_data(user, data, openhexa_config=None):
            openhexa_url, openhexa_token, workspace_slug, workspace = openhexa_config
            # ... rest of logic
    """

    @wraps(func)
    def wrapper(user, *args, **kwargs):
        config = get_openhexa_config(user)  # Raises ValidationError if invalid
        kwargs["openhexa_config"] = config
        return func(user, *args, **kwargs)

    return wrapper


def require_openhexa_config(func):
    """
    Decorator that ensures OpenHEXA config is available before executing the view method.

    The decorator calls get_openhexa_config() and injects the result as 'openhexa_config' kwarg.
    If configuration is invalid, returns a 422 error response.

    Usage in ViewSet methods:
        @require_openhexa_config
        def my_view(self, request, openhexa_config=None):
            openhexa_url, openhexa_token, workspace_slug, workspace = openhexa_config
            # ... rest of logic
    """

    @wraps(func)
    def wrapper(self, request, *args, **kwargs):
        try:
            config = get_openhexa_config(request.user)
            kwargs["openhexa_config"] = config
            return func(self, request, *args, **kwargs)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    return wrapper
