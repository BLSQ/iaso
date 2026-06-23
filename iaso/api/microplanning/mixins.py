from django.db.models import Prefetch
from django.http import QueryDict
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError

from iaso.models.microplanning import Assignment, Planning
from iaso.models.org_unit import OrgUnit

from .filters import PlanningOrgUnitChildrenFilter, apply_selection_filter, validate_planning_has_org_unit_scope


class PlanningOrgUnitChildrenQuerysetMixin:
    """Shared queryset helpers for planning-scoped org unit children."""

    def get_planning_children_base_queryset(self, planning: Planning, user):
        base_queryset = OrgUnit.objects.filter_for_user(user).filter(validation_status=OrgUnit.VALIDATION_VALID)
        sampling = planning.selected_sampling_result
        root_org_unit = planning.org_unit
        target_type_ids = [t.id for t in planning.target_org_unit_types.all()]

        if sampling and sampling.group_id:
            queryset = base_queryset.filter(pk__in=sampling.group.org_units.values_list("pk", flat=True))
        elif root_org_unit and target_type_ids:
            queryset = base_queryset.descendants(root_org_unit).filter(org_unit_type_id__in=target_type_ids)
        else:
            queryset = base_queryset.none()

        return queryset.filter(validation_status=OrgUnit.VALIDATION_VALID).select_related("org_unit_type").order_by("id")

    def prefetch_planning_assignments(self, queryset, planning: Planning):
        return queryset.prefetch_related(
            Prefetch(
                "assignment_set",
                queryset=Assignment.objects.filter(planning=planning, deleted_at__isnull=True).select_related(
                    "user__iaso_profile", "team"
                ),
                to_attr="_planning_assignments_prefetched",
            )
        )

    def _valid_org_units_base_queryset(self, user):
        return OrgUnit.objects.filter_for_user(user).filter(validation_status=OrgUnit.VALIDATION_VALID)

    def filter_planning_children_queryset(self, planning: Planning, user, filter_data):
        validate_planning_has_org_unit_scope(planning)
        filterset = PlanningOrgUnitChildrenFilter(
            data=filter_data,
            queryset=self.get_planning_children_base_queryset(planning, user),
            request=self.request,
            planning=planning,
            base_queryset=self._valid_org_units_base_queryset(user),
        )
        if not filterset.is_valid():
            raise ValidationError(filterset.errors)
        return filterset.qs

    def get_bulk_assign_org_units_queryset(self, planning: Planning, user, validated_data):
        filter_data = QueryDict(mutable=True)
        org_unit_parent_id = validated_data.get("org_unit_parent_id")
        if org_unit_parent_id is not None:
            filter_data["orgUnitParentId"] = str(org_unit_parent_id)
        org_unit_type_ids = validated_data.get("org_unit_type_ids", [])
        if org_unit_type_ids:
            filter_data["orgUnitTypeIds"] = ",".join(str(type_id) for type_id in org_unit_type_ids)

        queryset = self.filter_planning_children_queryset(planning, user, filter_data)
        search = validated_data.get("search")
        if search:
            queryset = queryset.filter(name__icontains=search)
        return apply_selection_filter(
            queryset,
            validated_data.get("select_all", False),
            validated_data.get("selected_ids", []),
            validated_data.get("unselected_ids", []),
        )
