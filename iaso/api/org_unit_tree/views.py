import django_filters

from django.db.models import Count, Q

from rest_framework import filters, permissions, viewsets
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError

from iaso.api.org_unit_tree.filters import OrgUnitTreeFilter
from iaso.api.org_unit_tree.pagination import OrgUnitTreePagination
from iaso.api.org_unit_tree.serializers import OrgUnitTreeSerializer
from iaso.models import OrgUnit


class OrgUnitTreeQuerystringSerializer(serializers.Serializer):
    force_full_tree = serializers.BooleanField(required=False)
    parent_id = serializers.IntegerField(required=False)
    data_source_id = serializers.IntegerField(required=False)
    validation_status = serializers.MultipleChoiceField(choices=OrgUnit.VALIDATION_STATUS_CHOICES)


class OrgUnitTreeViewSet(viewsets.ModelViewSet):
    """
    Explore the OrgUnit tree level by level.
    """

    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = OrgUnitTreeFilter
    http_method_names = ["get", "options", "head", "trace"]
    ordering_fields = ["id", "name"]
    pagination_class = None  # Since results are displayed level by level, results are not paginated in the list view.
    permission_classes = [permissions.AllowAny]
    serializer_class = OrgUnitTreeSerializer

    def get_queryset(self):
        user = self.request.user

        querystring = OrgUnitTreeQuerystringSerializer(data=self.request.query_params)
        querystring.is_valid(raise_exception=True)
        force_full_tree = querystring.validated_data.get("force_full_tree")
        parent_id = querystring.validated_data.get("parent_id")
        data_source_id = querystring.validated_data.get("data_source_id")
        validation_status = querystring.validated_data.get("validation_status", set())

        if user.is_anonymous:
            if not data_source_id:
                raise ValidationError({"data_source_id": ["A `data_source_id` must be provided for anonymous users."]})
            qs = OrgUnit.objects.all()  # `qs` will be filtered by `data_source_id` in `OrgUnitTreeFilter`.
        elif user.is_superuser or force_full_tree:
            qs = OrgUnit.objects.filter(version=user.iaso_profile.account.default_version)
        else:
            qs = OrgUnit.objects.filter_for_user(user)

        can_view_full_tree = any([user.is_anonymous, user.is_superuser, force_full_tree])
        display_root_level = not parent_id

        if display_root_level and self.action == "list":
            if can_view_full_tree:
                qs = qs.filter(parent__isnull=True)
            elif user.is_authenticated:
                if user.iaso_profile.org_units.exists():
                    # Root level of the tree for this user (the user may be restricted to a subpart of the tree).
                    qs = qs.filter(id__in=user.iaso_profile.org_units.all())

        qs = qs.only("id", "name", "validation_status", "version", "org_unit_type", "parent")
        qs = qs.order_by("name")
        qs = qs.select_related("org_unit_type")

        if validation_status == {OrgUnit.VALIDATION_VALID}:
            exclude_filter = ~Q(orgunit__validation_status__in=[OrgUnit.VALIDATION_REJECTED, OrgUnit.VALIDATION_NEW])
            children_count = Count("orgunit", filter=exclude_filter)
        else:
            children_count = Count("orgunit")
        qs = qs.annotate(children_count=children_count)

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
