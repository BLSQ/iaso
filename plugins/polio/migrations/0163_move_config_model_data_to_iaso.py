from django.db import migrations, models


def move_polio_configs_to_iaso(apps, schema_editor):
    PolioConfig = apps.get_model("polio", "Config")
    IasoConfig = apps.get_model("iaso", "Config")
    polio_configs = PolioConfig.objects.all()
    for polio_config in polio_configs:
        try:
            new_config = IasoConfig.objects.create(slug=polio_config.slug, content=polio_config.content)
            new_config.users.set(polio_config.users.all())
        except:
            prefixed_slug = f"polio_{polio_config.slug}"
            new_config = IasoConfig.objects.create(slug=prefixed_slug, content=polio_config.content)
            new_config.users.set(polio_config.users.all())


def move_iaso_configs_back_to_polio(apps, schema_editor):
    PolioConfig = apps.get_model("polio", "Config")
    IasoConfig = apps.get_model("iaso", "Config")
    iaso_configs = IasoConfig.objects.all()
    for iaso_config in iaso_configs:
        try:
            restored_config = PolioConfig.objects.create(slug=iaso_config.slug, content=iaso_config.content)
            restored_config.users.set(iaso_config.users.all())
        except:
            prefixed_slug = f"iaso_{iaso_config.slug}"
            restored_config = PolioConfig.objects.create(
                slug=prefixed_slug, users=iaso_config.users, content=iaso_config.content
            )
            restored_config.users.set(iaso_config.users.all())


class Migration(migrations.Migration):
    dependencies = [("iaso", "0261_config"), ("polio", "0162_merge_20231215_1118")]

    operations = [migrations.RunPython(move_polio_configs_to_iaso, move_iaso_configs_back_to_polio)]
