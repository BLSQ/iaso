from django import forms
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters, serializers

from iaso.api.common import ModelViewSet
from plugins.polio.api.vaccines.supply_chain.shared import VaccineSupplyChainReadWritePerm
from plugins.polio.api.vaccines.vaccine_authorization import CountryForVaccineSerializer
from plugins.polio.models import VaccineRequestForm


def validate_rounds_and_campaign(data, current_user=None):
    rounds = data.get("rounds")
    campaign = data.get("campaign")

    if not rounds:
        raise forms.ValidationError("At least one round must be attached.")

    for round in rounds.all():
        if round.campaign != campaign:
            raise forms.ValidationError("Each round's campaign must be the same as the form's campaign.")

    if data.get("country").org_unit_type.category != "COUNTRY":
        raise forms.ValidationError("The selected OrgUnit must be of type 'Country'.")

    if current_user:
        if not current_user.iaso_profile.account == data.get("campaign").account:
            raise forms.ValidationError("The selected account must be the same as the user's account.")

    return data


class VaccineRequestFormPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaccineRequestForm
        fields = [
            "country",
            "campaign",
            "vaccine_type",
            "rounds",
            "date_vrf_signature",
            "date_vrf_reception",
            "date_dg_approval",
            "quantities_ordered_in_doses",
            "wastage_rate_used_on_vrf",
            "date_vrf_submission_to_orpg",
            "quantities_approved_by_orpg_in_doses",
            "date_rrt_orpg_approval",
            "date_vrf_submitted_to_dg",
            "quantities_approved_by_dg_in_doses",
            "comment",
        ]

    def validate(self, data):
        return validate_rounds_and_campaign(data, self.context["request"].user)

    def create(self, validated_data):
        user = self.context["request"].user
        assert "campaign" in validated_data and validated_data["campaign"].account == user.iaso_profile.account
        validated_data["country"] = validated_data["campaign"].country
        return super().create(validated_data)


class VaccineRequestFormListSerializer(serializers.ModelSerializer):
    country = CountryForVaccineSerializer()
    vaccine = serializers.CharField(source="vaccine_type")
    obr_name = serializers.CharField(source="campaign.obr_name")
    po_numbers = serializers.SerializerMethodField()
    rounds = serializers.SerializerMethodField()
    start_date = serializers.SerializerMethodField()
    end_date = serializers.SerializerMethodField()
    doses_shipped = serializers.SerializerMethodField()
    eta = serializers.SerializerMethodField()
    var = serializers.SerializerMethodField()

    class Meta:
        model = VaccineRequestForm
        fields = (
            "id",
            "country",
            "vaccine",
            "obr_name",
            "po_numbers",
            "rounds",
            "start_date",
            "end_date",
            "doses_shipped",
            "eta",
            "var",
        )

    # comma separated list of all
    def get_po_numbers(self, obj):
        pre_alerts = obj.vaccineprealert_set.all()
        if not pre_alerts:
            return ""
        return ", ".join([pre_alert.po_number for pre_alert in pre_alerts])

    def get_rounds(self, obj):
        return [round.number for round in obj.rounds.all()]

    def get_start_date(self, obj):
        # most recent (first in future or last in past) round's start date
        rounds = obj.rounds.all()
        future_rounds = [round for round in rounds if round.started_at > timezone.now().date()]
        if future_rounds:
            return min(future_rounds, key=lambda round: round.started_at).started_at
        else:
            return max(rounds, key=lambda round: round.started_at).started_at

    def get_end_date(self, obj):
        # most recent (first in future or last in past) round's start date
        rounds = obj.rounds.all()
        future_rounds = [round for round in rounds if round.ended_at > timezone.now().date()]
        if future_rounds:
            return min(future_rounds, key=lambda round: round.ended_at).ended_at
        else:
            return max(rounds, key=lambda round: round.ended_at).ended_at

    def get_doses_shipped(self, obj):
        return obj.total_doses_shipped()

    # Comma Separated List of all estimated arrival times
    def get_eta(self, obj):
        pre_alerts = obj.vaccineprealert_set.all()
        if not pre_alerts:
            return ""
        return ", ".join([str(pre_alert.estimated_arrival_time) for pre_alert in pre_alerts])

    # Comma Separated List of all arrival report dates
    def get_var(self, obj):
        arrival_reports = obj.vaccinearrivalreport_set.all()
        if not arrival_reports:
            return ""
        return ", ".join([str(report.arrival_report_date) for report in arrival_reports])


class VaccineRequestFormViewSet(ModelViewSet):
    """
    GET /api/polio/vaccine/request_forms/ to get the list of all request_forms

    POST /api/polio/vaccine/request_forms/
    """

    permission_classes = [VaccineSupplyChainReadWritePerm]
    http_method_names = ["get", "post", "delete"]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    filterset_fields = ["campaign", "country", "vaccine_type", "rounds__started_at"]

    def get_queryset(self):
        return VaccineRequestForm.objects.filter(campaign__account=self.request.user.iaso_profile.account)

    def get_serializer_class(self):
        if self.action == "list":
            return VaccineRequestFormListSerializer
        else:
            return VaccineRequestFormPostSerializer
