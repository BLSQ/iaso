# Generated by Django 2.0 on 2018-08-22 10:21

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("menupermissions", "0002_auto_20180822_1020")]

    operations = [
        migrations.AlterModelOptions(
            name="custompermissionsupport",
            options={
                "managed": False,
                "permissions": (
                    ("x_datasets_datauploads", "Upload of cases files"),
                    ("x_datasets_villageuploads", "Upload of villages files"),
                    ("x_plannings_macroplanning", "Macroplanning"),
                    ("x_plannings_microplanning", "Microplanning"),
                    ("x_plannings_routes", "Routes"),
                    ("x_stats_graphs", "Graphs"),
                    ("x_stats_reports", "Reports"),
                    ("x_case_cases", "Cases"),
                    ("x_case_analysis", "Cases analysis"),
                    ("x_case_reconciliation", "Reconciliation"),
                    ("x_management_devices", "Devices"),
                    ("x_management_plannings", "Plannings"),
                    ("x_management_coordinations", "Coordinations"),
                    ("x_management_workzones", "Work zones"),
                    ("x_management_teams", "Teams"),
                    ("x_management_users", "Users"),
                    ("x_locator", "Locator"),
                    ("x_vectorcontrol", "Vector control"),
                    ("x_qualitycontrol", "Quality control"),
                ),
            },
        )
    ]