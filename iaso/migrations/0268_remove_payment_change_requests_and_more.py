# Generated by Django 4.2.11 on 2024-03-11 16:17

import django.db.models.deletion

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("iaso", "0267_merge_20240311_1616"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="payment",
            name="change_requests",
        ),
        migrations.RemoveField(
            model_name="potentialpayment",
            name="change_requests",
        ),
        migrations.AddField(
            model_name="orgunitchangerequest",
            name="payment",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="change_requests",
                to="iaso.payment",
            ),
        ),
        migrations.AddField(
            model_name="orgunitchangerequest",
            name="potential_payment",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="change_requests",
                to="iaso.potentialpayment",
            ),
        ),
        migrations.AlterField(
            model_name="payment",
            name="status",
            field=models.CharField(
                choices=[("pending", "Pending"), ("sent", "Sent"), ("rejected", "Rejected"), ("paid", "Paid")],
                default="pending",
                max_length=40,
            ),
        ),
        migrations.CreateModel(
            name="PaymentLot",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("comment", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("new", "New"),
                            ("sent", "Sent"),
                            ("paid", "Paid"),
                            ("partially_paid", "Partially Paid"),
                        ],
                        default="new",
                        max_length=40,
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="payment_lot_created_set",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="payment_lot_updated_set",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.AddField(
            model_name="payment",
            name="payment_lot",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="payments",
                to="iaso.paymentlot",
            ),
        ),
    ]
