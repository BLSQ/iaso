from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0233_outgoingstockmovement_non_obr_name_and_more"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="outgoingstockmovement",
            name="campaign_or_pseudo_campaign_not_null",
        ),
        migrations.AddConstraint(
            model_name="outgoingstockmovement",
            constraint=models.CheckConstraint(
                check=models.Q(("campaign__isnull", False)) | ~models.Q(("non_obr_name", "")),
                name="campaign_or_pseudo_campaign_not_null",
            ),
        ),
    ]
