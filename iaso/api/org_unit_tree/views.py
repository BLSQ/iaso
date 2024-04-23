import django_filters
from django.db.models import Count

from rest_framework import filters, viewsets

from iaso.api.org_unit_tree.filters import OrgUnitTreeFilter
from iaso.api.org_unit_tree.pagination import OrgUnitTreePagination
from iaso.api.org_unit_tree.serializers import OrgUnitTreeSerializer
from iaso.models import OrgUnit


class OrgUnitTreeViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = OrgUnitTreeFilter
    http_method_names = ["get", "options", "head", "trace"]
    ordering_fields = ["id", "name"]
    pagination_class = OrgUnitTreePagination
    serializer_class = OrgUnitTreeSerializer

    def get_queryset(self):
        qs = OrgUnit.objects.filter_for_user(self.request.user)
        qs = qs.only("id", "name", "validation_status", "version", "org_unit_type", "parent")
        qs = qs.annotate(children_count=Count("orgunit__id"))
        return qs
