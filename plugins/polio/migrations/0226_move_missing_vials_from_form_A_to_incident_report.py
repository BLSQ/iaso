# Generated by Django 4.2.20 on 2025-04-09 12:30

from django.db import migrations
from plugins.polio.models.base import IncidentReport as IR


def move_missing_vials_from_form_A_to_incident_report(apps, schema_editor):
    out_going_stock_movement = apps.get_model("polio", "OutgoingStockMovement")
    incident_report = apps.get_model("polio", "IncidentReport")
    all_stock_with_missing_vials = out_going_stock_movement.objects.filter(missing_vials__gt=0)
    for stock in all_stock_with_missing_vials:
        vaccine_stock = stock.vaccine_stock
        missing_vials = stock.missing_vials
        incident_report.objects.create(
            title=f"{stock.id}_missing_vials",
            stock_correction=IR.StockCorrectionChoices.LOSSES,
            vaccine_stock=vaccine_stock,
            usable_vials=missing_vials,
            date_of_incident_report=stock.report_date,
            incident_report_received_by_rrt=stock.form_a_reception_date,
            unusable_vials=0,
        )


def reverse_move_missing_vials_from_form_A_to_incident_report(apps, schema_editor):
    incident_report = apps.get_model("polio", "IncidentReport")
    out_going_stock_movement = apps.get_model("polio", "OutgoingStockMovement")
    losses_incident = incident_report.objects.filter(stock_correction=IR.StockCorrectionChoices.LOSSES)
    for losses in losses_incident:
        if not losses.title:
            continue
        stock_movement_id = losses.title.split("_")[0]

        if not stock_movement_id.isdigit():
            continue

        stock_movement = out_going_stock_movement.objects.filter(
            id=stock_movement_id, vaccine_stock=losses.vaccine_stock
        ).first()
        if not stock_movement:
            continue
        stock_movement.missing_vials = losses.usable_vials
        stock_movement.save()
        losses.delete()


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0225_campaign_on_hold"),
    ]

    operations = [
        migrations.RunPython(
            move_missing_vials_from_form_A_to_incident_report, reverse_move_missing_vials_from_form_A_to_incident_report
        ),
    ]
