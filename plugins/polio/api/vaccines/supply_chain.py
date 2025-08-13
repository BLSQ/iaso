import os

from logging import getLogger
from typing import Any

import django_filters

from django import forms
from django.db import IntegrityError
from django.db.models import Max, Min, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django_filters.rest_framework import DjangoFilterBackend
from nested_multipart_parser.drf import DrfNestedParser
from rest_framework import filters, serializers, status
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.parsers import JSONParser
from rest_framework.response import Response

from iaso.api.common import ModelViewSet, parse_comma_separated_numeric_values
from iaso.models import OrgUnit
from iaso.utils.virus_scan.clamav import scan_uploaded_file_for_virus
from iaso.utils.virus_scan.serializers import ModelWithFileSerializer
from plugins.polio import permissions as polio_permissions
from plugins.polio.api.vaccines.permissions import VaccineStockPermission, can_edit_helper
from plugins.polio.api.vaccines.stock_management import CampaignCategory
from plugins.polio.models import Campaign, Round, VaccineArrivalReport, VaccinePreAlert, VaccineRequestForm


logger = getLogger(__name__)

PA_SET = "vaccineprealert_set"
AR_SET = "vaccinearrivalreport_set"


def validate_rounds_and_campaign(data, current_user=None, force_rounds=True, force_campaign=True):
    rounds_data = data.get("rounds")
    campaign_obr_name = data.get("campaign")
    new_campaign = None

    if force_rounds and not rounds_data:
        raise forms.ValidationError("At least one round must be attached.")

    if force_campaign and not campaign_obr_name:
        raise forms.ValidationError("A campaign must be attached.")

    try:
        if isinstance(campaign_obr_name, Campaign):
            new_campaign = campaign_obr_name
        else:
            new_campaign = Campaign.objects.get(obr_name=campaign_obr_name)
            data["campaign"] = new_campaign
    except Campaign.DoesNotExist:
        if force_campaign:
            raise forms.ValidationError(f"No campaign with obr_name {campaign_obr_name} found.")

    if isinstance(rounds_data, list):
        new_rounds = []
        for round in rounds_data:
            if isinstance(round, dict) and "number" in round:
                try:
                    round_obj = Round.objects.get(number=round["number"], campaign=new_campaign)
                    if not round_obj.actual_scopes:
                        raise forms.ValidationError("Rounds without scope are not allowed")
                    new_rounds.append(round_obj)
                except Round.MultipleObjectsReturned:
                    raise forms.ValidationError(f"Multiple rounds with number {round['number']} found in the campaign.")
                except Round.DoesNotExist:
                    raise forms.ValidationError(f"No round with number {round['number']} found in the campaign.")
            elif hasattr(round, "campaign") and round.campaign != new_campaign:
                raise forms.ValidationError("Each round's campaign must be the same as the form's campaign.")
            elif not round.actual_scopes:
                raise forms.ValidationError("Rounds without scope are not allowed")
        data["rounds"] = new_rounds
    else:
        try:
            new_rounds = []
            for round in rounds_data.all():
                if round.campaign != new_campaign:
                    raise forms.ValidationError("Each round's campaign must be the same as the form's campaign.")
                if not round.actual_scopes:
                    raise forms.ValidationError("Rounds without scope are not allowed")
                new_rounds.append(round)
            data["rounds"] = new_rounds
        except AttributeError:
            if force_rounds:
                raise forms.ValidationError("Couldn't find any rounds.")

    if current_user and new_campaign:
        if not current_user.iaso_profile.account == new_campaign.account:
            raise forms.ValidationError("The selected account must be the same as the user's account.")

    return data


class NestedRoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = ["number", "id"]


class NestedRoundPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = ["number"]


class NestedVaccinePreAlertSerializerForPost(ModelWithFileSerializer):
    class Meta:
        model = VaccinePreAlert
        fields = [
            "date_pre_alert_reception",
            "po_number",
            "estimated_arrival_time",
            "doses_shipped",
            "doses_per_vial",
            "vials_shipped",
            "file",
            "scan_timestamp",
            "scan_result",
        ]

    def validate(self, attrs: Any) -> Any:
        validated_data = super().validate(attrs)
        if "PO" in validated_data.get("po_number", "") or "po" in validated_data.get("po_number", ""):
            raise serializers.ValidationError("PO number should not be prefixed")

        return validated_data

    def create(self, validated_data):
        validated_data["request_form"] = self.context["vaccine_request_form"]
        self.scan_file_if_exists(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data["request_form"] = self.context["vaccine_request_form"]
        self.scan_file_if_exists(validated_data)
        return super().update(instance, validated_data)


class NestedVaccinePreAlertSerializerForPatch(NestedVaccinePreAlertSerializerForPost):
    id = serializers.IntegerField(required=True, read_only=False)
    date_pre_alert_reception = serializers.DateField(required=False)
    po_number = serializers.CharField(required=False)
    estimated_arrival_time = serializers.DateField(required=False)
    doses_shipped = serializers.IntegerField(required=False)
    doses_per_vial = serializers.IntegerField(required=False, read_only=True)
    vials_shipped = serializers.IntegerField(required=False, read_only=True)
    can_edit = serializers.SerializerMethodField()

    class Meta(NestedVaccinePreAlertSerializerForPost.Meta):
        fields = NestedVaccinePreAlertSerializerForPost.Meta.fields + [
            "id",
            "can_edit",
        ]

    def validate(self, attrs: Any) -> Any:
        # at least one of the other fields must be present
        if not any(key in attrs.keys() for key in NestedVaccinePreAlertSerializerForPost.Meta.fields):
            raise serializers.ValidationError("At least one of the fields must be present.")

        validated_data = super().validate(attrs)
        if "PO" in validated_data.get("po_number", "") or "po" in validated_data.get("po_number", ""):
            raise serializers.ValidationError("PO number should not be prefixed")

        # Get current object
        current_obj = VaccinePreAlert.objects.get(id=attrs["id"])

        # Check if any values are actually different
        is_different = False
        for key in attrs.keys():
            if key == "file":
                # Skip if no new document is being uploaded
                if not attrs[key]:
                    continue

                new_file = attrs[key]
                old_file = current_obj.file

                # If there's no existing document but we're uploading one
                if not old_file:
                    is_different = True
                    current_obj.file = new_file
                    continue

                # Compare file names and sizes
                if os.path.basename(old_file.name) != os.path.basename(new_file.name) or old_file.size != new_file.size:
                    is_different = True
                    current_obj.file = new_file
            elif hasattr(current_obj, key) and getattr(current_obj, key) != attrs[key]:
                is_different = True
                break

        # Only check edit permission if there are actual changes
        if is_different and not self.get_can_edit(current_obj):
            raise serializers.ValidationError(
                {"detail": "You do not have permission to edit this pre-alert"},
                code="permission_denied",
            )

        return validated_data

    def get_can_edit(self, obj):
        return can_edit_helper(
            self.context["request"].user,
            obj.created_at,
            admin_perm=polio_permissions.POLIO_VACCINE_SUPPLY_CHAIN_WRITE,
            non_admin_perm=polio_permissions.POLIO_VACCINE_SUPPLY_CHAIN_READ,
            read_only_perm=polio_permissions.POLIO_VACCINE_SUPPLY_CHAIN_READ_ONLY,
        )


class NestedVaccineArrivalReportSerializerForPost(serializers.ModelSerializer):
    class Meta:
        model = VaccineArrivalReport
        fields = [
            "arrival_report_date",
            "doses_received",
            "doses_per_vial",
            "vials_received",
            "vials_shipped",
            "doses_shipped",
            "po_number",
        ]

    def validate(self, attrs: Any) -> Any:
        validated_data = super().validate(attrs)
        if "PO" in validated_data.get("po_number", "") or "po" in validated_data.get("po_number", ""):
            raise serializers.ValidationError("PO number should not be prefixed")
        return validated_data

    def save(self, **kwargs):
        vaccine_request_form = self.context["vaccine_request_form"]
        return super().save(**kwargs, request_form=vaccine_request_form)


class NestedVaccineArrivalReportSerializerForPatch(NestedVaccineArrivalReportSerializerForPost):
    id = serializers.IntegerField(required=True, read_only=False)
    arrival_report_date = serializers.DateField(required=False)
    po_number = serializers.CharField(required=False)
    doses_received = serializers.IntegerField(required=False)
    doses_shipped = serializers.IntegerField(required=False)
    doses_per_vial = serializers.IntegerField(required=False, read_only=True)
    vials_received = serializers.IntegerField(required=False, read_only=True)
    vials_shipped = serializers.IntegerField(required=False, read_only=True)
    can_edit = serializers.SerializerMethodField()

    class Meta(NestedVaccineArrivalReportSerializerForPost.Meta):
        fields = NestedVaccineArrivalReportSerializerForPost.Meta.fields + [
            "id",
            "can_edit",
        ]

    def validate(self, attrs: Any) -> Any:
        # at least one of the other fields must be present
        if not any(key in attrs.keys() for key in NestedVaccineArrivalReportSerializerForPost.Meta.fields):
            raise serializers.ValidationError("At least one of the fields must be present.")

        validated_data = super().validate(attrs)
        if "PO" in validated_data.get("po_number", "") or "po" in validated_data.get("po_number", ""):
            raise serializers.ValidationError("PO number should not be prefixed")

        # Get current object
        current_obj = VaccineArrivalReport.objects.get(id=attrs["id"])

        # Check if any values are actually different
        is_different = False
        for key in attrs.keys():
            if key == "file":
                # Skip if no new document is being uploaded
                if not attrs[key]:
                    continue

                new_file = attrs[key]
                old_file = current_obj.file

                # If there's no existing document but we're uploading one
                if not old_file:
                    is_different = True
                    current_obj.file = new_file
                    continue

                if os.path.basename(old_file.name) != os.path.basename(new_file.name) or old_file.size != new_file.size:
                    is_different = True
                    current_obj.file = new_file
            elif hasattr(current_obj, key) and getattr(current_obj, key) != attrs[key]:
                is_different = True
                break

        # Only check edit permission if there are actual changes
        if is_different and not self.get_can_edit(current_obj):
            raise serializers.ValidationError(
                {"detail": "You do not have permission to edit this arrival report"},
                code="permission_denied",
            )

        return validated_data

    def get_can_edit(self, obj):
        return can_edit_helper(
            self.context["request"].user,
            obj.created_at,
            admin_perm=polio_permissions.POLIO_VACCINE_SUPPLY_CHAIN_WRITE,
            non_admin_perm=polio_permissions.POLIO_VACCINE_SUPPLY_CHAIN_READ,
            read_only_perm=polio_permissions.POLIO_VACCINE_SUPPLY_CHAIN_READ_ONLY,
        )


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

    # Not a ModelSerializer, so we can use create to PATCH
    def create(self, validated_data, **kwargs):
        vaccine_request_form = self.context["vaccine_request_form"]
        pre_alerts = []

        for item in self.validated_data["pre_alerts"]:
            # The update method of this serializer is not called so we have to scan the file manually in the code below
            pre_alert = NestedVaccinePreAlertSerializerForPatch(data=item, context=self.context)
            if pre_alert.is_valid():
                pa = vaccine_request_form.vaccineprealert_set.get(id=item.get("id"))
                is_different = False
                for key in item.keys():
                    if key == "file":
                        if not item[key]:
                            continue

                        new_file = item[key]
                        old_file = pa.file

                        if not old_file or (
                            os.path.basename(old_file.name) != os.path.basename(new_file.name)
                            or old_file.size != new_file.size
                        ):
                            is_different = True
                            result, timestamp = scan_uploaded_file_for_virus(new_file)
                            pa.file = new_file
                            pa.file_scan_status = result
                            pa.file_last_scan = timestamp
                    elif hasattr(pa, key) and getattr(pa, key) != item[key]:
                        is_different = True
                        setattr(pa, key, item[key])

                if is_different:
                    if can_edit_helper(
                        self.context["request"].user,
                        pa.created_at,
                        admin_perm=polio_permissions.POLIO_VACCINE_SUPPLY_CHAIN_WRITE,
                        non_admin_perm=polio_permissions.POLIO_VACCINE_SUPPLY_CHAIN_READ,
                        read_only_perm=polio_permissions.POLIO_VACCINE_SUPPLY_CHAIN_READ_ONLY,
                    ):
                        try:
                            pa.save()
                        except IntegrityError as e:
                            raise serializers.ValidationError(str(e))
                    else:
                        raise serializers.ValidationError(f"You are not allowed to edit the pre-alert with id {pa.id}")

                pre_alerts.append(pa)

            else:
                logger.error(pre_alert.errors)

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
                    if can_edit_helper(
                        self.context["request"].user,
                        ar.created_at,
                        admin_perm=polio_permissions.POLIO_VACCINE_SUPPLY_CHAIN_WRITE,
                        non_admin_perm=polio_permissions.POLIO_VACCINE_SUPPLY_CHAIN_READ,
                        read_only_perm=polio_permissions.POLIO_VACCINE_SUPPLY_CHAIN_READ_ONLY,
                    ):
                        try:
                            ar.save()
                        except IntegrityError as e:
                            raise serializers.ValidationError(str(e))
                    else:
                        raise serializers.ValidationError(
                            f"You are not allowed to edit the arrival report with id {ar.id}"
                        )

                arrival_reports.append(ar)

            else:
                logger.error(arrival_report.errors)

        return {"arrival_reports": arrival_reports}


class NestedCountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnit
        fields = ["name", "id"]


class VaccineRequestFormPostSerializer(ModelWithFileSerializer):
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
            "target_population",
            "vrf_type",
            "file",
        ]

        read_only_fields = ["created_at", "updated_at"]

    def to_internal_value(self, data):
        # Manually invoke validate_rounds if 'rounds' is a string
        if "rounds" in data and isinstance(data["rounds"], str):
            try:
                rounds = parse_comma_separated_numeric_values(data["rounds"], "rounds")
                data["rounds"] = [{"number": num} for num in rounds]
            except Exception as e:
                raise serializers.ValidationError(f"Invalid rounds data: {e}")
        return super().to_internal_value(data)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # replace the 'campaign' field with the id of the campaign
        ret["campaign"] = str(instance.campaign.id)

        return ret

    def create(self, validated_data):
        validate_rounds_and_campaign(validated_data, self.context["request"].user)
        rounds = validated_data.pop("rounds")
        request_form = VaccineRequestForm.objects.create(**validated_data)
        request_form.rounds.set(rounds)
        if self.scan_file_if_exists(validated_data):
            request_form.file_last_scan = validated_data["file_last_scan"]
            request_form.file_scan_status = validated_data["file_scan_status"]
            request_form.save()
        return request_form

    def update(self, instance, validated_data):
        validate_rounds_and_campaign(
            validated_data,
            self.context["request"].user,
            force_rounds=False,
            force_campaign=False,
        )
        rounds = validated_data.pop("rounds", None)
        self.scan_file_if_exists(validated_data, instance)
        super().update(instance, validated_data)

        # Multiple nested serializers need to be handled manually
        if rounds:
            instance_rounds = set(instance.rounds.all())
            if set(rounds) != instance_rounds:
                instance.rounds.set(rounds)

        return instance


class VaccineRequestFormDetailSerializer(ModelWithFileSerializer):
    country_name = serializers.CharField(source="campaign.country.name")
    country_id = serializers.IntegerField(source="campaign.country.id")
    obr_name = serializers.CharField(source="campaign.obr_name")
    rounds = NestedRoundSerializer(many=True)
    can_edit = serializers.SerializerMethodField()

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
            "target_population",
            "vrf_type",
            "scan_result",
            "scan_timestamp",
            "file",
            "can_edit",
        ]

    def get_can_edit(self, obj):
        return can_edit_helper(
            self.context["request"].user,
            obj.created_at,
            admin_perm=polio_permissions.POLIO_VACCINE_SUPPLY_CHAIN_WRITE,
            non_admin_perm=polio_permissions.POLIO_VACCINE_SUPPLY_CHAIN_READ,
            read_only_perm=polio_permissions.POLIO_VACCINE_SUPPLY_CHAIN_READ_ONLY,
        )

    def create(self, validated_data):
        self.scan_file_if_exists(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        self.scan_file_if_exists(validated_data)
        return super().update(instance, validated_data)


class VaccineRequestFormListSerializer(serializers.ModelSerializer):
    country = NestedCountrySerializer(source="campaign.country")
    obr_name = serializers.CharField(source="campaign.obr_name")
    po_numbers = serializers.SerializerMethodField()
    rounds = NestedRoundSerializer(many=True)
    start_date = serializers.SerializerMethodField()
    end_date = serializers.SerializerMethodField()
    doses_shipped = serializers.SerializerMethodField()
    doses_received = serializers.SerializerMethodField()
    eta = serializers.SerializerMethodField()
    var = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    campaign_category = serializers.SerializerMethodField()

    class Meta:
        model = VaccineRequestForm
        fields = [
            "id",
            "country",
            "vaccine_type",
            "obr_name",
            "po_numbers",
            "rounds",
            "quantities_ordered_in_doses",
            "start_date",
            "end_date",
            "doses_shipped",
            "doses_received",
            "eta",
            "var",
            "created_at",
            "updated_at",
            "vrf_type",
            "can_edit",
            "campaign_category",
        ]

    def get_can_edit(self, obj):
        return can_edit_helper(
            self.context["request"].user,
            obj.created_at,
            admin_perm=polio_permissions.POLIO_VACCINE_SUPPLY_CHAIN_WRITE,
            non_admin_perm=polio_permissions.POLIO_VACCINE_SUPPLY_CHAIN_READ,
            read_only_perm=polio_permissions.POLIO_VACCINE_SUPPLY_CHAIN_READ_ONLY,
        )

    def get_campaign_category(self, obj):
        campaign = obj.campaign
        if campaign.is_test:
            return CampaignCategory.TEST_CAMPAIGN
        if campaign.on_hold:
            return CampaignCategory.CAMPAIGN_ON_HOLD
        if not campaign.rounds.all().exclude(on_hold=True).exists():
            return CampaignCategory.ALL_ROUNDS_ON_HOLD
        if obj.rounds.filter(on_hold=True).exists():
            return CampaignCategory.ROUND_ON_HOLD
        return CampaignCategory.REGULAR

    def get_prefetched_data(self, obj):
        # Prefetch vaccine pre_alert and vaccinearrival_report to reduce the number of queries in the DB
        pre_alerts = obj.vaccineprealert_set.all().order_by("-estimated_arrival_time")
        arrival_reports = obj.vaccinearrivalreport_set.all().order_by("-arrival_report_date")

        # Get arrival reports matching by po_number
        arrival_report_matching = {}
        for report in arrival_reports:
            if report.po_number not in arrival_report_matching:
                arrival_report_matching[report.po_number] = []
            arrival_report_matching[report.po_number].append(report)

        return pre_alerts, arrival_report_matching, arrival_reports

    # Comma separated list of all
    def get_po_numbers(self, obj):
        pre_alerts, arrival_report_matching, arrival_reports = self.get_prefetched_data(obj)

        po_numbers = []
        for pre_alert in pre_alerts:
            matching_reports = arrival_report_matching.get(pre_alert.po_number, [])
            if matching_reports:
                for _ in matching_reports:
                    po_numbers.append(str(pre_alert.po_number))
            else:
                po_numbers.append(pre_alert.po_number)

        # Add arrival reports that don't have a PO number matching an prealert

        for arrival_report in arrival_reports:
            if arrival_report.po_number not in po_numbers:
                po_numbers.append(arrival_report.po_number)
        return ",".join(po_numbers)

    def get_start_date(self, obj):
        rounds = obj.rounds.all()
        if not rounds:
            return timezone.now().date()
        return min(rounds, key=lambda round: round.started_at).started_at

    def get_end_date(self, obj):
        rounds = obj.rounds.all()
        if not rounds:
            return timezone.now().date()
        return max(rounds, key=lambda round: round.ended_at).ended_at

    def get_doses_shipped(self, obj):
        return obj.total_doses_shipped()

    def get_doses_received(self, obj):
        return obj.total_doses_received()

    # Comma Separated List of all estimated arrival times
    def get_eta(self, obj):
        pre_alerts, _, arrival_reports = self.get_prefetched_data(obj)
        estimated_arrival_dates = {}
        for pre_alert in pre_alerts:
            if pre_alert.po_number not in estimated_arrival_dates:
                estimated_arrival_dates[pre_alert.po_number] = str(pre_alert.estimated_arrival_time)

        # Add missing arrival report po numbers from pre_alerts
        for arrival_report in arrival_reports:
            if arrival_report.po_number not in estimated_arrival_dates:
                estimated_arrival_dates[arrival_report.po_number] = ""

        return ",".join([eta for _, eta in estimated_arrival_dates.items()])

    # Comma Separated List of all arrival report dates
    def get_var(self, obj):
        pre_alerts, arrival_report_matching, arrival_reports = self.get_prefetched_data(obj)

        arrival_report_dates = []
        for pre_alert in pre_alerts:
            matching_reports = arrival_report_matching.get(pre_alert.po_number, None)
            if matching_reports:
                for report in matching_reports:
                    arrival_report_dates.append(str(report.arrival_report_date))
            else:
                arrival_report_dates.append("")
        # Add arrival reports that don't have a PO number matching a prealert
        for arrival_report in arrival_reports:
            if str(arrival_report.arrival_report_date) not in arrival_report_dates:
                arrival_report_dates.append(str(arrival_report.arrival_report_date))

        return ",".join(arrival_report_dates)


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
        elif current_order == "doses_received":
            queryset = queryset.annotate(
                doses_received=Coalesce(Sum("vaccinearrivalreport__doses_received"), 0)
            ).order_by("doses_received")
        elif current_order == "-doses_received":
            queryset = queryset.annotate(
                doses_received=Coalesce(Sum("vaccinearrivalreport__doses_received"), 0)
            ).order_by("-doses_received")
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
        elif current_order == "quantities_ordered_in_doses":
            queryset = queryset.order_by("quantities_ordered_in_doses")
        elif current_order == "-quantities_ordered_in_doses":
            queryset = queryset.order_by("-quantities_ordered_in_doses")

        # handle the case where there are no rounds
        elif current_order == "start_date":
            queryset = queryset.annotate(
                start_date=Coalesce(Min("rounds__started_at"), timezone.now().date())
            ).order_by("start_date")
        elif current_order == "-start_date":
            queryset = queryset.annotate(
                start_date=Coalesce(Min("rounds__started_at"), timezone.now().date())
            ).order_by("-start_date")
        elif current_order == "end_date":
            queryset = queryset.annotate(end_date=Coalesce(Max("rounds__ended_at"), timezone.now().date())).order_by(
                "end_date"
            )
        elif current_order == "-end_date":
            queryset = queryset.annotate(end_date=Coalesce(Max("rounds__ended_at"), timezone.now().date())).order_by(
                "-end_date"
            )

        return queryset


class VRFCustomFilter(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        country_blocks = request.GET.get("country_blocks", None)
        if country_blocks is None:
            return queryset
        try:
            return queryset.filter(campaign__country__groups__in=country_blocks.split(","))
        except:
            return queryset


# Otherwise the /api/ page generated by DRF is very slow
# It will load all the orgnunits in order to populate the filters dropdown for campaign_country


class NoFormDjangoFilterBackend(DjangoFilterBackend):
    def to_html(self, request, queryset, view):
        return ""


class VaccineRequestFormFilterSet(django_filters.FilterSet):
    round_id = django_filters.NumberFilter(field_name="rounds", label=_("Round ID"))

    class Meta:
        model = VaccineRequestForm
        fields = {
            "campaign__obr_name": ["exact"],
            "campaign__country": ["exact"],
            "vaccine_type": ["exact"],
            "rounds__started_at": ["exact", "gte", "lte", "range"],
            "rounds__ended_at": ["exact", "gte", "lte", "range"],
        }


class VaccineRequestFormViewSet(ModelViewSet):
    """
    GET /api/polio/vaccine/request_forms/ to get the list of all request_forms
    Available filters:
    - campaign__obr_name : Use campaign obr_name
    - campaign__country : Use country id
    - vaccine_type : Use on of the VACCINES : mOPV2, nOPV2, bOPV
    - rounds__started_at : Use a date in the format YYYY-MM-DD
    - rounds__ended_at : Use a date in the format YYYY-MM-DD
    - round_id : Filter by a specific round ID

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

    permission_classes = [
        lambda: VaccineStockPermission(
            admin_perm=polio_permissions.POLIO_VACCINE_SUPPLY_CHAIN_WRITE,
            non_admin_perm=polio_permissions.POLIO_VACCINE_SUPPLY_CHAIN_READ,
            read_only_perm=polio_permissions.POLIO_VACCINE_SUPPLY_CHAIN_READ_ONLY,
        )
    ]
    http_method_names = ["get", "post", "delete", "patch"]
    parser_classes = (JSONParser, DrfNestedParser)

    filter_backends = [
        SearchFilter,
        NoFormDjangoFilterBackend,
        VRFCustomOrderingFilter,
        VRFCustomFilter,
        filters.OrderingFilter,
    ]
    filterset_class = VaccineRequestFormFilterSet

    ordering_fields = ["created_at", "updated_at"]
    search_fields = [
        "campaign__obr_name",
        "vaccine_type",
        "campaign__country__name",
        "vaccineprealert__po_number",
    ]

    model = VaccineRequestForm

    def get_queryset(self):
        accessible_org_units = OrgUnit.objects.filter_for_user_and_app_id(
            self.request.user, self.request.query_params.get("app_id")
        )
        accessible_org_units_ids = accessible_org_units.values_list("id", flat=True)
        return (
            VaccineRequestForm.objects.filter(
                campaign__account=self.request.user.iaso_profile.account,
                campaign__country__id__in=accessible_org_units_ids,
            )
            .prefetch_related("vaccineprealert_set", "vaccinearrivalreport_set", "rounds")
            .distinct()
            .order_by("id")
        )

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

        serializer = serializer_class(rel_objs, many=True, context={"request": request})
        return Response({res_name: serializer.data}, status=status.HTTP_200_OK)

    def _do_generic_add(self, request, serializer_class, set_attr_name, res_name):
        instance = self.get_object()
        serializer = serializer_class(
            data=request.data,
            context={"vaccine_request_form": instance, "request": request},
        )
        if serializer.is_valid():
            rel_objs = serializer.save()
            the_set = getattr(instance, set_attr_name)
            the_set.add(*rel_objs[res_name])
            return Response(status=status.HTTP_201_CREATED, data=serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _do_generic_update(self, request, serializer_class, set_attr_name):
        instance = self.get_object()
        serializer = serializer_class(
            data=request.data,
            context={"vaccine_request_form": instance, "request": request},
        )
        if serializer.is_valid():
            rel_objs = serializer.save()
            return Response(status=status.HTTP_200_OK, data=serializer.data)
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
        return self._do_generic_get(
            request,
            NestedVaccineArrivalReportSerializerForPatch,
            AR_SET,
            "arrival_reports",
        )

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
        if self.action == "retrieve":
            return VaccineRequestFormDetailSerializer
        if self.action == "add_pre_alerts":
            return PostPreAlertSerializer
        if self.action == "update_pre_alerts":
            return PatchPreAlertSerializer
        if self.action == "add_arrival_reports":
            return PostArrivalReportSerializer
        if self.action == "update_arrival_reports":
            return PatchArrivalReportSerializer
        if self.action in [
            "get_pre_alerts",
            "get_arrival_reports",
            "delete_pre_alerts",
            "delete_arrival_reports",
        ]:
            return None

        return VaccineRequestFormPostSerializer
