"""JSON API of the beneficiaries page of the dashboard (Entities > WFP beneficiaries) and of its xlsx exports."""

from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.api.common import HasPermission, Paginator
from iaso.models import EntityType, Group, OrgUnit
from plugins.wfp.api.beneficiaries.filters import ordering_from_param
from plugins.wfp.api.beneficiaries.serializers import (
    BeneficiaryDetailsSerializer,
    BeneficiarySerializer,
    SubmissionFieldsSerializer,
)
from plugins.wfp.filters import (
    attach_journeys,
    facility_scope,
    filtered_beneficiaries,
    filters_from_params,
    with_counts,
)
from plugins.wfp.models import NUTRITION_PROGRAMMES
from plugins.wfp.permissions import WFP_BENEFICIARY_EXPORT_PERMISSION
from plugins.wfp.utils.details import beneficiary_details, submission_details
from plugins.wfp.utils.exports import KIND_CODA, KIND_RAW, export_response


class HasProfile(permissions.BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, "iaso_profile")


class BeneficiaryPaginator(Paginator):
    page_size = 20


class BeneficiaryViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Beneficiaries computed by the ETL for the account of the user, with their journeys and visits.

    Filters: `entity_type`, `programme`, `org_unit_group` (the cooperation partner: only the visits made in the org
    units of its group), `facility` (one integrated nutrition facility of that group), `q` (entity id, start of the
    UUID or start of the progress id) and `visit_date_after` / `visit_date_before` (beneficiaries visited in the
    period for a journey they didn't exit yet). Users restricted to some org units only see the visits made there.
    `order` sorts the beneficiaries and `visits_order` (`date`, `-date`, `number` or `-number`) the visits of each
    journey, by date by default.
    The `export/coda/` and `export/raw/` actions download the xlsx exports of the same selection.
    """

    permission_classes = [permissions.IsAuthenticated, HasProfile, HasPermission(WFP_BENEFICIARY_EXPORT_PERMISSION)]  # type: ignore
    pagination_class = BeneficiaryPaginator

    def _org_units(self):
        """Org units the visits are restricted to (the partner and facility filters and the user's restrictions)."""
        if not hasattr(self, "_facility_scope"):
            self._facility_scope = facility_scope(self.request.user, filters_from_params(self.request.query_params))
        return self._facility_scope

    def get_queryset(self):
        # also called by the browsable API (to render its filter form)
        params = self.request.query_params
        org_units = self._org_units()
        account = self.request.user.iaso_profile.account
        queryset = with_counts(filtered_beneficiaries(account, filters_from_params(params), org_units), org_units)
        return queryset.order_by(*ordering_from_param(params.get("order", "")))

    def list(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.get_queryset())
        attach_journeys(page, self._org_units(), request.query_params.get("visits_order", ""))
        return self.get_paginated_response(BeneficiarySerializer(page, many=True).data)

    @action(detail=False, methods=["get"])
    def options(self, request):
        """Choices of the filters of the page."""
        account = request.user.iaso_profile.account
        groups = (
            Group.objects.filter_for_user(request.user)
            .select_related("source_version__data_source")
            .order_by("name", "id")
        )
        return Response(
            {
                "entity_types": [
                    {"value": entity_type.id, "label": entity_type.name}
                    for entity_type in EntityType.objects.filter(account=account).order_by("name")
                ],
                "programmes": [{"value": value, "label": str(label)} for value, label in NUTRITION_PROGRAMMES],
                "org_unit_groups": [
                    {
                        "value": group.id,
                        "label": (
                            f"{group.name} ({group.source_version.data_source.name} - {group.source_version.number})"
                            if group.source_version
                            else group.name
                        ),
                    }
                    for group in groups
                ],
            }
        )

    @action(detail=False, methods=["get"])
    def facilities(self, request):
        group_id = str(request.query_params.get("org_unit_group") or "").strip()
        if not group_id.isdigit():
            return Response({"facilities": []})

        org_units = (
            OrgUnit.objects.filter_for_user(request.user)
            .filter(groups__in=Group.objects.filter_for_user(request.user).filter(id=group_id))
            .order_by("name", "id")
            .distinct()
        )
        return Response({"facilities": [{"value": org_unit.id, "label": org_unit.name} for org_unit in org_units]})

    @action(detail=False, methods=["get"], url_path="export/coda")
    def export_coda(self, request):
        """The selection in the "CODA 2.0 Full data fields" format."""
        return export_response(request.user, KIND_CODA, filters_from_params(request.query_params))

    @action(detail=False, methods=["get"], url_path="export/raw")
    def export_raw(self, request):
        """The ETL tables and the submissions of the selection, one sheet per form."""
        return export_response(request.user, KIND_RAW, filters_from_params(request.query_params))

    @action(detail=False, methods=["get"], url_path=r"(?P<entity_id>\d+)/data")
    def data(self, request, entity_id):
        """All the data of the entity: ETL beneficiary, reference form and every submission linked to it."""
        details = beneficiary_details(request.user, request.user.iaso_profile.account, entity_id)
        return Response(BeneficiaryDetailsSerializer(details).data)

    @action(detail=False, methods=["get"], url_path=r"submissions/(?P<instance_id>\d+)/fields")
    def submission_fields(self, request, instance_id):
        """All the fields of a submission of the account."""
        details = submission_details(request.user, request.user.iaso_profile.account, instance_id)
        return Response(SubmissionFieldsSerializer(details).data)
