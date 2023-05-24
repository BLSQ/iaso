from django.db import migrations


def move_campaign_to_scope(apps, schema_editor):
    Campaign = apps.get_model("polio", "Campaign")
    campaigns = Campaign.objects.all()
    for c in campaigns:
        if c.group and not c.scopes.count() > 0:
            c.scopes.create(vaccine=c.vacine or "", group=c.group)
            c.group = None
            c.save()


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0070_merge_20220729_0849"),
    ]

    operations = [
        migrations.RunPython(move_campaign_to_scope, migrations.RunPython.noop),
    ]
