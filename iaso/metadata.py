from rest_framework.metadata import SimpleMetadata
from django.core.exceptions import PermissionDenied
from django.http import Http404
from rest_framework.request import clone_request
from rest_framework import exceptions


class CustomSimpleMetaData(SimpleMetadata):
    def determine_actions(self, request, view):
        """
        Override of DRF's determine_actions to avoid having to authorize POST requests in order for OPTIONS requests to return 'choices' fields.
        Other than removing the check on authorized http methods and limiting to POST, the original DRF code is unchanged: https://github.com/encode/django-rest-framework/blob/8e304e1adbb0f99f91a15ed3abd379104bba3b89/rest_framework/metadata.py#L78
        """
        actions = {}
        # Limiting to POST, because PUT throws an exception and we only need POST anyway
        for method in {"POST"}:
            view.request = clone_request(request, method)
            try:
                # Test global permissions
                if hasattr(view, "check_permissions"):
                    view.check_permissions(view.request)
                # Test object permissions
                if method == "PUT" and hasattr(view, "get_object"):
                    view.get_object()
            except (exceptions.APIException, PermissionDenied, Http404):
                pass
            else:
                # If user has appropriate permissions for the view, include
                # appropriate metadata about the fields that should be supplied.
                serializer = view.get_serializer()
                actions[method] = self.get_serializer_info(serializer)
            finally:
                view.request = request

        return actions
