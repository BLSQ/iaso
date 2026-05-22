from django.db.transaction import atomic
from django.utils import timezone
from django.utils.translation import gettext as _
from rest_framework import serializers
from rest_framework.fields import Field
from rest_framework.validators import UniqueValidator

from iaso.api.common import (
    Custom403Exception,
)
from iaso.models import Group, OrgUnit
from plugins.polio.api.campaigns.campaigns_log import (
    log_campaign_modification,
    serialize_campaign,
)
from plugins.polio.api.campaigns.serializers.shared import CampaignScopeSerializer
from plugins.polio.api.campaigns.utils import CurrentAccountDefault
from plugins.polio.api.campaigns.vaccine_authorizations.utils import (
    check_total_doses_requested,
    send_missing_vaccine_authorization_for_campaign_email,
)
from plugins.polio.api.rounds.serializers import RoundSerializer
from plugins.polio.api.shared_serializers import OrgUnitSerializer
from plugins.polio.models import (
    Campaign,
    CampaignGroup,
    CampaignType,
    Round,
    VaccineAuthorization,
)
from plugins.polio.preparedness.spreadsheet_manager import (
    Campaign,
)
from plugins.polio.services.campaign import (
    delete_old_scopes_after_scope_level_switch,
    remove_out_of_scope_org_units_from_sub_activities,
)


class CampaignSerializer(serializers.ModelSerializer):
    rounds = RoundSerializer(many=True, required=False)
    org_unit: Field = OrgUnitSerializer(source="initial_org_unit", read_only=True)
    top_level_org_unit_name: Field = serializers.SlugRelatedField(source="country", slug_field="name", read_only=True)
    top_level_org_unit_id: Field = serializers.SlugRelatedField(source="country", slug_field="id", read_only=True)
    general_status = serializers.SerializerMethodField()
    grouped_campaigns = serializers.PrimaryKeyRelatedField(
        many=True, queryset=CampaignGroup.objects.all(), required=False
    )
    # Account is filled per default the one of the connected user that update it
    account: Field = serializers.PrimaryKeyRelatedField(default=CurrentAccountDefault(), read_only=True)
    has_data_in_budget_tool = serializers.SerializerMethodField(read_only=True)
    campaign_types = serializers.PrimaryKeyRelatedField(many=True, queryset=CampaignType.objects.all(), required=False)
    # Vaccines with real scope
    vaccines = serializers.SerializerMethodField(read_only=True)
    single_vaccines = serializers.SerializerMethodField(read_only=True)
    # Integrated campaigns
    integrated_to = serializers.PrimaryKeyRelatedField(
        required=False, allow_null=True, read_only=False, queryset=Campaign.objects.all()
    )
    integrated_campaigns = serializers.PrimaryKeyRelatedField(
        many=True, allow_empty=True, required=False, read_only=False, queryset=Campaign.objects.all()
    )

    scopes = CampaignScopeSerializer(many=True, required=False)
    obr_name = serializers.CharField(validators=[UniqueValidator(queryset=Campaign.objects.all())])

    def get_vaccines(self, obj):
        if obj.vaccines_extended_list:
            return ",".join(obj.vaccines_extended_list)
        return ""

    def get_single_vaccines(self, obj):
        return obj.single_vaccines_extended

    def get_general_status(self, campaign):
        now_utc = timezone.now().date()
        ordered_rounds = list(campaign.rounds.all())
        ordered_rounds.sort(key=lambda x: x.number, reverse=True)
        for round in ordered_rounds:
            if round.ended_at and now_utc > round.ended_at:
                return _("Round {} ended").format(round.number)
            if round.started_at and now_utc >= round.started_at:
                return _("Round {} started").format(round.number)
        return _("Preparing")

    def get_has_data_in_budget_tool(self, campaign):
        return campaign.budget_steps.count() > 0

    def validate(self, attrs):
        data = super().validate(attrs)
        polio_type = CampaignType.objects.get(name=CampaignType.POLIO)
        campaign_types = data["campaign_types"] = data.get("campaign_types", [polio_type])
        integrated_to = data.get("integrated_to", None)
        is_polio = polio_type in campaign_types

        if is_polio and (integrated_to is not None):
            raise serializers.ValidationError("Polio campaign cannot be integrated to other campaign ")

        if (not is_polio) and data.get("integrated_campaigns", None):
            raise serializers.ValidationError("Non Polio campaign cannot have integrated campaigns")

        return data

    def validate_integrated_to(self, integrated_to):
        if not integrated_to:
            return integrated_to
        polio_type = CampaignType.objects.get(name=CampaignType.POLIO)
        if polio_type not in integrated_to.campaign_types.all():
            raise serializers.ValidationError(
                f"Campaign {integrated_to} is not a polio campaign: it cannot have other campaigns integrated to it"
            )
        return integrated_to

    def validate_integrated_campaigns(self, value):
        """Convert None to empty list for many=True field"""
        if value is None:
            return []
        polio_type = CampaignType.objects.get(name=CampaignType.POLIO)
        integrated_campaigns_with_wrong_type = [c.obr_name for c in value if polio_type in c.campaign_types.all()]
        if integrated_campaigns_with_wrong_type:
            raise serializers.ValidationError(
                f"Found polio campaign(s) in integrated campaigns: {integrated_campaigns_with_wrong_type}"
            )
        return value

    @atomic
    def create(self, validated_data):
        grouped_campaigns = validated_data.pop("grouped_campaigns", [])
        rounds = validated_data.pop("rounds", [])
        campaign_types = validated_data.pop("campaign_types", [])
        initial_org_unit = validated_data.get("initial_org_unit")
        obr_name = validated_data["obr_name"]
        integrated_to = validated_data.pop("integrated_to", None)
        integrated_campaigns = validated_data.pop("integrated_campaigns", [])
        account = self.context["request"].user.iaso_profile.account

        campaign_scopes = validated_data.pop("scopes", [])
        campaign = Campaign.objects.create(
            # there seems a bug in DRF the account is not in validated data, when not using HiddenField
            account_id=self.context["request"].user.iaso_profile.account_id,
            **validated_data,
        )

        campaign.grouped_campaigns.set(grouped_campaigns)

        # noinspection DuplicatedCode
        for scope in campaign_scopes:
            vaccine = scope.get("vaccine", "")
            org_units = scope.get("group", {}).get("org_units")
            scope, _ = campaign.scopes.get_or_create(vaccine=vaccine)
            source_version_id = None
            name = f"scope {scope.id} for campaign {campaign.obr_name}" + (f" - {vaccine}" if vaccine else "")
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

        if campaign_types != campaign.campaign_types:
            campaign.campaign_types.set(campaign_types)

        campaign.integrated_to = integrated_to

        for round_data in rounds:
            scopes = round_data.pop("scopes", [])
            round_serializer = RoundSerializer(data={**round_data, "campaign": campaign.id}, context=self.context)
            round_serializer.is_valid(raise_exception=True)
            round = round_serializer.save()

            for scope in scopes:
                vaccine = scope.get("vaccine", "")
                org_units = scope.get("group", {}).get("org_units")
                source_version_id = None
                if org_units:
                    source_version_ids = set([ou.version_id for ou in org_units])
                    if len(source_version_ids) != 1:
                        raise serializers.ValidationError("All orgunit should be in the same source version")
                    source_version_id = list(source_version_ids)[0]
                scope, _ = round.scopes.get_or_create(vaccine=vaccine)
                name = f"scope {scope.id} for round {round.number} campaign {campaign.obr_name}" + (
                    f" - {vaccine}" if vaccine else ""
                )
                if not scope.group:
                    scope.group = Group.objects.create(name=name)
                else:
                    scope.group.source_version_id = source_version_id
                    scope.group.name = name
                    scope.group.save()

                scope.group.org_units.set(org_units)
        campaign.integrated_campaigns.set(integrated_campaigns)
        campaign.update_geojson_field()
        campaign.save()
        log_campaign_modification(campaign, None, self.context["request"].user)

        # check if the quantity of the vaccines requested is not superior to the authorized vaccine quantity
        c_rounds = [r for r in campaign.rounds.all()]
        nOPV2_rounds = []
        for r in c_rounds:
            if "nOPV2" in r.vaccine_names:
                nOPV2_rounds.append(r)

        if initial_org_unit and len(nOPV2_rounds) > 0:
            try:
                initial_org_unit = OrgUnit.objects.get(pk=initial_org_unit.pk)
                vaccine_authorization = VaccineAuthorization.objects.filter(
                    country=initial_org_unit, status="VALIDATED", account=account, deleted_at__isnull=True
                )
                if vaccine_authorization:
                    check_total_doses_requested(vaccine_authorization[0], nOPV2_rounds, campaign)
                else:
                    send_missing_vaccine_authorization_for_campaign_email(
                        obr_name, validated_data["initial_org_unit"], account
                    )
            except OrgUnit.DoesNotExist:
                raise Custom403Exception("error:Org unit does not exists.")

        return campaign

    @atomic
    def update(self, instance: Campaign, validated_data):
        old_campaign_dump = serialize_campaign(instance)
        campaign_scopes = validated_data.pop("scopes", [])
        rounds = validated_data.pop("rounds", [])
        initial_org_unit = validated_data.get("initial_org_unit")
        integrated_to = validated_data.pop("integrated_to", None)
        integrated_campaigns = validated_data.pop("integrated_campaigns", [])

        account = self.context["request"].user.iaso_profile.account
        separate_scopes_per_round = validated_data.get("separate_scopes_per_round", instance.separate_scopes_per_round)
        switch_to_scope_per_round = separate_scopes_per_round and not instance.separate_scopes_per_round
        switch_to_scope_per_campaign = not separate_scopes_per_round and instance.separate_scopes_per_round
        keep_scope_per_round = separate_scopes_per_round and instance.separate_scopes_per_round
        keep_scope_per_campaign = not separate_scopes_per_round and not instance.separate_scopes_per_round

        delete_old_scopes_after_scope_level_switch(
            switch_to_campaign=switch_to_scope_per_campaign,
            switch_to_round=switch_to_scope_per_round,
            campaign=instance,
        )

        if switch_to_scope_per_campaign or keep_scope_per_campaign:
            for scope in campaign_scopes:
                vaccine = scope.get("vaccine", "")
                org_units = scope.get("group", {}).get("org_units")
                scope, _ = instance.scopes.get_or_create(vaccine=vaccine)
                source_version_id = None
                name = f"scope for campaign {instance.obr_name} - {vaccine or ''}"
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

            # At this point `round_data` has already been validated and deserialized to complex Django types.
            # But it will still be passed to `RoundSerializer.data` as if it were native Python datatypes.
            # So, we convert it back to a native datatype to prevent `RoundSerializer` to raise an error:
            # "Incorrect type. Expected pk value, received BudgetProcess."…
            budget_process = round_data.pop("budget_process", None)
            round_data["budget_process"] = budget_process.pk if budget_process else None

            round_serializer = RoundSerializer(instance=round, data=round_data, context=self.context)
            round_serializer.is_valid(raise_exception=True)
            round_instance = round_serializer.save()
            round_instances.append(round_instance)

            if switch_to_scope_per_round or keep_scope_per_round:
                for scope in scopes:
                    vaccine = scope.get("vaccine", "")
                    org_units = scope.get("group", {}).get("org_units")
                    source_version_id = None
                    if org_units:
                        source_version_ids = set([ou.version_id for ou in org_units])
                        if len(source_version_ids) != 1:
                            raise serializers.ValidationError("All orgunit should be in the same source version")
                        source_version_id = list(source_version_ids)[0]
                    name = f"scope for round {round_instance.number} campaign {instance.obr_name}" + (
                        f" - {vaccine}" if vaccine else ""
                    )
                    scope, created = round_instance.scopes.get_or_create(vaccine=vaccine)
                    if not scope.group:
                        scope.group = Group.objects.create(name=name)
                    else:
                        scope.group.source_version_id = source_version_id
                        scope.group.name = name
                        scope.group.save()

                    scope.group.org_units.set(org_units)

        submitted_round_ids = set([r.id for r in round_instances])
        current_round_ids = set(instance.rounds.values_list("id", flat=True))

        # When some rounds need to be deleted, the payload contains only the rounds to keep.
        # So we have to detect if somebody wants to delete a round to prevent deletion of
        # rounds linked to budget processes.
        has_rounds_to_delete = round_instances and len(current_round_ids) > len(submitted_round_ids)
        if has_rounds_to_delete:
            rounds_to_delete = instance.rounds.exclude(id__in=submitted_round_ids)
            if rounds_to_delete.filter(budget_process__isnull=False).exists():
                raise serializers.ValidationError("Cannot delete a round linked to a budget process.")
            rounds_to_delete.delete()

        instance.integrated_to = integrated_to
        instance.rounds.set(round_instances)

        # We have to detect new rounds manually because of the way rounds are associated to the campaign.
        new_rounds_ids = submitted_round_ids - current_round_ids
        if new_rounds_ids:
            for round in instance.rounds.filter(id__in=new_rounds_ids):
                round.add_chronogram()

        campaign = super().update(instance, validated_data)
        campaign.integrated_campaigns.set(integrated_campaigns)
        campaign.update_geojson_field()
        campaign.save()

        # Check if there are no subactivities with org units not in their current parent round scope
        remove_out_of_scope_org_units_from_sub_activities(campaign)

        # check if the quantity of the vaccines requested is not superior to the authorized vaccine quantity
        c_rounds = [r for r in campaign.rounds.all()]
        nOPV2_rounds = []
        for r in c_rounds:
            if "nOPV2" in r.vaccine_names:
                nOPV2_rounds.append(r)
        if initial_org_unit and len(nOPV2_rounds) > 0:
            try:
                initial_org_unit = OrgUnit.objects.get(pk=initial_org_unit.pk)
                vaccine_authorization = VaccineAuthorization.objects.filter(
                    country=initial_org_unit, status="VALIDATED", account=account, deleted_at__isnull=True
                )
                if vaccine_authorization:
                    check_total_doses_requested(vaccine_authorization[0], nOPV2_rounds, campaign)
            except OrgUnit.DoesNotExist:
                raise Custom403Exception("error:Org unit does not exists.")

        log_campaign_modification(campaign, old_campaign_dump, self.context["request"].user)
        return campaign

    class Meta:
        model = Campaign
        # TODO in the future specify the fields that need to be returned so we can remove the deprecated fields
        # fields = "__all__"
        exclude = ["geojson"]

        read_only_fields = ["creation_email_send_at", "group"]
