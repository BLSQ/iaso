from django.db import migrations


def forwards_func(apps, schema_edito):
    # fill the country field
    from plugins.polio.models import Campaign

    for campaign in Campaign.objects.all():
        campaign.save()


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0029_campaign_country"),
    ]

    operations = [
        # migrations.RunPython(forwards_func, reverse_code=migrations.RunPython.noop),
    ]
