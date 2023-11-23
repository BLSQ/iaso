from typing import Any
from django import forms
from django.db.models import Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters, serializers, status
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.response import Response

from hat.menupermissions import models as permission
from iaso.api.common import GenericReadWritePerm, ModelViewSet
from iaso.models import OrgUnit
from plugins.polio.models import (
    Campaign,
    Round,
    VaccineArrivalReport,
    VaccinePreAlert,
    VaccineRequestForm,
    DOSES_PER_VIAL,
)


PA_SET = "vaccineprealert_set"
AR_SET = "vaccinearrivalreport_set"


def validate_rounds_and_campaign(data, current_user=None):
    rounds_data = data.get("rounds")
    campaign_obr_name = data.get("campaign")

    if not rounds_data:
        raise forms.ValidationError("At least one round must be attached.")

    if not campaign_obr_name:
        raise forms.ValidationError("A campaign must be attached.")

    try:
        new_campaign = Campaign.objects.get(obr_name=campaign_obr_name)
        data["campaign"] = new_campaign
    except Campaign.DoesNotExist:
        raise forms.ValidationError(f"No campaign with obr_name {campaign_obr_name} found.")

    if isinstance(rounds_data, list):
        new_rounds = []
        for round in rounds_data:
            if isinstance(round, dict) and "number" in round:
                try:
                    round_obj = Round.objects.get(number=round["number"], campaign=new_campaign)
                    new_rounds.append(round_obj)
                except Round.MultipleObjectsReturned:
                    raise forms.ValidationError(f"Multiple rounds with number {round['number']} found in the campaign.")
                except Round.DoesNotExist:
                    raise forms.ValidationError(f"No round with number {round['number']} found in the campaign.")
            elif hasattr(round, "campaign") and round.campaign != new_campaign:
                raise forms.ValidationError("Each round's campaign must be the same as the form's campaign.")
        data["rounds"] = new_rounds
    else:
        try:
            new_rounds = []
            for round in rounds_data.all():
                if round.campaign != new_campaign:
                    raise forms.ValidationError("Each round's campaign must be the same as the form's campaign.")
                new_rounds.append(round)
            data["rounds"] = new_rounds
        except AttributeError:
            raise forms.ValidationError("Couldn't find any rounds.")

    if current_user:
        if not current_user.iaso_profile.account == new_campaign.account:
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
        fields = ["number"]


class BasePostPatchSerializer(serializers.ModelSerializer):
    def save(self, **kwargs):
        vaccine_request_form = self.context["vaccine_request_form"]
        return super().save(**kwargs, request_form=vaccine_request_form)


class NestedVaccinePreAlertSerializerForPost(BasePostPatchSerializer):
    class Meta:
        model = VaccinePreAlert
        fields = [
            "date_pre_alert_reception",
            "po_number",
            "estimated_arrival_time",
            "lot_numbers",
            "expiration_date",
            "doses_shipped",
            "doses_per_vial",
        ]


class NestedVaccinePreAlertSerializerForPatch(NestedVaccinePreAlertSerializerForPost):
    id = serializers.IntegerField(required=True, read_only=False)
    date_pre_alert_reception = serializers.DateField(required=False)
    po_number = serializers.CharField(required=False)
    lot_numbers = serializers.ListField(child=serializers.CharField(), required=False)
    estimated_arrival_time = serializers.DateField(required=False)
    expiration_date = serializers.DateField(required=False)
    doses_shipped = serializers.IntegerField(required=False)
    doses_per_vial = serializers.IntegerField(required=False)

    class Meta(NestedVaccinePreAlertSerializerForPost.Meta):
        fields = NestedVaccinePreAlertSerializerForPost.Meta.fields + ["id"]

    def validate(self, attrs: Any) -> Any:
        # at least one of the other fields must be present
        if not any(key in attrs.keys() for key in NestedVaccinePreAlertSerializerForPost.Meta.fields):
            raise serializers.ValidationError("At least one of the fields must be present.")

        return super().validate(attrs)


class NestedVaccineArrivalReportSerializerForPost(BasePostPatchSerializer):
    # doses_per_vial = serializers.SerializerMethodField()

    class Meta:
        model = VaccineArrivalReport
        fields = [
            "arrival_report_date",
            "doses_received",
            "doses_per_vial",
            "lot_numbers",
            "expiration_date",
            "doses_shipped",
            "po_number",
        ]

    # def get_doses_per_vial(self, obj):
    #     return DOSES_PER_VIAL[obj.request_form.vaccine_type]


class NestedVaccineArrivalReportSerializerForPatch(NestedVaccineArrivalReportSerializerForPost):
    id = serializers.IntegerField(required=True, read_only=False)
    arrival_report_date = serializers.DateField(required=False)
    expiration_date = serializers.DateField(required=False)
    po_number = serializers.CharField(required=False)
    lot_numbers = serializers.ListField(child=serializers.CharField(), required=False)
    doses_received = serializers.IntegerField(required=False)
    doses_shipped = serializers.IntegerField(required=False)
    doses_per_vial = serializers.IntegerField(required=False)

    class Meta(NestedVaccineArrivalReportSerializerForPost.Meta):
        fields = NestedVaccineArrivalReportSerializerForPost.Meta.fields + ["id"]

    def validate(self, attrs: Any) -> Any:
        # at least one of the other fields must be present
        if not any(key in attrs.keys() for key in NestedVaccineArrivalReportSerializerForPost.Meta.fields):
            raise serializers.ValidationError("At least one of the fields must be present.")

        return super().validate(attrs)


class PostPreAlertSerializer(serializers.Serializer):
    pre_alerts = NestedVaccinePreAlertSerializerForPost(
        many=True,
    )

    def create(self, validated_data, **kwargs):
        pre_alerts = []

        for item in self.validated_data["pre_alerts"]:
            pre_alert = NestedVaccinePreAlertSerializerForPost(data=item, context=self.context)
            if pre_alert.is_valid():
                pre_alert.save()
                pre_alerts.append(pre_alert.instance)

        return {"pre_alerts": pre_alerts}


class PatchPreAlertSerializer(serializers.Serializer):
    pre_alerts = NestedVaccinePreAlertSerializerForPatch(many=True)

    def create(self, validated_data, **kwargs):
        vaccine_request_form = self.context["vaccine_request_form"]
        pre_alerts = []

        for item in self.validated_data["pre_alerts"]:
            pre_alert = NestedVaccinePreAlertSerializerForPatch(data=item, context=self.context)

            if pre_alert.is_valid():
                ar = vaccine_request_form.vaccineprealert_set.get(id=item.get("id"))
                is_different = False
                for key in item.keys():
                    if hasattr(ar, key) and getattr(ar, key) != item[key]:
                        is_different = True
                        setattr(ar, key, item[key])

                if is_different:
                    ar.save()

                pre_alerts.append(ar)

            else:
                print(pre_alert.errors)

        return {"pre_alerts": pre_alerts}


class PostArrivalReportSerializer(serializers.Serializer):
    arrival_reports = NestedVaccineArrivalReportSerializerForPost(many=True)

    def create(self, validated_data, **kwargs):
        arrival_reports = []

        for item in self.validated_data["arrival_reports"]:
            arrival_report = NestedVaccineArrivalReportSerializerForPost(data=item, context=self.context)
            if arrival_report.is_valid():
                arrival_report.save()
                arrival_reports.append(arrival_report.instance)

        return {"arrival_reports": arrival_reports}


class PatchArrivalReportSerializer(serializers.Serializer):
    arrival_reports = NestedVaccineArrivalReportSerializerForPatch(many=True)

    def create(self, validated_data, **kwargs):
        vaccine_request_form = self.context["vaccine_request_form"]
        arrival_reports = []

        for item in self.validated_data["arrival_reports"]:
            arrival_report = NestedVaccineArrivalReportSerializerForPatch(data=item, context=self.context)

            if arrival_report.is_valid():
                ar = vaccine_request_form.vaccinearrivalreport_set.get(id=item.get("id"))
                is_different = False
                for key in item.keys():
                    if hasattr(ar, key) and getattr(ar, key) != item[key]:
                        is_different = True
                        setattr(ar, key, item[key])

                if is_different:
                    ar.save()

                arrival_reports.append(ar)

            else:
                print(arrival_report.errors)

        return {"arrival_reports": arrival_reports}


class NestedCountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnit
        fields = ["name", "id"]


class VaccineRequestFormPostSerializer(serializers.ModelSerializer):
    rounds = NestedRoundPostSerializer(many=True)
    campaign = serializers.CharField()

    class Meta:
        model = VaccineRequestForm
        fields = [
            "id",
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

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # replace the 'campaign' field with the id of the campaign
        ret["campaign"] = str(instance.campaign.id)

        return ret

    def create(self, validated_data):
        rounds = validated_data.pop("rounds")
        campaign = validated_data.pop("campaign")
        request_form = VaccineRequestForm.objects.create(**validated_data, campaign=campaign)
        request_form.rounds.set(rounds)
        return request_form

    def update(self, instance, validated_data):
        rounds = validated_data.pop("rounds", None)
        campaign = validated_data.pop("campaign", None)
        modified = False

        for attr, value in validated_data.items():
            if getattr(instance, attr) != value:
                setattr(instance, attr, value)
                modified = True

        if rounds:
            instance_rounds = set(instance.rounds.all())
            if set(rounds) != instance_rounds:
                instance.rounds.set(rounds)
                modified = True

        if campaign and instance.campaign != campaign:
            instance.campaign = campaign
            modified = True

        if modified:
            instance.save()
        return instance


class VaccineRequestFormDetailSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source="campaign.country.name")
    country_id = serializers.IntegerField(source="campaign.country.id")
    obr_name = serializers.CharField(source="campaign.obr_name")
    rounds = NestedRoundSerializer(many=True)

    class Meta:
        model = VaccineRequestForm
        fields = [
            "id",
            "campaign",
            "vaccine_type",
            "rounds",
            "date_vrf_signature",
            "date_vrf_reception",
            "date_dg_approval",
            "quantities_ordered_in_doses",
            "created_at",
            "updated_at",
            # optional fields
            "wastage_rate_used_on_vrf",
            "date_vrf_submission_to_orpg",
            "quantities_approved_by_orpg_in_doses",
            "date_rrt_orpg_approval",
            "date_vrf_submitted_to_dg",
            "quantities_approved_by_dg_in_doses",
            "comment",
            "country_name",
            "country_id",
            "obr_name",
        ]


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

    # - add search keyword handling
    # - filter by round start date > doublons
    # feature flag
    # - add GET arrival reports and pre alerts

    permission_classes = [VaccineSupplyChainReadWritePerm]
    http_method_names = ["get", "post", "delete", "patch"]

    filter_backends = [SearchFilter, NoFormDjangoFilterBackend, VRFCustomOrderingFilter, filters.OrderingFilter]
    filterset_fields = {
        "campaign__obr_name": ["exact"],
        "campaign__country": ["exact"],
        "vaccine_type": ["exact"],
        "rounds__started_at": ["exact", "gte", "lte", "range"],
        "rounds__ended_at": ["exact", "gte", "lte", "range"],
    }
    ordering_fields = ["created_at", "updated_at"]
    search_fields = ["campaign__obr_name", "vaccine_type", "campaign__country__name"]

    model = VaccineRequestForm

    def get_queryset(self):
        return (
            VaccineRequestForm.objects.filter(campaign__account=self.request.user.iaso_profile.account)
            .distinct()
            .order_by("id")
        )

    # def create(self, request, *args, **kwargs):
    #     serializer = self.get_serializer(data=request.data)
    #     serializer.is_valid(raise_exception=True)
    #     self.perform_create(serializer)
    #     headers = self.get_success_headers(serializer.data)
    #     serializer.data["campaign"] = str(serializer.data["campaign"].id)
    #     return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    # override the destroy action to delete all the related arrival reports and pre alerts
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.vaccinearrivalreport_set.all().delete()
        instance.vaccineprealert_set.all().delete()
        instance.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    def _do_generic_get(self, request, serializer_class, get_attr_name, res_name):
        request_form = self.get_object()
        rel_objs_qs = getattr(request_form, get_attr_name)
        rel_objs = list(rel_objs_qs.all().order_by("id").distinct())

        serializer = serializer_class(rel_objs, many=True)
        return Response({res_name: serializer.data}, status=status.HTTP_200_OK)

    def _do_generic_add(self, request, serializer_class, set_attr_name, res_name):
        instance = self.get_object()
        serializer = serializer_class(data=request.data, context={"vaccine_request_form": instance})
        if serializer.is_valid():
            rel_objs = serializer.save()
            the_set = getattr(instance, set_attr_name)
            the_set.add(*rel_objs[res_name])
            return Response(status=status.HTTP_201_CREATED, data=serializer.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _do_generic_update(self, request, serializer_class, set_attr_name):
        instance = self.get_object()
        serializer = serializer_class(data=request.data, context={"vaccine_request_form": instance})
        if serializer.is_valid():
            rel_objs = serializer.save()
            return Response(status=status.HTTP_200_OK, data=serializer.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _do_generic_delete(self, request, model_class):
        instance_id = request.query_params.get("id")
        instance = model_class.objects.get(id=instance_id)
        if instance.request_form.campaign.account != request.user.iaso_profile.account:
            return Response(status=status.HTTP_403_FORBIDDEN)
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def add_pre_alerts(self, request, pk=None):
        return self._do_generic_add(request, PostPreAlertSerializer, PA_SET, "pre_alerts")

    @action(detail=True, methods=["get"])
    def get_pre_alerts(self, request, pk=None):
        return self._do_generic_get(request, NestedVaccinePreAlertSerializerForPatch, PA_SET, "pre_alerts")

    @action(detail=True, methods=["patch"])
    def update_pre_alerts(self, request, pk=None):
        return self._do_generic_update(request, PatchPreAlertSerializer, PA_SET)

    @action(detail=True, methods=["post"])
    def add_arrival_reports(self, request, pk=None):
        return self._do_generic_add(request, PostArrivalReportSerializer, AR_SET, "arrival_reports")

    @action(detail=True, methods=["get"])
    def get_arrival_reports(self, request, pk=None):
        return self._do_generic_get(request, NestedVaccineArrivalReportSerializerForPatch, AR_SET, "arrival_reports")

    @action(detail=True, methods=["patch"])
    def update_arrival_reports(self, request, pk=None):
        return self._do_generic_update(request, PatchArrivalReportSerializer, AR_SET)

    @action(detail=True, methods=["delete"])
    def delete_pre_alerts(self, request, pk=None):
        return self._do_generic_delete(request, VaccinePreAlert)

    @action(detail=True, methods=["delete"])
    def delete_arrival_reports(self, request, pk=None):
        return self._do_generic_delete(request, VaccineArrivalReport)

    def get_serializer_class(self):
        if self.action == "list":
            return VaccineRequestFormListSerializer
        elif self.action == "retrieve":
            return VaccineRequestFormDetailSerializer
        elif self.action == "add_pre_alerts":
            return PostPreAlertSerializer
        elif self.action == "update_pre_alerts":
            return PatchPreAlertSerializer
        elif self.action == "add_arrival_reports":
            return PostArrivalReportSerializer
        elif self.action == "update_arrival_reports":
            return PatchArrivalReportSerializer
        elif self.action in ["get_pre_alerts", "get_arrival_reports", "delete_pre_alerts", "delete_arrival_reports"]:
            return None

        else:
            return VaccineRequestFormPostSerializer
