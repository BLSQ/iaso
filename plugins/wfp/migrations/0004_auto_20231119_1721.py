# Generated by Django 3.2.22 on 2023-11-19 17:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('wfp', '0003_auto_20230928_1350'),
    ]

    operations = [
        migrations.AlterField(
            model_name='beneficiary',
            name='gender',
            field=models.CharField(blank=True, choices=[('Male', 'Male'), ('Female', 'Female')], max_length=8, null=True),
        ),
        migrations.AlterField(
            model_name='journey',
            name='admission_criteria',
            field=models.CharField(blank=True, choices=[('muac', 'MUAC'), ('whz', 'WHZ'), ('oedema', 'OEDEMA')], max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='journey',
            name='admission_type',
            field=models.CharField(blank=True, choices=[('new_case', 'new case'), ('new_respondant', 'New respondant'), ('referred_from_otp_sam', 'Referred from OTP (SAM)'), ('referred_from_sc', 'Referred from SC'), ('referred_from_tsfp_mam', 'Referred from TSFP (MAM)'), ('relapse', 'Relapse'), ('returned_defaulter', 'Returned defaulter'), ('returned_referral', 'Returned referral'), ('transfer_if_from_other_tsfp', 'Transfer if from other TSFP')], max_length=255, null=True),
        ),
    ]
