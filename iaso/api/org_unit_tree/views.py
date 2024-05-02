import django_filters
from django.db.models import Count

from rest_framework import filters, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.api.org_unit_tree.filters import OrgUnitTreeFilter, OrgUnitTreeSearchFilter
from iaso.api.org_unit_tree.pagination import OrgUnitTreePagination
from iaso.api.org_unit_tree.serializers import OrgUnitTreeSerializer
from iaso.models import OrgUnit


class OrgUnitTreeViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = OrgUnitTreeFilter
    http_method_names = ["get", "options", "head", "trace"]
    ordering_fields = ["id", "name"]
    pagination_class = None  # The tree is not paginated (but the search view is paginated).
    permission_classes = [permissions.AllowAny]
    serializer_class = OrgUnitTreeSerializer

    def get_queryset(self):
        if self.request.user.is_anonymous:
            qs = OrgUnit.objects.all()
        else:
            qs = OrgUnit.objects.filter_for_user(self.request.user)
        qs = qs.only("id", "name", "validation_status", "version", "org_unit_type", "parent")
        qs = qs.annotate(children_count=Count("orgunit__id"))
        return qs

    @action(detail=False, methods=["get"])
    def search(self, request):
        """
        TODO: ?page=2&limit=2
        """
        org_units = self.get_queryset()
        paginator = OrgUnitTreePagination()
        filtered_org_units = OrgUnitTreeSearchFilter(request.query_params, org_units).qs
        paginated_org_units = paginator.paginate_queryset(filtered_org_units, request)
        serializer = OrgUnitTreeSerializer(paginated_org_units, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)
