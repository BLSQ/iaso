from django import forms
from django.db.models import Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters, serializers, status
from rest_framework.response import Response
from rest_framework.decorators import action

from hat.menupermissions import models as permission
from iaso.models import OrgUnit
from iaso.api.common import GenericReadWritePerm, ModelViewSet
from plugins.polio.models import VaccineArrivalReport, VaccinePreAlert, VaccineRequestForm, Round


def validate_rounds_and_campaign(data, current_user=None):
    rounds = data.get("rounds")
    campaign = data.get("campaign")

    if not rounds:
        raise forms.ValidationError("At least one round must be attached.")

    for round in rounds.all():
        if round.campaign != campaign:
            raise forms.ValidationError("Each round's campaign must be the same as the form's campaign.")

    if current_user:
        if not current_user.iaso_profile.account == data.get("campaign").account:
            raise forms.ValidationError("The selected account must be the same as the user's account.")

    return data


class VaccineSupplyChainReadWritePerm(GenericReadWritePerm):
    read_perm = permission.POLIO_VACCINE_SUPPLY_CHAIN_READ
    write_perm = permission.POLIO_VACCINE_SUPPLY_CHAIN_WRITE


class NestedRoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = ["number", "id"]


class NestedRoundPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = ["id"]


class WithRequestFormSerializer(serializers.ModelSerializer):
    def save(self, **kwargs):
        vaccine_request_form = kwargs.pop("vaccine_request_form")
        self.validated_data["request_form"] = vaccine_request_form
        return super().save(**kwargs)


class NestedVaccinePreAlertSerializerForPost(WithRequestFormSerializer):
    class Meta:
        model = VaccinePreAlert
        fields = [
            "date_pre_alert_reception",
            "po_number",
            "estimated_arrival_time",
            "lot_number",
            "expiration_date",
            "doses_shipped",
            "doses_received",
        ]


class NestedVaccinePreAlertSerializerForPatch(NestedVaccinePreAlertSerializerForPost):
    id = serializers.IntegerField(required=True, read_only=False)

    class Meta(NestedVaccinePreAlertSerializerForPost.Meta):
        fields = NestedVaccinePreAlertSerializerForPost.Meta.fields + ["id"]


class NestedVaccineArrivalReportSerializerForPost(WithRequestFormSerializer):
    class Meta:
        model = VaccineArrivalReport
        fields = ["arrival_report_date", "doses_received"]


class NestedVaccineArrivalReportSerializerForPatch(NestedVaccineArrivalReportSerializerForPost):
    id = serializers.IntegerField(required=True, read_only=False)

    class Meta(NestedVaccineArrivalReportSerializerForPost.Meta):
        fields = NestedVaccineArrivalReportSerializerForPost.Meta.fields + ["id"]


class PostPreAlertSerializer(serializers.Serializer):
    pre_alerts = NestedVaccinePreAlertSerializerForPost(
        many=True,
    )

    def create(self, validated_data, **kwargs):
        vaccine_request_form = kwargs.get("vaccine_request_form")
        pre_alerts = []

        for item in self.validated_data["pre_alerts"]:
            pre_alert = NestedVaccinePreAlertSerializerForPost(data=item)
            if pre_alert.is_valid():
                pre_alert.save(vaccine_request_form=vaccine_request_form)
                pre_alerts.append(pre_alert.instance)

        return pre_alerts

    def save(self, **kwargs):
        vaccine_request_form = kwargs.get("vaccine_request_form")
        pre_alerts = []

        for item in self.validated_data["pre_alerts"]:
            pre_alert = NestedVaccinePreAlertSerializerForPost(data=item)
            if pre_alert.is_valid():
                pre_alert.save(vaccine_request_form=vaccine_request_form)
                pre_alerts.append(pre_alert.instance)

        return pre_alerts


class PatchPreAlertSerializer(serializers.Serializer):
    pre_alerts = NestedVaccinePreAlertSerializerForPatch(many=True)

    def create(self, validated_data, **kwargs):
        vaccine_request_form = kwargs.get("vaccine_request_form")
        pre_alerts = []

        for item in self.validated_data["pre_alerts"]:
            pre_alert = NestedVaccinePreAlertSerializerForPatch(data=item)
            if pre_alert.is_valid():
                pre_alert.save(vaccine_request_form=vaccine_request_form)
                pre_alerts.append(pre_alert.instance)

        return pre_alerts

    def save(self, **kwargs):
        vaccine_request_form = kwargs.get("vaccine_request_form")
        pre_alerts = []

        for item in self.validated_data["pre_alerts"]:
            pre_alert = NestedVaccinePreAlertSerializerForPatch(data=item)
            if pre_alert.is_valid():
                pre_alert.save(vaccine_request_form=vaccine_request_form)
                pre_alerts.append(pre_alert.instance)

        return pre_alerts


class PostArrivalReportSerializer(serializers.Serializer):
    arrival_reports = NestedVaccineArrivalReportSerializerForPost(many=True)

    def create(self, validated_data, **kwargs):
        vaccine_request_form = kwargs.get("vaccine_request_form")
        arrival_reports = []

        for item in self.validated_data["arrival_reports"]:
            arrival_report = NestedVaccineArrivalReportSerializerForPost(data=item)
            if arrival_report.is_valid():
                arrival_report.save(vaccine_request_form=vaccine_request_form)
                arrival_reports.append(arrival_report.instance)

        return arrival_reports

    def save(self, **kwargs):
        vaccine_request_form = kwargs.get("vaccine_request_form")
        arrival_reports = []

        for item in self.validated_data["arrival_reports"]:
            arrival_report = NestedVaccineArrivalReportSerializerForPost(data=item)
            if arrival_report.is_valid():
                arrival_report.save(vaccine_request_form=vaccine_request_form)
                arrival_reports.append(arrival_report.instance)

        return arrival_reports


class PatchArrivalReportSerializer(serializers.Serializer):
    arrival_reports = NestedVaccineArrivalReportSerializerForPatch(many=True)


class NestedCountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnit
        fields = ["name", "id"]


class VaccineRequestFormPostSerializer(serializers.ModelSerializer):
    rounds = NestedRoundPostSerializer(many=True)

    class Meta:
        model = VaccineRequestForm
        fields = [
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

        read_only_fields = ["created_at", "updated_at"]

    def validate(self, data):
        return validate_rounds_and_campaign(data, self.context["request"].user)

    def create(self, validated_data):
        pre_alerts_data = validated_data.pop("pre_alerts", [])
        arrival_reports_data = validated_data.pop("arrival_reports", [])

        user = self.context["request"].user
        assert "campaign" in validated_data and validated_data["campaign"].account == user.iaso_profile.account

        # create a new instance of VaccineRequestForm
        request_form = VaccineRequestForm.objects.create(**validated_data["campaign"])

        # create new instances of VaccinePreAlert
        for pre_alert_data in pre_alerts_data:
            VaccinePreAlert.objects.create(request_form=request_form, **pre_alert_data)

        # create new instances of VaccineArrivalReport
        for arrival_report_data in arrival_reports_data:
            VaccineArrivalReport.objects.create(request_form=request_form, **arrival_report_data)

        return request_form

    def update(self, instance, validated_data):
        pre_alerts_data = validated_data.pop("pre_alerts", [])
        arrival_reports_data = validated_data.pop("arrival_reports", [])

        # update the instance with the remaining validated_data
        modified = False
        for attr, value in validated_data.items():
            if getattr(instance, attr) != value:
                setattr(instance, attr, value)
                modified = True
        if modified:
            instance.save()

        # update pre_alerts
        for pre_alert_data in pre_alerts_data:
            VaccinePreAlert.objects.update_or_create(request_form=instance, **pre_alert_data)

        # update arrival_reports
        for arrival_report_data in arrival_reports_data:
            VaccineArrivalReport.objects.update_or_create(request_form=instance, **arrival_report_data)

        return instance


class VaccineRequestFormListSerializer(serializers.ModelSerializer):
    country = NestedCountrySerializer(source="campaign.country")
    obr_name = serializers.CharField(source="campaign.obr_name")
    po_numbers = serializers.SerializerMethodField()
    rounds = NestedRoundSerializer(many=True)
    start_date = serializers.SerializerMethodField()
    end_date = serializers.SerializerMethodField()
    doses_shipped = serializers.SerializerMethodField()
    eta = serializers.SerializerMethodField()
    var = serializers.SerializerMethodField()

    class Meta:
        model = VaccineRequestForm
        fields = [
            "id",
            "country",
            "vaccine_type",
            "obr_name",
            "po_numbers",
            "rounds",
            "start_date",
            "end_date",
            "doses_shipped",
            "eta",
            "var",
            "created_at",
            "updated_at",
        ]

    # comma separated list of all
    def get_po_numbers(self, obj):
        pre_alerts = obj.vaccineprealert_set.all()
        if not pre_alerts:
            return ""
        return ", ".join([pre_alert.po_number for pre_alert in pre_alerts])

    def get_start_date(self, obj):
        # most recent (first in future or last in past) round's start date
        rounds = obj.rounds.all()
        future_rounds = [round for round in rounds if round.started_at and round.started_at > timezone.now().date()]
        if future_rounds:
            return min(future_rounds, key=lambda round: round.started_at).started_at
        else:
            return max(rounds, key=lambda round: round.started_at).started_at

    def get_end_date(self, obj):
        # most recent (first in future or last in past) round's start date
        rounds = obj.rounds.all()
        future_rounds = [round for round in rounds if round.ended_at and round.ended_at > timezone.now().date()]
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


class VRFCustomOrderingFilter(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        current_order = request.GET.get("order")

        if current_order == "doses_shipped":
            queryset = queryset.annotate(doses_shipped=Coalesce(Sum("vaccineprealert__doses_shipped"), 0)).order_by(
                "doses_shipped"
            )
        elif current_order == "-doses_shipped":
            queryset = queryset.annotate(doses_shipped=Coalesce(Sum("vaccineprealert__doses_shipped"), 0)).order_by(
                "-doses_shipped"
            )
        elif current_order == "obr_name":
            queryset = queryset.order_by("campaign__obr_name")
        elif current_order == "-obr_name":
            queryset = queryset.order_by("-campaign__obr_name")
        elif current_order == "country":
            queryset = queryset.order_by("campaign__country__name")
        elif current_order == "-country":
            queryset = queryset.order_by("-campaign__country__name")
        elif current_order == "vaccine_type":
            queryset = queryset.order_by("vaccine_type")
        elif current_order == "-vaccine_type":
            queryset = queryset.order_by("-vaccine_type")

        return queryset


# Otherwise the /api/ page generated by DRF is very slow
# It will load all the orgnunits in order to populate the filters dropdown for campaign_country


class NoFormDjangoFilterBackend(DjangoFilterBackend):
    def to_html(self, request, queryset, view):
        return ""


class VaccineRequestFormViewSet(ModelViewSet):
    """
    GET /api/polio/vaccine/request_forms/ to get the list of all request_forms
    Available filters:
    - campaign__obr_name : Use campaign obr_name
    - campaign__country : Use country id
    - vaccine_type : Use on of the VACCINES : mOPV2, nOPV2, bOPV
    - rounds__started_at : Use a date in the format YYYY-MM-DD
    - rounds__ended_at : Use a date in the format YYYY-MM-DD

    Available ordering:
    - country
    - vaccine_type
    - obr_name
    - doses_shipped
    - created_at
    - updated_at

    DELETE /api/polio/vaccine/request_forms/{id}/
    Deletes the request_form with the given id and all its arrival_reports and pre_alerts.

    POST /api/polio/vaccine/request_forms/
    To create a new request_form

    PATCH /api/polio/vaccine/request_forms/{id}/
    To modify an existing request_form

    POST /api/polio/vaccine/request_forms/{id}/add_pre_alerts/
    To add new pre_alert(s) to an existing request_form

    PATCH /api/polio/vaccine/request_forms/{id}/update_pre_alerts/
    To modify existing pre_alert(s) of an existing request_form

    POST /api/polio/vaccine/request_forms/{id}/add_arrival_reports/
    To add new arrival_report(s) to an existing request_form

    PATCH /api/polio/vaccine/request_forms/{id}/update_arrival_reports/
    To modify existing arrival_report(s) of an existing request_form

    """

    permission_classes = [VaccineSupplyChainReadWritePerm]
    http_method_names = ["get", "post", "delete", "patch"]

    filter_backends = [NoFormDjangoFilterBackend, VRFCustomOrderingFilter, filters.OrderingFilter]
    filterset_fields = {
        "campaign__obr_name": ["exact"],
        "campaign__country": ["exact"],
        "vaccine_type": ["exact"],
        "rounds__started_at": ["exact", "gte", "lte", "range"],
        "rounds__ended_at": ["exact", "gte", "lte", "range"],
    }
    ordering_fields = ["created_at", "updated_at"]

    model = VaccineRequestForm

    def get_queryset(self):
        return VaccineRequestForm.objects.filter(campaign__account=self.request.user.iaso_profile.account).order_by(
            "id"
        )

    # override the destroy action to delete all the related arrival reports and pre alerts
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.vaccinearrivalreport_set.all().delete()
        instance.vaccineprealert_set.all().delete()
        instance.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    def _do_generic(self, request, pk, serializer_class, set_attr_name):
        instance = self.get_object()
        serializer = serializer_class(data=request.data)
        if serializer.is_valid():
            pre_alerts = serializer.save(vaccine_request_form=instance)
            the_set = getattr(instance, set_attr_name)
            the_set.add(*pre_alerts)
            instance.save()
            return Response(status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def add_pre_alerts(self, request, pk=None):
        return self._do_generic(request, pk, PostPreAlertSerializer, "vaccineprealert_set")

    @action(detail=True, methods=["patch"])
    def update_pre_alerts(self, request, pk=None):
        return self._do_generic(request, pk, PatchPreAlertSerializer, "vaccineprealert_set")

    @action(detail=True, methods=["post"])
    def add_arrival_reports(self, request, pk=None):
        return self._do_generic(request, pk, PostArrivalReportSerializer, "vaccinearrivalreport_set")

    @action(detail=True, methods=["patch"])
    def update_arrival_reports(self, request, pk=None):
        return self._do_generic(request, pk, PatchArrivalReportSerializer, "vaccinearrivalreport_set")

    def get_serializer_class(self):
        if self.action == "list" or self.action == "retrieve":
            return VaccineRequestFormListSerializer
        elif self.action == "add_pre_alerts":
            return PostPreAlertSerializer
        elif self.action == "update_pre_alerts":
            return PatchPreAlertSerializer
        elif self.action == "add_arrival_reports":
            return PostArrivalReportSerializer
        elif self.action == "update_arrival_reports":
            return PatchArrivalReportSerializer

        else:
            return VaccineRequestFormPostSerializer
