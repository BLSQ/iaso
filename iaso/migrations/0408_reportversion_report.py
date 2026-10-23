import django.db.models.deletion

from django.db import migrations, models


def link_published_versions(apps, schema_editor):
    """Until now a version was only reachable from the report that publishes it: link it to that report."""
    Report = apps.get_model("iaso", "Report")
    ReportVersion = apps.get_model("iaso", "ReportVersion")
    for report in Report.objects.filter(published_version__report__isnull=True).order_by("id"):
        ReportVersion.objects.filter(pk=report.published_version_id, report__isnull=True).update(report=report)


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0407_planningconfig_planningconfig_level_gte_1_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="reportversion",
            name="report",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="versions",
                to="iaso.report",
            ),
        ),
        migrations.AlterField(
            model_name="report",
            name="published_version",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="published_in_reports",
                to="iaso.reportversion",
            ),
        ),
        migrations.RunPython(link_published_versions, migrations.RunPython.noop),
    ]
