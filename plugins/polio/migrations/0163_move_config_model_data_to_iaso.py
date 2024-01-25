from django.db import migrations, models


def move_polio_configs_to_iaso(apps, schema_editor):
    PolioConfig = apps.get_model("polio", "Config")
    IasoConfig = apps.get_model("iaso", "Config")
    polio_configs = PolioConfig.objects.all()
    for polio_config in polio_configs:
        try:
            IasoConfig.objects.create(slug=polio_config.slug, users=polio_config.users, content=polio_config.content)
        except IasoConfig.ValidationError:
            prefixed_slug = f"polio_{polio_config.slug}"
            IasoConfig.objects.create(slug=prefixed_slug, users=polio_config.users, content=polio_config.content)


def move_polio_configs_back_to_polio(apps, schema_editor):
    PolioConfig = apps.get_model("polio", "Config")
    IasoConfig = apps.get_model("iaso", "Config")
    iaso_configs = IasoConfig.objects.all()
    for iaso_config in iaso_configs:
        try:
            PolioConfig.objects.create(slug=iaso_config.slug, users=iaso_config.users, content=iaso_config.content)
        except PolioConfig.ValidationError:
            prefixed_slug = f"iaso_{iaso_config.slug}"
            PolioConfig.objects.create(slug=prefixed_slug, users=iaso_config.users, content=iaso_config.content)


class Migration(migrations.Migration):
    dependencies = [("iaso", "0261_config"), ("polio", "0162_merge_20231215_1118")]

    operations = [migrations.RunPython(move_polio_configs_to_iaso, move_polio_configs_back_to_polio)]
