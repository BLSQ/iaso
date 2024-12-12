# Generated by Django 4.2.16 on 2024-11-14 17:06

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0200_merge_20241025_0816"),
    ]

    operations = [
        migrations.CreateModel(
            name="VaccineStockHistory",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("unusable_vials_in", models.IntegerField(null=True)),
                ("unusable_vials_out", models.IntegerField(null=True)),
                ("unusable_doses_in", models.IntegerField(null=True)),
                ("unusable_doses_out", models.IntegerField(null=True)),
                ("usable_vials_in", models.IntegerField(null=True)),
                ("usable_vials_out", models.IntegerField(null=True)),
                ("usable_doses_in", models.IntegerField(null=True)),
                ("usable_doses_out", models.IntegerField(null=True)),
                (
                    "round",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="stock_on_closing", to="polio.round"
                    ),
                ),
                (
                    "vaccine_stock",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="history", to="polio.vaccinestock"
                    ),
                ),
            ],
            options={
                "unique_together": {("round", "vaccine_stock")},
            },
        ),
    ]