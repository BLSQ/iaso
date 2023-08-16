from django.db import migrations, models


def set_requires_authentication_to_feature_flags(apps, schema_editor):
    model = apps.get_model("iaso", "FeatureFlag")
    set_requires_authentication(model, "PLANNING")


def set_requires_authentication(model, code):
    feature_flag = model.objects.get(code=code)
    feature_flag.requires_authentication = True
    feature_flag.save()


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0226_merge_20230724_1245"),
    ]

    operations = [
        migrations.AddField(
            model_name="featureflag",
            name="requires_authentication",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(set_requires_authentication_to_feature_flags),
    ]
