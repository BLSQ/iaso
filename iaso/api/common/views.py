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


class EtlModelViewset(ModelViewSet):
    """
    Sub class of ModelViewset that enforces the presence of pagination queryparams for GET requests.
    Imposes the use of Paginator as pagination class
    Use case: dashboard endpoints that will try to fetch all instances of a model
    """

    results_key = "results"
    # FIXME Contrary to name it remove result key if NOT paginated
    remove_results_key_if_paginated = False

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
