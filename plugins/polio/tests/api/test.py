import datetime
from iaso import models as m
from plugins.polio import models as pm


class PolioTestCaseMixin:
    @staticmethod
    def create_campaign(
        obr_name,
        account,
        source_version,
        country_ou_type,
        district_ou_type,
        country_name="Groland",
        district_name="Groville",
    ):
        country = m.OrgUnit.objects.create(
            org_unit_type=country_ou_type,
            version=source_version,
            name=country_name,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )
        district = m.OrgUnit.objects.create(
            org_unit_type=district_ou_type,
            version=source_version,
            name=district_name,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )
        campaign = pm.Campaign.objects.create(
            obr_name=obr_name,
            country=country,
            account=account,
            vacine=pm.VACCINES[0][0],
            separate_scopes_per_round=False,
        )
        scope_group = m.Group.objects.create(name="campaign_scope", source_version=source_version)
        scope_group.org_units.set([district])  # FIXME: we should actually have children org units
        scope = pm.CampaignScope.objects.create(campaign=campaign, vaccine=pm.VACCINES[0][0], group=scope_group)

        round_1 = pm.Round.objects.create(
            campaign=campaign,
            started_at=datetime.datetime(2021, 1, 1),
            ended_at=datetime.datetime(2021, 1, 10),
            number=1,
        )

        round_2 = pm.Round.objects.create(
            campaign=campaign,
            started_at=datetime.datetime(2021, 2, 1),
            ended_at=datetime.datetime(2021, 2, 10),
            number=2,
        )

        round_3 = pm.Round.objects.create(
            campaign=campaign,
            started_at=datetime.datetime(2021, 3, 1),
            ended_at=datetime.datetime(2021, 3, 10),
            number=3,
        )

        return [campaign, round_1, round_2, round_3, country, district]
