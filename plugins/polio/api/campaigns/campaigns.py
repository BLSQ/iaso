from datetime import datetime
import json
from time import gmtime, strftime
from typing import Any, List, Union

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.db.models import Max, Min, Q, Prefetch
from django.db.models.expressions import RawSQL
from django.db.models.query import QuerySet
from django.db.transaction import atomic
from django.http import HttpResponse, JsonResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.timezone import make_aware, now
from django.utils.translation import gettext as _
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from gspread.exceptions import APIError  # type: ignore
from openpyxl.writer.excel import save_virtual_workbook  # type: ignore
from rest_framework import filters, permissions, serializers, status
from rest_framework.decorators import action
from rest_framework.fields import Field
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.validators import UniqueValidator


from hat.api.export_utils import Echo, iter_items
from iaso.api.common import (
    CONTENT_TYPE_CSV,
    CONTENT_TYPE_XLSX,
    CSVExportMixin,
    CustomFilterBackend,
    DeletionFilterBackend,
    ModelViewSet,
)
from iaso.models import Group, OrgUnit
from plugins.polio.api.campaigns.campaigns_log import log_campaign_modification, serialize_campaign
from plugins.polio.api.common import CACHE_VERSION
from plugins.polio.api.rounds.round import RoundScopeSerializer, RoundSerializer, ShipmentSerializer
from plugins.polio.api.shared_serializers import (
    DestructionSerializer,
    GroupSerializer,
    OrgUnitSerializer,
    RoundDateHistoryEntrySerializer,
    RoundVaccineSerializer,
)
from plugins.polio.export_utils import generate_xlsx_campaigns_calendar, xlsx_file_name
from plugins.polio.models import (
    Campaign,
    CampaignGroup,
    CampaignScope,
    CountryUsersGroup,
    Destruction,
    Round,
    RoundDateHistoryEntry,
    RoundScope,
    RoundVaccine,
    Shipment,
    SpreadSheetImport,
)
from plugins.polio.preparedness.calculator import get_preparedness_score
from plugins.polio.preparedness.parser import InvalidFormatError, get_preparedness
from plugins.polio.preparedness.spreadsheet_manager import Campaign, generate_spreadsheet_for_campaign
from plugins.polio.preparedness.summary import preparedness_summary


# Don't display the url for Anonymous users
class RoundAnonymousSerializer(RoundSerializer):
    class Meta:
        model = Round
        exclude = ["preparedness_spreadsheet_url"]


class CampaignScopeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignScope
        fields = ["group", "vaccine"]

    group = GroupSerializer()


class CurrentAccountDefault:
    """
    May be applied as a `default=...` value on a serializer field.
    Returns the current user's account.
    """

    requires_context = True

    def __call__(self, serializer_field):
        return serializer_field.context["request"].user.iaso_profile.account_id


class CampaignSerializer(serializers.ModelSerializer):
    round_one = serializers.SerializerMethodField(read_only=True)
    round_two = serializers.SerializerMethodField(read_only=True)

    def get_round_one(self, campaign):
        for round in campaign.rounds.all():
            if round.number == 1:
                return RoundSerializer(round).data
        return None

    def get_round_two(self, campaign):
        for round in campaign.rounds.all():
            if round.number == 2:
                return RoundSerializer(round).data
        return None

    rounds = RoundSerializer(many=True, required=False)
    org_unit: Field = OrgUnitSerializer(source="initial_org_unit", read_only=True)
    top_level_org_unit_name: Field = serializers.SlugRelatedField(source="country", slug_field="name", read_only=True)
    top_level_org_unit_id: Field = serializers.SlugRelatedField(source="country", slug_field="id", read_only=True)
    general_status = serializers.SerializerMethodField()
    grouped_campaigns = serializers.PrimaryKeyRelatedField(
        many=True, queryset=CampaignGroup.objects.all(), required=False
    )
    # Account is filed per default the one of the connected user that update it
    account: Field = serializers.PrimaryKeyRelatedField(default=CurrentAccountDefault(), read_only=True)
    has_data_in_budget_tool = serializers.SerializerMethodField(read_only=True)

    def get_top_level_org_unit_name(self, campaign):
        if campaign.country:
            return campaign.country.name
        return ""

    def get_top_level_org_unit_id(self, campaign):
        if campaign.country:
            return campaign.country.id
        return ""

    def get_general_status(self, campaign):
        now_utc = timezone.now().date()
        ordered_rounds = list(campaign.rounds.all())
        ordered_rounds.sort(key=lambda x: x.number, reverse=True)
        for round in ordered_rounds:
            if round.ended_at and now_utc > round.ended_at:
                return _("Round {} ended").format(round.number)
            elif round.started_at and now_utc >= round.started_at:
                return _("Round {} started").format(round.number)
        return _("Preparing")

    def get_has_data_in_budget_tool(self, campaign):
        return campaign.budget_steps.count() > 0

    scopes = CampaignScopeSerializer(many=True, required=False)

    obr_name = serializers.CharField(validators=[UniqueValidator(queryset=Campaign.objects.all())])

    @atomic
    def create(self, validated_data):
        grouped_campaigns = validated_data.pop("grouped_campaigns", [])
        rounds = validated_data.pop("rounds", [])

        campaign_scopes = validated_data.pop("scopes", [])
        campaign = Campaign.objects.create(
            # there seems a bug in DRF the account is not in validated data, when not using HiddenField
            account_id=self.context["request"].user.iaso_profile.account_id,
            **validated_data,
        )

        campaign.grouped_campaigns.set(grouped_campaigns)

        # noinspection DuplicatedCode
        for scope in campaign_scopes:
            vaccine = scope.get("vaccine")
            org_units = scope.get("group", {}).get("org_units")
            scope, created = campaign.scopes.get_or_create(vaccine=vaccine)
            source_version_id = None
            name = f"scope for campaign {campaign.obr_name} - {vaccine}"
            if org_units:
                source_version_ids = set([ou.version_id for ou in org_units])
                if len(source_version_ids) != 1:
                    raise serializers.ValidationError("All orgunit should be in the same source version")
                source_version_id = list(source_version_ids)[0]
            if not scope.group:
                scope.group = Group.objects.create(name=name, source_version_id=source_version_id)
            else:
                scope.group.source_version_id = source_version_id
                scope.group.name = name
                scope.group.save()

            scope.group.org_units.set(org_units)

        for round_data in rounds:
            scopes = round_data.pop("scopes", [])
            round_serializer = RoundSerializer(data={**round_data, "campaign": campaign.id}, context=self.context)
            round_serializer.is_valid(raise_exception=True)
            round = round_serializer.save()

            for scope in scopes:
                vaccine = scope.get("vaccine")
                org_units = scope.get("group", {}).get("org_units")
                source_version_id = None
                if org_units:
                    source_version_ids = set([ou.version_id for ou in org_units])
                    if len(source_version_ids) != 1:
                        raise serializers.ValidationError("All orgunit should be in the same source version")
                    source_version_id = list(source_version_ids)[0]
                name = f"scope for round {round.number} campaign {campaign.obr_name} - {vaccine}"
                scope, created = round.scopes.get_or_create(vaccine=vaccine)
                if not scope.group:
                    scope.group = Group.objects.create(name=name)
                else:
                    scope.group.source_version_id = source_version_id
                    scope.group.name = name
                    scope.group.save()

                scope.group.org_units.set(org_units)

        campaign.update_geojson_field()
        campaign.save()
        log_campaign_modification(campaign, None, self.context["request"].user)
        return campaign

    @atomic
    def update(self, instance: Campaign, validated_data):
        old_campaign_dump = serialize_campaign(instance)
        rounds = validated_data.pop("rounds", [])
        campaign_scopes = validated_data.pop("scopes", [])
        for scope in campaign_scopes:
            vaccine = scope.get("vaccine")
            org_units = scope.get("group", {}).get("org_units")
            scope, created = instance.scopes.get_or_create(vaccine=vaccine)
            source_version_id = None
            name = f"scope for campaign {instance.obr_name} - {vaccine}"
            if org_units:
                source_version_ids = set([ou.version_id for ou in org_units])
                if len(source_version_ids) != 1:
                    raise serializers.ValidationError("All orgunit should be in the same source version")
                source_version_id = list(source_version_ids)[0]
            if not scope.group:
                scope.group = Group.objects.create(name=name, source_version_id=source_version_id)
            else:
                scope.group.source_version_id = source_version_id
                scope.group.name = name
                scope.group.save()

            scope.group.org_units.set(org_units)

        round_instances = []
        # find existing round either by id or number
        # Fixme this is not a partial update because of the dfault
        for round_data in rounds:
            round = None
            if round_data.get("id"):
                round_id = round_data["id"]
                round = Round.objects.get(pk=round_id)
                if round.campaign != instance:
                    raise serializers.ValidationError({"rounds": "round is attached to a different campaign"})
            elif round_data.get("number", None) is not None:
                try:
                    round = instance.rounds.get(number=round_data.get("number"))
                except Round.DoesNotExist:
                    pass
            # we pop the campaign since we use the set afterward which will also remove the deleted one
            round_data.pop("campaign", None)
            scopes = round_data.pop("scopes", [])

            # Replace ReasonForDelay instance with key_name to avoid type error when calling is_valid
            # Because the serializer is nested, and data is converted at every level of nesting
            # datelog["reason_for_delay"] is the ReasonForDelay instance, and not the  key_name that was passed by the front-end
            # So we have to extract the key_name from the instance and re-pass it to the serializer, otherwise we get an error
            round_datelogs = round_data.pop("datelogs", [])
            datelogs_with_pk = [
                {**datelog, "reason_for_delay": datelog["reason_for_delay"].key_name} for datelog in round_datelogs
            ]
            round_data["datelogs"] = datelogs_with_pk

            round_serializer = RoundSerializer(instance=round, data=round_data, context=self.context)
            round_serializer.is_valid(raise_exception=True)
            round_instance = round_serializer.save()
            round_instances.append(round_instance)
            round_datelogs = []
            for scope in scopes:
                vaccine = scope.get("vaccine")
                org_units = scope.get("group", {}).get("org_units")
                source_version_id = None
                if org_units:
                    source_version_ids = set([ou.version_id for ou in org_units])
                    if len(source_version_ids) != 1:
                        raise serializers.ValidationError("All orgunit should be in the same source version")
                    source_version_id = list(source_version_ids)[0]
                name = f"scope for round {round_instance.number} campaign {instance.obr_name} - {vaccine}"
                scope, created = round_instance.scopes.get_or_create(vaccine=vaccine)
                if not scope.group:
                    scope.group = Group.objects.create(name=name)
                else:
                    scope.group.source_version_id = source_version_id
                    scope.group.name = name
                    scope.group.save()

                scope.group.org_units.set(org_units)
        instance.rounds.set(round_instances)

        campaign = super().update(instance, validated_data)
        campaign.update_geojson_field()
        campaign.save()

        log_campaign_modification(campaign, old_campaign_dump, self.context["request"].user)
        return campaign

    # Vaccines with real scope
    vaccines = serializers.CharField(read_only=True)

    class Meta:
        model = Campaign
        # TODO in the future specify the fields that need to be returned so we can remove the deprecated fields
        # fields = "__all__"
        exclude = ["geojson"]

        read_only_fields = ["preperadness_sync_status", "creation_email_send_at", "group"]


class ListCampaignSerializer(CampaignSerializer):
    "This serializer contains juste enough data for the List view in the web ui"

    class NestedListRoundSerializer(RoundSerializer):
        class Meta:
            model = Round
            fields = [
                "id",
                "number",
                "started_at",
                "ended_at",
            ]

    rounds = NestedListRoundSerializer(many=True, required=False)

    class Meta:
        model = Campaign
        fields = [
            "id",
            "epid",
            "obr_name",
            "account",
            "cvdpv2_notified_at",
            "top_level_org_unit_name",
            "top_level_org_unit_id",
            "rounds",
            "general_status",
            "grouped_campaigns",
        ]
        read_only_fields = fields


class AnonymousCampaignSerializer(CampaignSerializer):
    rounds = RoundAnonymousSerializer(many=True)
    round_one = serializers.SerializerMethodField(read_only=True)
    round_two = serializers.SerializerMethodField(read_only=True)

    def get_round_one(self, campaign):
        for round in campaign.rounds.all():
            if round.number == 1:
                return RoundAnonymousSerializer(round).data
        return None

    def get_round_two(self, campaign):
        for round in campaign.rounds.all():
            if round.number == 2:
                return RoundAnonymousSerializer(round).data
        return None

    class Meta:
        model = Campaign
        fields = [
            "id",
            "epid",
            "obr_name",
            "gpei_coordinator",
            "gpei_email",
            "description",
            "initial_org_unit",
            "creation_email_send_at",
            # "group",
            "onset_at",
            "cvdpv_notified_at",
            "cvdpv2_notified_at",
            "pv_notified_at",
            "pv2_notified_at",
            "virus",
            "scopes",
            "vaccines",
            "detection_status",
            "detection_responsible",
            "detection_first_draft_submitted_at",
            "detection_rrt_oprtt_approval_at",
            "risk_assessment_status",
            "risk_assessment_responsible",
            "investigation_at",
            "risk_assessment_first_draft_submitted_at",
            "risk_assessment_rrt_oprtt_approval_at",
            "ag_nopv_group_met_at",
            "dg_authorized_at",
            "verification_score",
            "doses_requested",
            "budget_status",
            "who_disbursed_to_co_at",
            "who_disbursed_to_moh_at",
            "unicef_disbursed_to_co_at",
            "unicef_disbursed_to_moh_at",
            "eomg",
            "no_regret_fund_amount",
            "payment_mode",
            "round_one",
            "round_two",
            "rounds",
            "created_at",
            "updated_at",
            "district_count",
            "budget_rrt_oprtt_approval_at",
            "budget_submitted_at",
            "top_level_org_unit_name",
            "top_level_org_unit_id",
            "is_preventive",
            "account",
            "outbreak_declaration_date",
        ]
        read_only_fields = fields


class SmallCampaignSerializer(CampaignSerializer):
    class Meta:
        model = Campaign
        # TODO: refactor to avoid duplication with AnonymousCampaignSerializer?
        fields = [
            "id",
            "epid",
            "obr_name",
            "gpei_coordinator",
            "gpei_email",
            "description",
            "initial_org_unit",
            "creation_email_send_at",
            # "group",
            "onset_at",
            "cvdpv_notified_at",
            "cvdpv2_notified_at",
            "pv_notified_at",
            "pv2_notified_at",
            "virus",
            "vaccines",
            "detection_status",
            "detection_responsible",
            "detection_first_draft_submitted_at",
            "detection_rrt_oprtt_approval_at",
            "risk_assessment_status",
            "risk_assessment_responsible",
            "investigation_at",
            "risk_assessment_first_draft_submitted_at",
            "risk_assessment_rrt_oprtt_approval_at",
            "ag_nopv_group_met_at",
            "dg_authorized_at",
            "verification_score",
            "doses_requested",
            "budget_status",
            "who_disbursed_to_co_at",
            "who_disbursed_to_moh_at",
            "unicef_disbursed_to_co_at",
            "unicef_disbursed_to_moh_at",
            "eomg",
            "no_regret_fund_amount",
            "payment_mode",
            # "round_one",
            # "round_two",
            "created_at",
            "updated_at",
            "district_count",
            "budget_rrt_oprtt_approval_at",
            "budget_submitted_at",
            "top_level_org_unit_name",
            "top_level_org_unit_id",
            "is_preventive",
            "account",
            "outbreak_declaration_date",
        ]
        read_only_fields = fields


class CalendarCampaignSerializer(CampaignSerializer):
    """This serializer contains juste enough data for the Calendar view in the web ui. Read only.
    Used by both anonymous and non-anonymous user"""

    class NestedListRoundSerializer(RoundSerializer):
        class NestedScopeSerializer(RoundScopeSerializer):
            class NestedGroupSerializer(GroupSerializer):
                class Meta:
                    model = Group
                    fields = ["id"]

            class Meta:
                model = RoundScope
                fields = ["group", "vaccine"]

            group = NestedGroupSerializer()

        class Meta:
            model = Round
            fields = ["id", "number", "started_at", "ended_at", "scopes", "vaccine_names"]

    class NestedScopeSerializer(CampaignScopeSerializer):
        class NestedGroupSerializer(GroupSerializer):
            class Meta:
                model = Group
                fields = ["id"]

        class Meta:
            model = CampaignScope
            fields = ["group", "vaccine"]

        group = NestedGroupSerializer()

    rounds = NestedListRoundSerializer(many=True, required=False)
    scopes = NestedScopeSerializer(many=True, required=False)

    class Meta:
        model = Campaign
        fields = [
            "id",
            "epid",
            "obr_name",
            "account",
            "cvdpv2_notified_at",
            "top_level_org_unit_name",
            "top_level_org_unit_id",
            "rounds",
            "is_preventive",
            "general_status",
            "grouped_campaigns",
            "separate_scopes_per_round",
            "scopes",
            # displayed in RoundPopper
            "risk_assessment_status",
            "budget_status",
            "vaccines",
        ]
        read_only_fields = fields


class ExportCampaignSerializer(CampaignSerializer):
    class NestedRoundSerializer(RoundSerializer):
        class NestedRoundScopeSerializer(RoundScopeSerializer):
            class Meta:
                model = RoundScope
                fields = ["vaccine"]

        class NestedShipmentSerializer(ShipmentSerializer):
            class Meta:
                model = Shipment
                fields = [
                    "vaccine_name",
                    "po_numbers",
                    "vials_received",
                    "estimated_arrival_date",
                    "reception_pre_alert",
                    "date_reception",
                    "comment",
                ]

        class NestedDestructionSerializer(DestructionSerializer):
            class Meta:
                model = Destruction
                fields = [
                    "vials_destroyed",
                    "date_report_received",
                    "date_report",
                    "comment",
                ]

        class NestedRoundVaccineSerializer(RoundVaccineSerializer):
            class Meta:
                model = RoundVaccine
                fields = [
                    "name",
                    "doses_per_vial",
                    "wastage_ratio_forecast",
                ]

        class NestedRoundDateHistoryEntrySerializer(RoundVaccineSerializer):
            class Meta:
                model = RoundDateHistoryEntry
                fields = [
                    "previous_started_at",
                    "previous_ended_at",
                    "started_at",
                    "ended_at",
                    "reason",
                    "reason_for_delay",
                    "modified_by",
                    "created_at",
                    "reason_for_delay",
                ]

        class Meta:
            model = Round
            fields = [
                "scopes",
                "vaccines",
                "shipments",
                "destructions",
                "number",
                "started_at",
                "ended_at",
                "datelogs",
                "mop_up_started_at",
                "mop_up_ended_at",
                "im_started_at",
                "im_ended_at",
                "lqas_started_at",
                "lqas_ended_at",
                "target_population",
                "doses_requested",
                "cost",
                "im_percentage_children_missed_in_household",
                "im_percentage_children_missed_out_household",
                "im_percentage_children_missed_in_plus_out_household",
                "awareness_of_campaign_planning",
                "main_awareness_problem",
                "lqas_district_passing",
                "lqas_district_failing",
                "preparedness_spreadsheet_url",
                "preparedness_sync_status",
                "date_signed_vrf_received",
                "date_destruction",
                "vials_destroyed",
                "reporting_delays_hc_to_district",
                "reporting_delays_district_to_region",
                "reporting_delays_region_to_national",
                "forma_reception",
                "forma_missing_vials",
                "forma_usable_vials",
                "forma_unusable_vials",
                "forma_date",
                "forma_comment",
            ]

        scopes = NestedRoundScopeSerializer(many=True, required=False)
        vaccines = NestedRoundVaccineSerializer(many=True, required=False)
        shipments = NestedShipmentSerializer(many=True, required=False)
        destructions = NestedDestructionSerializer(many=True, required=False)
        # TODO check this is the right serializer to use
        datelogs = RoundDateHistoryEntrySerializer(many=True, required=False)

    class ExportCampaignScopeSerializer(CampaignScopeSerializer):
        class Meta:
            model = CampaignScope
            fields = ["vaccine"]

    rounds = NestedRoundSerializer(many=True, required=False)
    scopes = ExportCampaignScopeSerializer(many=True, required=False)

    class Meta:
        model = Campaign
        fields = [
            "obr_name",
            "rounds",
            "scopes",
            "gpei_coordinator",
            "gpei_email",
            "description",
            "initial_org_unit",
            "country",
            "creation_email_send_at",
            "onset_at",
            "cvdpv_notified_at",
            "cvdpv2_notified_at",
            "pv_notified_at",
            "pv2_notified_at",
            "virus",
            "vacine",
            "detection_status",
            "detection_responsible",
            "detection_first_draft_submitted_at",
            "detection_rrt_oprtt_approval_at",
            "risk_assessment_status",
            "risk_assessment_responsible",
            "investigation_at",
            "risk_assessment_first_draft_submitted_at",
            "risk_assessment_rrt_oprtt_approval_at",
            "ag_nopv_group_met_at",
            "dg_authorized_at",
            "verification_score",
            "doses_requested",
            "budget_status",
            "is_test",
            "budget_current_state_key",
            "budget_current_state_label",
            "ra_completed_at_WFEDITABLE",
            "who_sent_budget_at_WFEDITABLE",
            "unicef_sent_budget_at_WFEDITABLE",
            "gpei_consolidated_budgets_at_WFEDITABLE",
            "submitted_to_rrt_at_WFEDITABLE",
            "feedback_sent_to_gpei_at_WFEDITABLE",
            "re_submitted_to_rrt_at_WFEDITABLE",
            "submitted_to_orpg_operations1_at_WFEDITABLE",
            "feedback_sent_to_rrt1_at_WFEDITABLE",
            "re_submitted_to_orpg_operations1_at_WFEDITABLE",
            "submitted_to_orpg_wider_at_WFEDITABLE",
            "submitted_to_orpg_operations2_at_WFEDITABLE",
            "feedback_sent_to_rrt2_at_WFEDITABLE",
            "re_submitted_to_orpg_operations2_at_WFEDITABLE",
            "submitted_for_approval_at_WFEDITABLE",
            "feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE",
            "feedback_sent_to_orpg_operations_who_at_WFEDITABLE",
            "approved_by_who_at_WFEDITABLE",
            "approved_by_unicef_at_WFEDITABLE",
            "approved_at_WFEDITABLE",
            "approval_confirmed_at_WFEDITABLE",
            "who_disbursed_to_co_at",
            "who_disbursed_to_moh_at",
            "unicef_disbursed_to_co_at",
            "unicef_disbursed_to_moh_at",
            "eomg",
            "no_regret_fund_amount",
            "payment_mode",
            "created_at",
            "updated_at",
            "district_count",
            "is_preventive",
            "enable_send_weekly_email",
            "outbreak_declaration_date",
        ]
        read_only_fields = fields


def preparedness_from_url(spreadsheet_url, force_refresh=False):
    try:
        if force_refresh:
            ssi = SpreadSheetImport.create_for_url(spreadsheet_url)
        else:
            ssi = SpreadSheetImport.last_for_url(spreadsheet_url)
        if not ssi:
            return {}

        cs = ssi.cached_spreadsheet
        r = {}
        preparedness_data = get_preparedness(cs)
        r.update(preparedness_data)
        r["title"] = cs.title
        r["created_at"] = ssi.created_at
        r.update(get_preparedness_score(preparedness_data))
        r.update(preparedness_summary(preparedness_data))
        return r
    except InvalidFormatError as e:
        raise serializers.ValidationError(e.args[0])
    except APIError as e:
        raise serializers.ValidationError(e.args[0].get("message"))


class PreparednessPreviewSerializer(serializers.Serializer):
    google_sheet_url = serializers.URLField()

    def validate(self, attrs):
        spreadsheet_url = attrs.get("google_sheet_url")
        return preparedness_from_url(spreadsheet_url, force_refresh=True)

    def to_representation(self, instance):
        return instance


def get_current_preparedness(campaign, roundNumber):
    try:
        round = campaign.rounds.get(number=roundNumber)
    except Round.DoesNotExist:
        return {"details": f"No round {roundNumber} on this campaign"}

    if not round.preparedness_spreadsheet_url:
        return {}
    spreadsheet_url = round.preparedness_spreadsheet_url
    return preparedness_from_url(spreadsheet_url)


class CampaignPreparednessSpreadsheetSerializer(serializers.Serializer):
    """Serializer used to CREATE Preparedness spreadsheet from template"""

    campaign = serializers.PrimaryKeyRelatedField(queryset=Campaign.objects.all(), write_only=True)
    round_number = serializers.IntegerField(required=False)
    url = serializers.URLField(read_only=True)

    def create(self, validated_data):
        campaign = validated_data.get("campaign")
        round_number = validated_data.get("round_number")

        spreadsheet = generate_spreadsheet_for_campaign(campaign, round_number)

        return {"url": spreadsheet.url}


class CampaignViewSet(ModelViewSet, CSVExportMixin):
    """Main endpoint for campaign.

    GET (Anonymously too)
    POST
    PATCH
    See swagger for Parameters
    """

    results_key = "campaigns"
    remove_results_key_if_paginated = True
    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,
        CustomFilterBackend,
        DeletionFilterBackend,
    ]

    ordering_fields = [
        "obr_name",
        "cvdpv2_notified_at",
        "detection_status",
        "first_round_started_at",
        "last_round_started_at",
        "country__name",
    ]
    filterset_fields = {
        "country__name": ["exact"],
        "country__id": ["in"],
        "grouped_campaigns__id": ["in", "exact"],
        "obr_name": ["exact", "contains"],
        "cvdpv2_notified_at": ["gte", "lte", "range"],
        "created_at": ["gte", "lte", "range"],
        "rounds__started_at": ["gte", "lte", "range"],
    }

    # We allow anonymous read access for the embeddable calendar map view
    # in this case we use a restricted serializer with less field
    # notably not the url that we want to remain private.
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    exporter_serializer_class = ExportCampaignSerializer
    export_filename = "campaigns_list_{date}.csv"
    use_field_order = False

    def get_serializer_class(self):
        if self.request.user.is_authenticated:
            if self.request.query_params.get("fieldset") == "list" and self.request.method in permissions.SAFE_METHODS:
                return ListCampaignSerializer
            if (
                self.request.query_params.get("fieldset") == "calendar"
                and self.request.method in permissions.SAFE_METHODS
            ):
                return CalendarCampaignSerializer

            return CampaignSerializer
        else:
            if (
                self.request.query_params.get("fieldset") == "calendar"
                and self.request.method in permissions.SAFE_METHODS
            ):
                return CalendarCampaignSerializer
            return AnonymousCampaignSerializer

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        if self.action in ("update", "partial_update", "retrieve", "destroy"):
            return queryset
        campaign_type = self.request.query_params.get("campaign_type")
        campaign_groups = self.request.query_params.get("campaign_groups")
        show_test = self.request.query_params.get("show_test", "false")
        org_unit_groups = self.request.query_params.get("org_unit_groups")

        campaigns = queryset
        if show_test == "false":
            campaigns = campaigns.filter(is_test=False)
        campaigns.prefetch_related("rounds", "group", "grouped_campaigns")
        if campaign_type == "preventive":
            campaigns = campaigns.filter(is_preventive=True)
        if campaign_type == "test":
            campaigns = campaigns.filter(is_test=True)
        if campaign_type == "regular":
            campaigns = campaigns.filter(is_preventive=False).filter(is_test=False)
        if campaign_groups:
            campaigns = campaigns.filter(grouped_campaigns__in=campaign_groups.split(","))
        if org_unit_groups:
            campaigns = campaigns.filter(country__groups__in=org_unit_groups.split(","))
        org_units_id_only_qs = OrgUnit.objects.only("id", "name")
        country_prefetch = Prefetch("country", queryset=org_units_id_only_qs)
        scopes_group_org_units_prefetch = Prefetch("scopes__group__org_units", queryset=org_units_id_only_qs)
        rounds_scopes_group_org_units_prefetch = Prefetch(
            "rounds__scopes__group__org_units", queryset=org_units_id_only_qs
        )
        campaigns = (
            campaigns.prefetch_related(country_prefetch)
            .prefetch_related("grouped_campaigns")
            .prefetch_related("scopes")
            .prefetch_related("scopes__group")
            .prefetch_related(scopes_group_org_units_prefetch)
            .prefetch_related("rounds")
            .prefetch_related("rounds__datelogs")
            .prefetch_related("rounds__datelogs__modified_by")
            .prefetch_related("rounds__shipments")
            .prefetch_related("rounds__destructions")
            .prefetch_related("rounds__vaccines")
            .prefetch_related("rounds__scopes")
            .prefetch_related("rounds__scopes__group")
            .prefetch_related(rounds_scopes_group_org_units_prefetch)
        )
        return campaigns.distinct()

    def get_queryset(self):
        user = self.request.user
        campaigns = Campaign.objects.all()

        # used for Ordering
        campaigns = campaigns.annotate(last_round_started_at=Max("rounds__started_at"))
        campaigns = campaigns.annotate(first_round_started_at=Min("rounds__started_at"))

        campaigns = campaigns.filter_for_user(user)
        if not self.request.user.is_authenticated:
            # For this endpoint since it's available anonymously we allow all user to list the campaigns
            # and to additionally filter on the account_id
            # In the future we may want to make the account_id parameter mandatory.
            account_id = self.request.query_params.get("account_id", None)
            if account_id is not None:
                campaigns = campaigns.filter(account_id=account_id)

        return campaigns

    @action(methods=["POST"], detail=False, serializer_class=PreparednessPreviewSerializer)
    def preview_preparedness(self, request, **kwargs):
        serializer = PreparednessPreviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)

    @action(methods=["GET"], detail=True, serializer_class=serializers.Serializer)
    def preparedness(self, request, **kwargs):
        campaign = self.get_object()
        roundNumber = request.query_params.get("round", "")
        return Response(get_current_preparedness(campaign, roundNumber))

    @action(methods=["GET"], detail=False, serializer_class=None)
    def create_calendar_xlsx_sheet(self, request, **kwargs):
        current_date = request.query_params.get("currentDate")
        current_year = self.get_year(current_date)

        params = request.query_params
        calendar_data = self.get_calendar_data(current_year, params)
        filename = xlsx_file_name("calendar", params)
        xlsx_file = generate_xlsx_campaigns_calendar(filename, calendar_data)

        response = HttpResponse(
            save_virtual_workbook(xlsx_file),
            content_type=CONTENT_TYPE_XLSX,
        )
        response["Content-Disposition"] = "attachment; filename=%s" % filename + ".xlsx"
        return response

    @action(methods=["GET"], detail=False, serializer_class=None)
    def csv_campaign_scopes_export(self, request, **kwargs):
        """
        It generates a csv export file with round's related informations

            parameters:
                self: a self
                round: an integer representing the round id
            returns:
                it generates a csv file export
        """
        round = Round.objects.get(pk=request.GET.get("round"))
        campaign = round.campaign
        org_units_list = []
        org_units = campaign.get_districts_for_round(round)

        for org_unit in org_units:
            item = {}
            item["id"] = org_unit.id
            item["org_unit_name"] = org_unit.name
            item["org_unit_parent_name"] = org_unit.parent.name
            item["org_unit_parent_of_parent_name"] = org_unit.parent.parent.name
            item["obr_name"] = campaign.obr_name
            item["round_number"] = "R" + str(round.number)
            org_units_list.append(item)

        filename = "%s-%s--%s--%s-%s" % (
            "campaign",
            campaign.obr_name,
            "R" + str(round.number),
            "org_units",
            strftime("%Y-%m-%d-%H-%M", gmtime()),
        )
        columns = [
            {"title": "ID", "width": 10},
            {"title": "Admin 2", "width": 25},
            {"title": "Admin 1", "width": 25},
            {"title": "Admin 0", "width": 25},
            {"title": "OBR Name", "width": 25},
            {"title": "Round Number", "width": 35},
        ]

        def get_row(org_unit, **kwargs):
            campaign_scope_values = [
                org_unit.get("id"),
                org_unit.get("org_unit_name"),
                org_unit.get("org_unit_parent_name"),
                org_unit.get("org_unit_parent_of_parent_name"),
                org_unit.get("obr_name"),
                org_unit.get("round_number"),
            ]
            return campaign_scope_values

        response = StreamingHttpResponse(
            streaming_content=(iter_items(org_units_list, Echo(), columns, get_row)), content_type=CONTENT_TYPE_CSV
        )
        filename = filename + ".csv"
        response["Content-Disposition"] = "attachment; filename=%s" % filename
        return response

    @staticmethod
    def get_year(current_date):
        if current_date is not None:
            current_date = datetime.strptime(current_date, "%Y-%m-%d")
            current_date = current_date.date()
            return current_date.year
        else:
            today = datetime.today()
            return today.year

    def get_calendar_data(self: "CampaignViewSet", year: int, params: Any) -> Any:
        """
        Returns filtered rounds from database

            parameters:
                self: a self
                year (int): a year int
                params(dictionary): a params dictionary
            returns:
                rounds (array of dictionary): a rounds of array of dictionaries
        """
        countries = params.get("countries") if params.get("countries") is not None else None
        campaign_groups = params.get("campaignGroups") if params.get("campaignGroups") is not None else None
        campaign_type = params.get("campaignType") if params.get("campaignType") is not None else None
        search = params.get("search")
        org_unit_groups = params.get("orgUnitGroups") if params.get("orgUnitGroups") is not None else None

        rounds = Round.objects.filter(started_at__year=year)
        # Test campaigns should not appear in the xlsx calendar
        rounds = rounds.filter(campaign__is_test=False)
        if countries:
            rounds = rounds.filter(campaign__country_id__in=countries.split(","))
        if campaign_groups:
            rounds = rounds.filter(campaign__group_id__in=campaign_groups.split(","))
        if campaign_type == "preventive":
            rounds = rounds.filter(campaign__is_preventive=True)
        if campaign_type == "regular":
            rounds = rounds.filter(campaign__is_preventive=False).filter(campaign__is_test=False)
        if search:
            rounds = rounds.filter(Q(campaign__obr_name__icontains=search) | Q(campaign__epid__icontains=search))
        if org_unit_groups:
            rounds = rounds.filter(campaign__country__groups__in=org_unit_groups.split(","))

        return self.loop_on_rounds(self, rounds)

    @staticmethod
    def loop_on_rounds(self: "CampaignViewSet", rounds: Union[QuerySet, List[Round]]) -> list:
        """
        Returns formatted rounds

            parameters:
                self (CampaignViewSet): a self CampaignViewSet
                rounds(rounds queryset): rounds queryset
            returns:
                rounds (list): list of rounds
        """
        data_row: list = []
        for round in rounds:
            if round.campaign is not None:
                if round.campaign.country is not None:
                    campaign = round.campaign
                    country = campaign.country
                    if not any(d["country_id"] == country.id for d in data_row):
                        row = {"country_id": country.id, "country_name": country.name}
                        month = round.started_at.month
                        row["rounds"] = {}
                        row["rounds"][str(month)] = []
                        row["rounds"][str(month)].append(self.get_round(round, campaign, country))
                        data_row.append(row)
                    else:
                        row = [sub for sub in data_row if sub["country_id"] == country.id][0]
                        row_index = data_row.index(row)
                        if row is not None:
                            month = round.started_at.month
                            if str(month) in data_row[row_index]["rounds"]:
                                data_row[row_index]["rounds"][str(month)].append(
                                    self.get_round(round, campaign, country)
                                )
                            else:
                                data_row[row_index]["rounds"][str(month)] = []
                                data_row[row_index]["rounds"][str(month)].append(
                                    self.get_round(round, campaign, country)
                                )
        return data_row

    def get_round(self: "CampaignViewSet", round: Round, campaign: Campaign, country: OrgUnit) -> dict:
        started_at = datetime.strftime(round.started_at, "%Y-%m-%d") if round.started_at is not None else None
        ended_at = datetime.strftime(round.ended_at, "%Y-%m-%d") if round.ended_at is not None else None
        obr_name = campaign.obr_name if campaign.obr_name is not None else ""
        round_number = round.number if round.number is not None else ""
        # count all districts in the country
        country_districts_count = country.descendants().filter(org_unit_type__category="DISTRICT").count()
        # count disticts related to the round
        round_districts_count = len(campaign.get_districts_for_round_number(round_number)) if round_number else 0
        districts_exists = country_districts_count > 0 and round_districts_count > 0
        # check if country districts is equal to round districts
        if districts_exists:
            nid_or_snid = "NID" if country_districts_count == round_districts_count else "sNID"
        else:
            nid_or_snid = ""

        # percentage target population
        percentage_covered_target_population = (
            round.percentage_covered_target_population if round.percentage_covered_target_population is not None else ""
        )

        # target population
        target_population = round.target_population if round.target_population is not None else ""

        return {
            "started_at": started_at,
            "ended_at": ended_at,
            "obr_name": obr_name,
            "vaccines": round.vaccine_names(),
            "round_number": round_number,
            "percentage_covered_target_population": percentage_covered_target_population,
            "target_population": target_population,
            "nid_or_snid": nid_or_snid,
        }

    @action(methods=["POST"], detail=True, serializer_class=CampaignPreparednessSpreadsheetSerializer)
    def create_preparedness_sheet(self, request: Request, pk=None, **kwargs):
        data = request.data
        data["campaign"] = pk
        serializer = CampaignPreparednessSpreadsheetSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    NEW_CAMPAIGN_MESSAGE = """Dear GPEI coordinator – {country_name}

This is an automated email.

Following the newly confirmed virus {virus_type} reported from {initial_orgunit_name} with date of onset/sample collection {onset_date}. \
A new outbreak {obr_name} has been created on the timeline tracker, to visualize the campaign visit: {url_campaign}

Some campaign details are missing at this stage. It is important to update the outbreak response information on this link {url}, \
to ensure optimal coordination of activities. The information should be updated at least weekly. Details for log in will be provided.

For more follow up: contact RRT team.

Timeline tracker Automated message
    """

    @action(methods=["POST"], detail=True, serializer_class=serializers.Serializer)
    def send_notification_email(self, request, pk, **kwargs):
        campaign = get_object_or_404(Campaign, pk=pk)
        old_campaign_dump = serialize_campaign(campaign)
        country = campaign.country

        domain = settings.DNS_DOMAIN
        from_email = settings.DEFAULT_FROM_EMAIL

        if campaign.creation_email_send_at:
            raise serializers.ValidationError("Notification Email already sent")
        if not (campaign.obr_name and campaign.virus and country and campaign.onset_at):
            raise serializers.ValidationError("Missing information on the campaign")

        email_text = self.NEW_CAMPAIGN_MESSAGE.format(
            country_name=country.name,
            obr_name=campaign.obr_name,
            virus_type=campaign.virus,
            onset_date=campaign.onset_at,
            initial_orgunit_name=campaign.initial_org_unit.name
            + (", " + campaign.initial_org_unit.parent.name if campaign.initial_org_unit.parent else ""),
            url=f"https://{domain}/dashboard/polio/list",
            url_campaign=f"https://{domain}/dashboard/polio/list/campaignId/{campaign.id}",
        )

        try:
            cug = CountryUsersGroup.objects.get(country=country)
        except CountryUsersGroup.DoesNotExist:
            raise serializers.ValidationError(
                f"Country {country.name} is not configured, please go to Configuration page"
            )
        users = cug.users.all()
        emails = [user.email for user in users if user.email]
        if not emails:
            raise serializers.ValidationError(f"No recipients have been configured on the country")

        send_mail(
            "New Campaign {}".format(campaign.obr_name),
            email_text,
            from_email,
            emails,
        )
        campaign.creation_email_send_at = now()
        campaign.save()
        request_user = self.request.user
        log_campaign_modification(campaign, old_campaign_dump, request_user)

        return Response({"message": "email sent"})

    # We need to authorize PATCH request to enable restore_deleted_campaign endpoint
    # But Patching the campign directly is very much error prone, so we disable it indirectly
    def partial_update(self):
        """Don't PATCH this way, it won't do anything
        We need to authorize PATCH request to enable restore_deleted_campaign endpoint
        But Patching the campign directly is very much error prone, so we disable it indirectly
        """
        pass

    @action(methods=["PATCH"], detail=False)
    def restore_deleted_campaigns(self, request):
        campaign = get_object_or_404(Campaign, pk=request.data["id"])
        if campaign.deleted_at is not None:
            campaign.deleted_at = None
            campaign.save()
            return Response(campaign.id, status=status.HTTP_200_OK)
        else:
            return Response("Campaign already active.", status=status.HTTP_400_BAD_REQUEST)

    @action(
        methods=["GET", "HEAD"],  # type: ignore # HEAD is missing in djangorestframework-stubs
        detail=False,
        url_path="merged_shapes.geojson",
    )
    def shapes(self, request):
        """GeoJson, one geojson per campaign

        We use the django annotate feature to make a raw Postgis request that will generate the shape on the
        postgresql server which is faster.
        Campaign with and without scope per round are handled separately"""
        # FIXME: The cache ignore all the filter parameter which will return wrong result if used
        key_name = "{0}-geo_shapes".format(request.user.id)

        # use the same filter logic and rule as for anonymous or not
        campaigns = self.filter_queryset(self.get_queryset())
        # Remove deleted campaigns
        campaigns = campaigns.filter(deleted_at=None)

        # Determine last modification date to see if we invalidate the cache
        last_campaign_updated = campaigns.order_by("updated_at").last()
        last_roundscope_org_unit_updated = (
            OrgUnit.objects.order_by("updated_at").filter(groups__roundScope__round__campaign__in=campaigns).last()
        )
        last_org_unit_updated = (
            OrgUnit.objects.order_by("updated_at").filter(groups__campaignScope__campaign__in=campaigns).last()
        )

        update_dates = [
            last_org_unit_updated.updated_at if last_campaign_updated else None,
            last_roundscope_org_unit_updated.updated_at if last_roundscope_org_unit_updated else None,
            last_campaign_updated.updated_at if last_campaign_updated else None,
        ]
        cached_response = self.return_cached_response_if_valid(key_name, update_dates)
        if cached_response:
            return cached_response

        # noinspection SqlResolve
        round_scope_queryset = campaigns.filter(separate_scopes_per_round=True).annotate(
            geom=RawSQL(
                """select st_asgeojson(st_simplify(st_union(st_buffer(iaso_orgunit.simplified_geom::geometry, 0)), 0.01)::geography)
from iaso_orgunit
right join iaso_group_org_units ON iaso_group_org_units.orgunit_id = iaso_orgunit.id
right join polio_roundscope ON iaso_group_org_units.group_id =  polio_roundscope.group_id
right join polio_round ON polio_round.id = polio_roundscope.round_id
where polio_round.campaign_id = polio_campaign.id""",
                [],
            )
        )
        # For campaign scope
        # noinspection SqlResolve
        campain_scope_queryset = campaigns.filter(separate_scopes_per_round=False).annotate(
            geom=RawSQL(
                """select st_asgeojson(st_simplify(st_union(st_buffer(iaso_orgunit.simplified_geom::geometry, 0)), 0.01)::geography)
from iaso_orgunit
right join iaso_group_org_units ON iaso_group_org_units.orgunit_id = iaso_orgunit.id
right join polio_campaignscope ON iaso_group_org_units.group_id =  polio_campaignscope.group_id
where polio_campaignscope.campaign_id = polio_campaign.id""",
                [],
            )
        )

        features = []
        for queryset in (round_scope_queryset, campain_scope_queryset):
            for c in queryset:
                if c.geom:
                    s = SmallCampaignSerializer(c)
                    feature = {"type": "Feature", "geometry": json.loads(c.geom), "properties": s.data}
                    features.append(feature)
        res = {"type": "FeatureCollection", "features": features, "cache_creation_date": datetime.utcnow().timestamp()}

        cache.set(key_name, json.dumps(res), 3600 * 24, version=CACHE_VERSION)
        return JsonResponse(res)

    @staticmethod
    def return_cached_response_if_valid(cache_key, update_dates):
        cached_response = cache.get(cache_key, version=CACHE_VERSION)
        if not cached_response:
            return None
        parsed_cache_response = json.loads(cached_response)
        cache_creation_date = make_aware(datetime.utcfromtimestamp(parsed_cache_response["cache_creation_date"]))
        for update_date in update_dates:
            if update_date and update_date > cache_creation_date:
                return None
        return JsonResponse(json.loads(cached_response))

    @action(
        methods=["GET", "HEAD"],  # type: ignore # HEAD is missing in djangorestframework-stubs
        detail=False,
        url_path="v2/merged_shapes.geojson",
    )
    def shapes_v2(self, request):
        "Deprecated, should return the same format as shapes v3, kept for comparison"
        # FIXME: The cache ignore all the filter parameter which will return wrong result if used
        key_name = "{0}-geo_shapes_v2".format(request.user.id)

        campaigns = self.filter_queryset(self.get_queryset())
        # Remove deleted campaigns
        campaigns = campaigns.filter(deleted_at=None)

        last_campaign_updated = campaigns.order_by("updated_at").last()
        last_roundscope_org_unit_updated = (
            OrgUnit.objects.order_by("updated_at").filter(groups__roundScope__round__campaign__in=campaigns).last()
        )
        last_org_unit_updated = (
            OrgUnit.objects.order_by("updated_at").filter(groups__campaignScope__campaign__in=campaigns).last()
        )

        update_dates = [
            last_org_unit_updated.updated_at if last_org_unit_updated else None,
            last_roundscope_org_unit_updated.updated_at if last_roundscope_org_unit_updated else None,
            last_campaign_updated.updated_at if last_campaign_updated else None,
        ]
        cached_response = self.return_cached_response_if_valid(key_name, update_dates)
        if cached_response:
            return cached_response

        campaign_scopes = CampaignScope.objects.filter(campaign__in=campaigns.filter(separate_scopes_per_round=False))
        campaign_scopes = campaign_scopes.prefetch_related("campaign")
        campaign_scopes = campaign_scopes.prefetch_related("campaign__country")

        # noinspection SqlResolve
        campaign_scopes = campaign_scopes.annotate(
            geom=RawSQL(
                """SELECT st_asgeojson(st_simplify(st_union(st_buffer(iaso_orgunit.simplified_geom::geometry, 0)), 0.01)::geography)
from iaso_orgunit right join iaso_group_org_units ON iaso_group_org_units.orgunit_id = iaso_orgunit.id
where group_id = polio_campaignscope.group_id""",
                [],
            )
        )
        # Check if the campaigns have been updated since the response has been cached
        features = []
        scope: CampaignScope
        for scope in campaign_scopes:
            if scope.geom:
                feature = {
                    "type": "Feature",
                    "geometry": json.loads(scope.geom),
                    "properties": {
                        "obr_name": scope.campaign.obr_name,
                        "id": str(scope.campaign.id),
                        "vaccine": scope.vaccine,
                        "scope_key": f"campaignScope-{scope.id}",
                        "top_level_org_unit_name": scope.campaign.country.name,
                    },
                }
                features.append(feature)

        round_scopes = RoundScope.objects.filter(round__campaign__in=campaigns.filter(separate_scopes_per_round=True))
        round_scopes = round_scopes.prefetch_related("round__campaign")
        round_scopes = round_scopes.prefetch_related("round__campaign__country")
        # noinspection SqlResolve
        round_scopes = round_scopes.annotate(
            geom=RawSQL(
                """select st_asgeojson(st_simplify(st_union(st_buffer(iaso_orgunit.simplified_geom::geometry, 0)), 0.01)::geography)
from iaso_orgunit right join iaso_group_org_units ON iaso_group_org_units.orgunit_id = iaso_orgunit.id
where group_id = polio_roundscope.group_id""",
                [],
            )
        )

        scope: RoundScope
        for scope in round_scopes:
            if scope.geom:
                feature = {
                    "type": "Feature",
                    "geometry": json.loads(scope.geom),
                    "properties": {
                        "obr_name": scope.round.campaign.obr_name,
                        "id": str(scope.round.campaign.id),
                        "vaccine": scope.vaccine,
                        "scope_key": f"roundScope-{scope.id}",
                        "top_level_org_unit_name": scope.round.campaign.country.name,
                        "round_number": scope.round.number,
                    },
                }
                features.append(feature)

        res = {"type": "FeatureCollection", "features": features, "cache_creation_date": datetime.utcnow().timestamp()}

        cache.set(key_name, json.dumps(res), 3600 * 24, version=CACHE_VERSION)
        return JsonResponse(res)

    @action(
        methods=["GET", "HEAD"],  # type: ignore # HEAD is missing in djangorestframework-stubs
        detail=False,
        url_path="v3/merged_shapes.geojson",
    )
    def shapes_v3(self, request):
        campaigns = self.filter_queryset(self.get_queryset())
        # Remove deleted campaigns
        campaigns = campaigns.filter(deleted_at=None)
        campaigns = campaigns.only("geojson")
        features = []
        for c in campaigns:
            if c.geojson:
                features.extend(c.geojson)

        res = {"type": "FeatureCollection", "features": features}

        return JsonResponse(res)
