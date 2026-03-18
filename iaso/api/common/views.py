from django.utils.translation import gettext as _
from rest_framework.mixins import CreateModelMixin, RetrieveModelMixin, UpdateModelMixin
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet, ViewSet

from iaso.api.common import DropdownOptionsSerializer, EtlPaginator
from iaso.api.common.mixin import CustomPaginationListModelMixin, ProtectDestroyMixin
from iaso.models.payments import PaymentStatuses


class ModelViewSet(
    CustomPaginationListModelMixin,
    ProtectDestroyMixin,
    RetrieveModelMixin,
    UpdateModelMixin,
    CreateModelMixin,
    GenericViewSet,
):
    pass


from django.db.models import ProtectedError
from django.utils.translation import gettext as _
from rest_framework import exceptions
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet as BaseModelViewSet, ViewSet

from iaso.api.common import DropdownOptionsSerializer, EtlPaginator, Paginator
from iaso.models.payments import PaymentStatuses


class ModelViewSet(BaseModelViewSet):
    results_key = "results"
    # FIXME Contrary to name it remove result key if NOT paginated
    remove_results_key_if_paginated = False

    def pagination_class(self):
        return Paginator(self.get_results_key())

    def get_results_key(self):
        """
        Get the key to use for results in list responses (resource-specific)

        Example: if your resource is CarManufacturer, use "car_manufacturers", so that the list responses look like
        {
            "car_manufacturers": [
                {"id": 1, name  : "Honda"},
                {"id": 2, name: "Toyota"},
            ]
        }
        """
        assert self.results_key is not None, (
            "'%s' should either include a `results_key` attribute, "
            "or override the `get_result_key()` method." % self.__class__.__name__
        )

        return self.results_key

    def list(self, request: Request, *args, **kwargs):
        # """Override to return responses with {"result_key": data} structure"""

        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        if not self.remove_results_key_if_paginated:
            return Response({self.get_results_key(): serializer.data})
        return Response(serializer.data)

    def perform_destroy(self, instance):
        """Handle ProtectedError (prevent deletion of instances when linked to protected models)"""

        try:
            super().perform_destroy(instance)
        except ProtectedError as e:
            instance_model_name = instance.__class__.__name__
            linked_model_name = e.protected_objects.model.__name__

            raise exceptions.MethodNotAllowed(
                self.request.method,
                f"Cannot delete {instance_model_name} as it is linked to one or more {linked_model_name}s",
            )


class EtlModelViewset(ModelViewSet):
    """
    Sub class of ModelViewset that enforces the presence of pagination queryparams for GET requests.
    Imposes the use of Paginator as pagination class
    Use case: dashboard endpoints that will try to fetch all instances of a model
    """

    def pagination_class(self):
        return EtlPaginator(self.get_results_key())

    def get_pagination_class(self):
        custom_pagination_class = getattr(self, "pagination_class", None)
        if isinstance(custom_pagination_class, type):
            if not issubclass(custom_pagination_class, EtlPaginator):
                raise TypeError(
                    f"The pagination_class must be a subclass of {EtlPaginator.__name__}. "
                    f"Received: {custom_pagination_class.__name__}."
                )
            return custom_pagination_class
        return EtlPaginator


class DropdownOptionsListViewSet(ViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    http_method_names = ["get"]
    # default value
    serializer = DropdownOptionsSerializer
    # default value. Should be a models.TextChoices
    choices = PaymentStatuses

    def get_status_choices(self):
        return [{"value": choice.value, "label": str(_(choice.label))} for choice in self.choices]

    def list(self, request):
        status_choices = self.get_status_choices()
        serializer = self.serializer(status_choices, many=True)
        return Response(serializer.data)
