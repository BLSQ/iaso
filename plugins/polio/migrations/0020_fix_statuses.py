from django.db import migrations


OLD_STATUS_TO_NEW = {"PENDING": "TO_SUBMIT", "ONGOING": "SUBMITTED", "FINISHED": "APPROVED", None: None}
VALID_STATUSES = ["APPROVED", "TO_SUBMIT", "SUBMITTED", "REVIEWED", None]


def convert(old):
    return OLD_STATUS_TO_NEW.get(old, old)


def fix_campaign_status(apps, schema_editor):
    Campaign = apps.get_model("polio", "Campaign")
    for c in Campaign.objects.all():
        c.risk_assessment_status = convert(c.risk_assessment_status)
        c.budget_status = convert(c.budget_status)
        c.save()
    for c in Campaign.objects.all():
        if c.budget_status not in VALID_STATUSES:
            raise Exception(f"Still invalid budget_status {c} {c.budget_status}")
        if c.risk_assessment_status not in VALID_STATUSES:
            raise Exception(f"Still invalid risk_assessment_status {c} {c.risk_assessment_status}")


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0019_auto_20210715_1751"),
    ]

    operations = [
        migrations.RunPython(fix_campaign_status),
    ]
