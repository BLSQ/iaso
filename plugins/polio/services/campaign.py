from iaso.models.org_unit import OrgUnit
from plugins.polio.models import Campaign, Round, SubActivityScope


def delete_old_scopes_after_scope_level_switch(switch_to_campaign: bool, switch_to_round: bool, campaign: Campaign):
    """
    Deletes campaign-level scopes when switching to round-level, or deletes round-level scopes when switching to campaign-level.
    All subactivity scopes are also deleted when any switch is done.
    """
    if switch_to_campaign:
        for round in campaign.rounds.all():
            if round.scopes.exists():
                round.scopes.all().delete()
            _delete_sub_activity_scopes_from_round(round)
    elif switch_to_round:
        if campaign.scopes.exists():
            campaign.scopes.all().delete()
        for round in campaign.rounds.all():
            _delete_sub_activity_scopes_from_round(round)


def _delete_sub_activity_scopes_from_round(round: Round):
    for sub_activity in round.sub_activities.all():
        if sub_activity.scopes.exists():
            sub_activity.scopes.all().delete()


def remove_out_of_scope_org_units_from_sub_activities(campaign: Campaign):
    if campaign.separate_scopes_per_round:
        rnds = campaign.rounds.all()
        for rnd in rnds:
            org_units_in_scope = OrgUnit.objects.filter(group__roundScope__round=rnd).values_list("id", flat=True)
            scopes = SubActivityScope.objects.filter(subactivity__round=rnd)
            _align_scopes(scopes, org_units_in_scope)
    else:
        org_units_in_scope = campaign.get_campaign_scope_districts_qs().values_list("id", flat=True)
        scopes = SubActivityScope.objects.filter(subactivity__round__campaign=campaign)
        _align_scopes(scopes, org_units_in_scope)


def _align_scopes(scopes, org_units_in_scope):
    for scope in scopes:
        org_units = scope.group.org_units.all()
        eligible_org_units = org_units.filter(id__in=org_units_in_scope)
        scope.group.org_units.set(eligible_org_units)
