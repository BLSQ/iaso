from django.core.exceptions import PermissionDenied
from django.http import Http404
from django.utils.encoding import force_str
from rest_framework import exceptions, serializers
from rest_framework.metadata import SimpleMetadata
from rest_framework.request import clone_request


class IasoMetadata(SimpleMetadata):
    def determine_actions(self, request, view):
        """
        By default DRF renders options with full details only for POST and PUT methods:
        https://github.com/encode/django-rest-framework/blob/8e304e1adbb0f99f91a15ed3abd379104bba3b89/rest_framework/metadata.py#L78

        We extend this behavior to the `OPTIONS` HTTP method.
        This allows the front-end to use `OPTIONS` requests to retrieve metadata and use it in the UI.
        """
        actions = {}
        for method in {"PUT", "POST", "OPTIONS"} & set(view.allowed_methods):
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

    def get_field_info(self, field):
        """
        Return choices even for `read_only` fields.
        """
        field_info = super().get_field_info(field)

        if not isinstance(field, (serializers.RelatedField, serializers.ManyRelatedField)) and hasattr(
            field, "choices"
        ):
            field_info["choices"] = [
                {"value": choice_value, "display_name": force_str(choice_name, strings_only=True)}
                for choice_value, choice_name in field.choices.items()
            ]

        return field_info
