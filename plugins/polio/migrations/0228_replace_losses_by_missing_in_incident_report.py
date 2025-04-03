# Generated by Django 4.2.20 on 2025-04-03 12:58

from django.db import migrations


LOSSES = "losses"
MISSING = "missing"
def replace_losses_by_missing(apps, schema_editor):
    incident_report_model = apps.get_model("polio", "IncidentReport")
    incident_reports_with_losses = incident_report_model.objects.filter(stock_correction=LOSSES)
    for incident_report in incident_reports_with_losses:
        incident_report.stock_correction = MISSING
        incident_report.save()


def reverse_replace_losses_by_missing(apps, schema_editor):
    incident_report_model = apps.get_model("polio", "IncidentReport")
    incident_reports_with_missing = incident_report_model.objects.filter(stock_correction=MISSING)
    for incident_report in incident_reports_with_missing:
        incident_report.stock_correction = LOSSES
        incident_report.save()

class Migration(migrations.Migration):

    dependencies = [
        ("polio", "0227_alter_incidentreport_stock_correction"),
    ]

    operations = [
        migrations.RunPython(replace_losses_by_missing, reverse_replace_losses_by_missing),
    ]
