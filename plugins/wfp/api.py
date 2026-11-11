"""JSON API of the beneficiaries page of the dashboard (Entities > WFP beneficiaries) and of its xlsx exports."""

from django.db.models import F
from rest_framework import mixins, permissions, routers, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.api.common import HasPermission, Paginator
from iaso.models import EntityType, Group

from .details import beneficiary_details, submission_details
from .exports import KIND_CODA, KIND_RAW, export_response
from .filters import attach_journeys, facility_scope, filtered_beneficiaries, filters_from_params, with_counts
from .models import NUTRITION_PROGRAMMES, Journey, Step, Visit
from .permissions import WFP_BENEFICIARY_EXPORT_PERMISSION


class StepSerializer(serializers.ModelSerializer):
    class Meta:
        model = Step
        fields = ["id", "assistance_type", "quantity_given", "ration_size", "instance_id"]


class VisitSerializer(serializers.ModelSerializer):
    org_unit_name = serializers.CharField(source="org_unit.name", default=None)
    steps = StepSerializer(source="step_set", many=True)

    class Meta:
        model = Visit
        fields = [
            "id",
            "number",
            "date",
            "org_unit_id",
            "org_unit_name",
            "muac_size",
            "whz_color",
            "oedema",
            "entry_point",
            "instance_id",
            "steps",
        ]


class JourneySerializer(serializers.ModelSerializer):
    visits = VisitSerializer(source="visit_set", many=True)

    class Meta:
        model = Journey
        fields = [
            "id",
            "nutrition_programme",
            "programme_type",
            "physiology_status",
            "admission_type",
            "admission_criteria",
            "start_date",
            "end_date",
            "exit_type",
            "instance_id",
            "visits",
        ]


class BeneficiarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    entity_id = serializers.IntegerField()
    uuid = serializers.UUIDField(source="entity.uuid")
    entity_type_id = serializers.IntegerField(source="entity.entity_type_id")
    entity_type_name = serializers.CharField(source="entity.entity_type.name")
    gender = serializers.CharField()
    birth_date = serializers.DateField()
    journeys_count = serializers.IntegerField()
    visits_count = serializers.IntegerField()
    last_visit_date = serializers.DateTimeField()
    journeys = JourneySerializer(many=True)


class RowsField(serializers.Field):
    """Flattened (path, value) rows of a submission, as `{"key": ..., "value": ...}` objects."""

    def to_representation(self, rows):
        return [{"key": key, "value": value} for key, value in rows]


class SubmissionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    form_name = serializers.CharField(source="form.name", default=None)
    form_id = serializers.CharField(source="form.form_id", default=None)
    org_unit_name = serializers.CharField(source="org_unit.name", default=None)
    source_created_at = serializers.DateTimeField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    deleted = serializers.BooleanField()


class SubmissionWithFieldsSerializer(SubmissionSerializer):
    rows = RowsField()


class SubmissionFieldsSerializer(serializers.Serializer):
    submission = SubmissionSerializer()
    rows = RowsField()


class EntitySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    uuid = serializers.UUIDField()
    entity_type_name = serializers.CharField(source="entity_type.name", default=None)
    created_at = serializers.DateTimeField()
    deleted_at = serializers.DateTimeField()
    reference_submission_id = serializers.IntegerField(source="attributes_id", default=None)


class EtlBeneficiarySerializer(serializers.Serializer):
    gender = serializers.CharField()
    birth_date = serializers.DateField()
    guidelines = serializers.CharField()


class BeneficiaryDetailsSerializer(serializers.Serializer):
    entity = EntitySerializer()
    beneficiary = EtlBeneficiarySerializer(allow_null=True)
    attributes = RowsField()
    submissions = SubmissionWithFieldsSerializer(many=True)


ORDERS = {
    "entity_id": "entity_id",
    "birth_date": "birth_date",
    "gender": "gender",
    "journeys_count": "journeys_count",
    "visits_count": "visits_count",
    "last_visit_date": "last_visit_date",
}


def _ordering(order: str):
    """The ordering of the `order` query param (e.g. "-last_visit_date,entity_id"), most recent visits by default."""
    ordering = []
    for key in (order or "-last_visit_date").split(","):
        field_name = ORDERS.get(key.lstrip("-"))
        if field_name:
            ordering.append(
                F(field_name).desc(nulls_last=True) if key.startswith("-") else F(field_name).asc(nulls_last=True)
            )
    return ordering + ["-id"]


class HasProfile(permissions.BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, "iaso_profile")


class BeneficiaryPaginator(Paginator):
    page_size = 20


class BeneficiaryViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Beneficiaries computed by the ETL for the account of the user, with their journeys and visits.

    Filters: `entity_type`, `programme`, `org_unit_group` (only the visits made in the org units of the group) and `q`
    (entity id or start of the UUID). Users restricted to some org units only see the visits made there.
    `order` sorts the beneficiaries and `visits_order` (`date`, `-date`, `number` or `-number`) the visits of each
    journey, by date by default.
    The `export/coda/` and `export/raw/` actions download the xlsx exports of the same selection.
    """

    permission_classes = [permissions.IsAuthenticated, HasProfile, HasPermission(WFP_BENEFICIARY_EXPORT_PERMISSION)]  # type: ignore
    pagination_class = BeneficiaryPaginator

    def _org_units(self):
        """Org units the visits are restricted to (the group filter and the restrictions of the user), if any."""
        if not hasattr(self, "_facility_scope"):
            self._facility_scope = facility_scope(self.request.user, filters_from_params(self.request.query_params))
        return self._facility_scope

    def get_queryset(self):
        # also called by the browsable API (to render its filter form)
        params = self.request.query_params
        org_units = self._org_units()
        account = self.request.user.iaso_profile.account
        queryset = with_counts(filtered_beneficiaries(account, filters_from_params(params), org_units), org_units)
        return queryset.order_by(*_ordering(params.get("order", "")))

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


router = routers.SimpleRouter()
router.register(r"wfp/beneficiaries", BeneficiaryViewSet, basename="wfp_beneficiaries_api")
