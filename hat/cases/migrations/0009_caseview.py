# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0008_location_newfields'),
    ]

    operations = [
        migrations.AddField(
            model_name='caseview',
            name='hat_id',
            field=models.TextField(),
        ),
        migrations.AddField(
            model_name='caseview',
            name='mobile_unit',
            field=models.TextField(null=True),
        ),
        migrations.AddField(
            model_name='caseview',
            name='name',
            field=models.TextField(null=True),
        ),
        migrations.AddField(
            model_name='caseview',
            name='lastname',
            field=models.TextField(null=True),
        ),
        migrations.AddField(
            model_name='caseview',
            name='prename',
            field=models.TextField(null=True),
        ),
        migrations.AddField(
            model_name='caseview',
            name='sex',
            field=models.TextField(choices=[('female', 'Female'), ('male', 'Male')], null=True),
        ),
        migrations.AddField(
            model_name='caseview',
            name='age',
            field=models.TextField(null=True),
        ),
        migrations.AddField(
            model_name='caseview',
            name='year_of_birth',
            field=models.PositiveSmallIntegerField(null=True),
        ),
        migrations.AddField(
            model_name='caseview',
            name='province',
            field=models.PositiveSmallIntegerField(null=True),
        ),
    ]
