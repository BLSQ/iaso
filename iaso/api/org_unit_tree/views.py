import django_filters
from django.db.models import Count

from rest_framework import filters, permissions, viewsets

from iaso.api.org_unit_tree.filters import OrgUnitTreeFilter
from iaso.api.org_unit_tree.serializers import OrgUnitTreeSerializer
from iaso.models import OrgUnit


class OrgUnitTreeViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = OrgUnitTreeFilter
    http_method_names = ["get", "options", "head", "trace"]
    ordering_fields = ["id", "name"]
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
