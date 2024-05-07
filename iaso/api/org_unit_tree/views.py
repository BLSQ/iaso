import django_filters

from django.db.models import Count

from rest_framework import filters, permissions, viewsets
from rest_framework import serializers
from rest_framework.decorators import action

from iaso.api.org_unit_tree.filters import OrgUnitTreeFilter
from iaso.api.org_unit_tree.pagination import OrgUnitTreePagination
from iaso.api.org_unit_tree.serializers import OrgUnitTreeSerializer
from iaso.models import OrgUnit


class OrgUnitTreeQuerystringSerializer(serializers.Serializer):
    force_full_tree = serializers.BooleanField(required=False)
    parent_id = serializers.IntegerField(required=False)


class OrgUnitTreeViewSet(viewsets.ModelViewSet):
    """
    Explore the OrgUnit tree level by level.

    Since results are displayed level by level, results are not paginated.
    """

    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = OrgUnitTreeFilter
    http_method_names = ["get", "options", "head", "trace"]
    ordering_fields = ["id", "name"]
    pagination_class = None
    permission_classes = [permissions.AllowAny]
    serializer_class = OrgUnitTreeSerializer

    def get_queryset(self):
        user = self.request.user

        querystring_serializer = OrgUnitTreeQuerystringSerializer(data=self.request.query_params)
        querystring_serializer.is_valid(raise_exception=True)
        force_full_tree = querystring_serializer.validated_data.get("force_full_tree")
        parent_id = querystring_serializer.validated_data.get("parent_id")

        can_view_full_tree = any([user.is_anonymous, user.is_superuser, force_full_tree])
        if can_view_full_tree:
            qs = OrgUnit.objects.all()
        else:
            qs = OrgUnit.objects.filter_for_user(user)

        display_root_level = self.action == "list" and not parent_id
        if display_root_level:
            if can_view_full_tree:
                qs = qs.filter(parent__isnull=True)
            elif user.is_authenticated:
                if user.iaso_profile.org_units.exists():
                    qs = qs.filter(id__in=user.iaso_profile.org_units.all())

        qs = qs.only("id", "name", "validation_status", "version", "org_unit_type", "parent")
        qs = qs.annotate(children_count=Count("orgunit__id"))
        qs = qs.order_by("name")
        qs = qs.select_related("org_unit_type")  # Avoid N+1 in the serializer.

        return qs

    @action(detail=False, methods=["get"])
    def search(self, request):
        """
        Search the OrgUnit tree.

        ```
        /api/orgunits/tree/search/?search=congo&page=2&limit=10
        ```
        """
        org_units = self.get_queryset()
        paginator = OrgUnitTreePagination()
        filtered_org_units = self.filterset_class(request.query_params, org_units).qs
        paginated_org_units = paginator.paginate_queryset(filtered_org_units, request)
        serializer = OrgUnitTreeSerializer(paginated_org_units, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)
