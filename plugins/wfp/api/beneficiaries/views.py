"""JSON API of the beneficiaries page of the dashboard (Entities > WFP beneficiaries) and of its xlsx exports."""

from django.db.models.fields.json import KeyTextTransform
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from django_filters.utils import translate_validation
from rest_framework import mixins, permissions, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.api.common import HasPermission, Paginator
from iaso.models import EntityType, Group, OrgUnit
from plugins.wfp.api.beneficiaries.filters import BeneficiaryFilter, FacilityFilter, ordering_from_param
from plugins.wfp.api.beneficiaries.serializers import (
    BeneficiaryDetailsSerializer,
    BeneficiarySerializer,
    SubmissionFieldsSerializer,
)
from plugins.wfp.models import NUTRITION_PROGRAMMES, Beneficiary
from plugins.wfp.permissions import WFP_BENEFICIARY_EXPORT_PERMISSION
from plugins.wfp.utils.beneficiaries import attach_journeys, with_counts
from plugins.wfp.utils.details import beneficiary_details, submission_details
from plugins.wfp.utils.exports import KIND_CODA, KIND_ELIGIBLE, KIND_RAW, export_response


_UNSET = object()


class HasProfile(permissions.BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, "iaso_profile")


class EligibleExportParamsSerializer(serializers.Serializer):
    """The period of the eligible beneficiaries export, by default from the 26th of last month to the 25th (or today).

    No date can be in the future.
    """

    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)

    def validate(self, attrs):
        start_date, end_date = attrs.get("start_date"), attrs.get("end_date")
        today = timezone.localdate()
        for key in ("start_date", "end_date"):
            if attrs.get(key) and attrs[key] > today:
                raise serializers.ValidationError({key: "The date cannot be in the future"})
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({"end_date": "The end date must be after the start date"})
        return attrs


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
    The `export/coda/`, `export/raw/` and `export/eligible/` actions download the xlsx exports of the same selection.
    """

    permission_classes = [permissions.IsAuthenticated, HasProfile, HasPermission(WFP_BENEFICIARY_EXPORT_PERMISSION)]  # type: ignore
    pagination_class = BeneficiaryPaginator
    filter_backends = [DjangoFilterBackend]
    filterset_class = BeneficiaryFilter
    # The visit scope is computed by `BeneficiaryFilter` and handed to the view when the beneficiaries are filtered.
    _visit_scope = _UNSET

    def get_queryset(self):
        return (
            Beneficiary.objects.filter(entity__account=self.request.user.iaso_profile.account)
            .select_related("entity__entity_type")
            .annotate(progress_id=KeyTextTransform("progress_id", "entity__attributes__json"))
        )

    def set_visit_scope(self, org_units):
        """Called by `BeneficiaryFilter` when filtering, with the org units of the scope"""
        self._visit_scope = org_units

    def get_visit_scope(self):
        """
        Only available once the beneficiaries are filtered (`self.filter_queryset`), which sets it.
        """
        if self._visit_scope is _UNSET:
            raise RuntimeError("The visit scope is set by BeneficiaryFilter: call `filter_queryset` first")
        return self._visit_scope

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        org_units = self.get_visit_scope()
        queryset = with_counts(queryset, org_units).order_by(
            *ordering_from_param(request.query_params.get("order", ""))
        )
        page = self.paginate_queryset(queryset)
        attach_journeys(page, org_units, request.query_params.get("visits_order", ""))
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
        """Facilities of the cooperation partner given by `org_unit_group`, to choose the `facility` filter."""
        filterset = FacilityFilter(request.query_params, OrgUnit.objects.filter_for_user(request.user), request=request)
        if not filterset.is_valid():
            raise translate_validation(filterset.errors)
        org_units = filterset.qs.order_by("name", "id")
        return Response({"facilities": [{"value": org_unit.id, "label": org_unit.name} for org_unit in org_units]})

    @action(detail=False, methods=["get"], url_path="export/coda")
    def export_coda(self, request):
        """The selection in the "CODA 2.0 Full data fields" format."""
        beneficiaries = self.filter_queryset(self.get_queryset())
        return export_response(request.user, KIND_CODA, beneficiaries, self.get_visit_scope())

    @action(detail=False, methods=["get"], url_path="export/raw")
    def export_raw(self, request):
        """The ETL tables and the submissions of the selection, one sheet per form."""
        beneficiaries = self.filter_queryset(self.get_queryset())
        return export_response(request.user, KIND_RAW, beneficiaries, self.get_visit_scope())

    @action(detail=False, methods=["get"], url_path="export/eligible", serializer_class=EligibleExportParamsSerializer)
    def export_eligible(self, request):
        """The beneficiaries of the selection with an ongoing journey, found normal at their last visit of the period.

        One sheet per programme (and per physiology status for women): without an entity type, the children and the
        women are both exported, in separate sheets as their columns differ. The period is given by `start_date` and
        `end_date` (YYYY-MM-DD, both included), by default from the 26th of last month to the 25th.
        """
        beneficiaries = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        return export_response(
            request.user, KIND_ELIGIBLE, beneficiaries, self.get_visit_scope(), **serializer.validated_data
        )

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
