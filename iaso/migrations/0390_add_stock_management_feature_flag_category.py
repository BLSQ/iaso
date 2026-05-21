from django.db import migrations, models


def set_mobile_stock_category(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    flag = FeatureFlag.objects.get(code="MOBILE_STOCK")
    flag.category = "STM"
    flag.order = 1
    flag.save()


def unset_mobile_stock_category(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    flag = FeatureFlag.objects.get(code="MOBILE_STOCK")
    flag.category = "NA"
    flag.order = 0
    flag.save()


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0385_alter_corepermissionsupport_options"),
    ]

    operations = [
        migrations.AlterField(
            model_name="featureflag",
            name="category",
            field=models.TextField(
                choices=[
                    ("DCO", "Data collection options"),
                    ("REO", "Refresh options"),
                    ("GEO", "Geographic options"),
                    ("DAV", "Data Validation"),
                    ("ENT", "Entities"),
                    ("PLA", "Planning"),
                    ("STM", "Stock management"),
                    ("SPO", "Specific options"),
                    ("NA", "Not specified"),
                ],
                default="NA",
            ),
        ),
        migrations.RunPython(set_mobile_stock_category, unset_mobile_stock_category),
    ]
