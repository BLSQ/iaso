# Generated by Django 4.2.14 on 2024-08-06 12:09

import django.db.models.deletion

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0293_orgunitchangerequest_kind"),
        ("wfp", "0012_rename_weight_difference_journey_initial_weight_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="YearlyStatistics",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("year", models.CharField(blank=True, max_length=6, null=True)),
                (
                    "gender",
                    models.CharField(
                        blank=True,
                        choices=[("Male", "Male"), ("Female", "Female")],
                        max_length=8,
                        null=True,
                    ),
                ),
                (
                    "admission_criteria",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("muac", "MUAC"),
                            ("whz", "WHZ"),
                            ("oedema", "OEDEMA"),
                            ("child_wasted", "By wasted child"),
                        ],
                        max_length=255,
                        null=True,
                    ),
                ),
                (
                    "admission_type",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("new_case", "New case"),
                            (
                                "readmission_as_non_respondent",
                                "Readmission as non-respondent",
                            ),
                            ("referred_from_otp_sam", "Referred from OTP (SAM)"),
                            ("referred_from_sc", "Referred from SC"),
                            ("referred_from_tsfp_mam", "Referred from TSFP (MAM)"),
                            ("relapse", "Relapse"),
                            ("returned_defaulter", "Returned defaulter"),
                            ("returned_referral", "Returned referral"),
                            ("transfer_from_other_tsfp", "Transfer from other TSFP"),
                        ],
                        max_length=255,
                        null=True,
                    ),
                ),
                (
                    "exit_type",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("death", "Death"),
                            ("cured", "Cured"),
                            ("dismissed_due_to_cheating", "Dismissal"),
                            ("voluntary_withdrawal", "Voluntary Withdrawal"),
                            ("transfer_to_otp", "Transfer To OTP"),
                            ("transfer_to_tsfp", "Transfer To TSFP"),
                            ("non_respondent", "Non respondent"),
                            ("transferred_out", "Transferred out"),
                            ("defaulter", "Defaulter"),
                            ("other", "Other"),
                        ],
                        max_length=50,
                        null=True,
                    ),
                ),
                (
                    "nutrition_programme",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("TSFP", "TSFP"),
                            ("OTP", "OTP"),
                            ("breastfeeding", "Breastfeeding"),
                            ("pregnant", "Pregnant"),
                        ],
                        max_length=255,
                        null=True,
                    ),
                ),
                (
                    "programme_type",
                    models.CharField(
                        blank=True,
                        choices=[("PLW", "PLW"), ("U5", "U5")],
                        max_length=255,
                        null=True,
                    ),
                ),
                ("number_visits", models.IntegerField(default=0)),
                ("given_sachet_rusf", models.FloatField(blank=True, null=True)),
                ("given_sachet_rutf", models.FloatField(blank=True, null=True)),
                ("given_quantity_csb", models.FloatField(blank=True, null=True)),
                (
                    "org_unit",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        to="iaso.orgunit",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="MonthlyStatistics",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("month", models.CharField(blank=True, max_length=8, null=True)),
                (
                    "gender",
                    models.CharField(
                        blank=True,
                        choices=[("Male", "Male"), ("Female", "Female")],
                        max_length=8,
                        null=True,
                    ),
                ),
                (
                    "admission_criteria",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("muac", "MUAC"),
                            ("whz", "WHZ"),
                            ("oedema", "OEDEMA"),
                            ("child_wasted", "By wasted child"),
                        ],
                        max_length=255,
                        null=True,
                    ),
                ),
                (
                    "admission_type",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("new_case", "New case"),
                            (
                                "readmission_as_non_respondent",
                                "Readmission as non-respondent",
                            ),
                            ("referred_from_otp_sam", "Referred from OTP (SAM)"),
                            ("referred_from_sc", "Referred from SC"),
                            ("referred_from_tsfp_mam", "Referred from TSFP (MAM)"),
                            ("relapse", "Relapse"),
                            ("returned_defaulter", "Returned defaulter"),
                            ("returned_referral", "Returned referral"),
                            ("transfer_from_other_tsfp", "Transfer from other TSFP"),
                        ],
                        max_length=255,
                        null=True,
                    ),
                ),
                (
                    "exit_type",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("death", "Death"),
                            ("cured", "Cured"),
                            ("dismissed_due_to_cheating", "Dismissal"),
                            ("voluntary_withdrawal", "Voluntary Withdrawal"),
                            ("transfer_to_otp", "Transfer To OTP"),
                            ("transfer_to_tsfp", "Transfer To TSFP"),
                            ("non_respondent", "Non respondent"),
                            ("transferred_out", "Transferred out"),
                            ("defaulter", "Defaulter"),
                            ("other", "Other"),
                        ],
                        max_length=50,
                        null=True,
                    ),
                ),
                (
                    "nutrition_programme",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("TSFP", "TSFP"),
                            ("OTP", "OTP"),
                            ("breastfeeding", "Breastfeeding"),
                            ("pregnant", "Pregnant"),
                        ],
                        max_length=255,
                        null=True,
                    ),
                ),
                (
                    "programme_type",
                    models.CharField(
                        blank=True,
                        choices=[("PLW", "PLW"), ("U5", "U5")],
                        max_length=255,
                        null=True,
                    ),
                ),
                ("number_visits", models.IntegerField(default=0)),
                ("given_sachet_rusf", models.FloatField(blank=True, null=True)),
                ("given_sachet_rutf", models.FloatField(blank=True, null=True)),
                ("given_quantity_csb", models.FloatField(blank=True, null=True)),
                (
                    "org_unit",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        to="iaso.orgunit",
                    ),
                ),
            ],
        ),
    ]
