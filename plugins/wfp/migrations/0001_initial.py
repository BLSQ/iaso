# Generated by Django 3.2.15 on 2023-07-29 07:52

import django.db.models.deletion

from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("iaso", "0225_merge_20230719_1411"),
    ]

    operations = [
        migrations.CreateModel(
            name="Beneficiary",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("birth_date", models.DateField()),
                (
                    "gender",
                    models.CharField(
                        blank=True, choices=[("MALE", "Male"), ("FEMALE", "Female")], max_length=8, null=True
                    ),
                ),
                ("entity_id", models.IntegerField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name="Journey",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "admission_criteria",
                    models.CharField(blank=True, choices=[("MUAC", "MUAC"), ("WHZ", "WHZ")], max_length=255, null=True),
                ),
                (
                    "admission_type",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("NEW", "new case"),
                            ("NEW_RESPONDANT", "New respondant"),
                            ("NEW_RESPONDANT", "New respondant"),
                            ("REFERRED_FROM_OTP_SAM", "Referred from OTP (SAM)"),
                            ("REFERRED_FROM_SC", "Referred from SC"),
                            ("REFERRED_FROM_TSFP_MAM", "Referred from TSFP (MAM)"),
                            ("RELAPSED", "Relapsed"),
                            ("RETURNED_DEFAULTED", "Returned defaulter"),
                            ("TRANSFER_IF_FROM_OTHER_TSFP", "Transfer if from other TSFP"),
                        ],
                        max_length=255,
                        null=True,
                    ),
                ),
                (
                    "nutrition_programme",
                    models.CharField(blank=True, choices=[("TSFP", "TSFP"), ("OTP", "OTP")], max_length=255, null=True),
                ),
                (
                    "programme_type",
                    models.CharField(blank=True, choices=[("PLW", "PLW"), ("U5", "U5")], max_length=255, null=True),
                ),
                ("weight_gain", models.FloatField(default=0)),
                (
                    "exit_type",
                    models.CharField(
                        blank=True, choices=[("DEATH", "Death"), ("CURED", "Cured")], max_length=50, null=True
                    ),
                ),
                (
                    "beneficiary",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to="wfp.beneficiary"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Visit",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date", models.DateTimeField(blank=True, null=True)),
                ("number", models.IntegerField(default=1)),
                (
                    "journey",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to="wfp.journey"
                    ),
                ),
                (
                    "org_unit",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to="iaso.orgunit"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Step",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("assistance_type", models.CharField(max_length=255)),
                ("quantity_given", models.FloatField()),
                ("instance_id", models.IntegerField(blank=True, null=True)),
                (
                    "visit",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to="wfp.visit"
                    ),
                ),
            ],
        ),
    ]
