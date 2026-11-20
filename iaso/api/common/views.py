from __future__ import annotations

from typing import ClassVar

from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext as _
from rest_framework.mixins import CreateModelMixin, RetrieveModelMixin, UpdateModelMixin
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet, ViewSet
from rest_framework_extensions.mixins import NestedViewSetMixin

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


class ReadOnlyModelViewSet(RetrieveModelMixin, CustomPaginationListModelMixin, GenericViewSet):
    pass


class EtlModelViewset(ModelViewSet):
    """
    Sub class of ModelViewset that enforces the presence of pagination queryparams for GET requests.
    Imposes the use of Paginator as pagination class
    Use case: dashboard endpoints that will try to fetch all instances of a model
    """

    pagination_class = EtlPaginator

    @property
    def paginator(self):
        paginator = super().paginator
        if paginator and not isinstance(paginator, EtlPaginator):
            raise TypeError(
                f"The pagination_class must be a subclass of {EtlPaginator.__name__}. "
                f"Received: {paginator.__class__.__name__}."
            )
        return paginator


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


class NestedParentLookupMixin(NestedViewSetMixin):
    """
    A custom NestedViewSetMixin that raises a 404 if parent_lookup is not found
    """

    parent_queryset: ClassVar[QuerySet]

    def get_parent_queryset(self) -> QuerySet:
        if self.parent_queryset is None:
            raise NotImplementedError("Define parent_queryset or override get_parent_queryset().")
        return self.parent_queryset

    def get_parent_instance(self):
        return get_object_or_404(self.get_parent_queryset(), **self.get_parents_query_dict())

    def get_queryset(self):
        self.get_parent_instance()
        return super().get_queryset()
