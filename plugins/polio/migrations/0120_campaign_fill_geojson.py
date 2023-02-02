import json

from django.db import migrations
from django.db.models.expressions import RawSQL


def update_geojson_field(campaign, RoundScope):
    "Update the geojson field on the campaign DO NOT TRIGGER the save() you have to do it manually"
    features = []
    if not campaign.separate_scopes_per_round:
        campaign_scopes = campaign.scopes

        # noinspection SqlResolve
        campaign_scopes = campaign_scopes.annotate(
            geom=RawSQL(
                """SELECT st_asgeojson(st_simplify(st_union(st_buffer(iaso_orgunit.simplified_geom::geometry, 0)), 0.01)::geography)
from iaso_orgunit right join iaso_group_org_units ON iaso_group_org_units.orgunit_id = iaso_orgunit.id
where group_id = polio_campaignscope.group_id""",
                [],
            )
        )

        for scope in campaign_scopes:
            if scope.geom:
                feature = {
                    "type": "Feature",
                    "geometry": json.loads(scope.geom),
                    "properties": {
                        "obr_name": campaign.obr_name,
                        "id": str(campaign.id),
                        "vaccine": scope.vaccine,
                        "scope_key": f"campaignScope-{scope.id}",
                        "top_level_org_unit_name": scope.campaign.country.name,
                    },
                }
                features.append(feature)
    else:
        round_scopes = RoundScope.objects.filter(round__campaign=campaign)
        round_scopes = round_scopes.prefetch_related("round")
        # noinspection SqlResolve
        round_scopes = round_scopes.annotate(
            geom=RawSQL(
                """select st_asgeojson(st_simplify(st_union(st_buffer(iaso_orgunit.simplified_geom::geometry, 0)), 0.01)::geography)
from iaso_orgunit right join iaso_group_org_units ON iaso_group_org_units.orgunit_id = iaso_orgunit.id
where group_id = polio_roundscope.group_id""",
                [],
            )
        )

        for scope in round_scopes:
            if scope.geom:
                feature = {
                    "type": "Feature",
                    "geometry": json.loads(scope.geom),
                    "properties": {
                        "obr_name": campaign.obr_name,
                        "id": str(campaign.id),
                        "vaccine": scope.vaccine,
                        "scope_key": f"roundScope-{scope.id}",
                        "top_level_org_unit_name": campaign.country.name,
                        "round_number": scope.round.number,
                    },
                }
                features.append(feature)

    campaign.geojson = features


class Migration(migrations.Migration):
    def update_json_field(apps, schema_editor):
        Campaign = apps.get_model("polio", "Campaign")
        RoundScope = apps.get_model("polio", "RoundScope")

        for c in Campaign.objects.all():
            update_geojson_field(c, RoundScope)
            c.save()

    dependencies = [
        ("polio", "0119_alter_campaign_geojson"),
    ]

    operations = [migrations.RunPython(update_json_field, migrations.RunPython.noop)]
