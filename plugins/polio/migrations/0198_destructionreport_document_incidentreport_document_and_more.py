# Generated by Django 4.2.11 on 2024-10-09 13:09

from django.db import migrations, models

import plugins.polio.models.base


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0197_vaccinerequestform_vrf_type_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="destructionreport",
            name="document",
            field=models.FileField(
                blank=True,
                null=True,
                storage=plugins.polio.models.base.CustomPublicStorage(),
                upload_to="public_documents/destructionreport/",
            ),
        ),
        migrations.AddField(
            model_name="incidentreport",
            name="document",
            field=models.FileField(
                blank=True,
                null=True,
                storage=plugins.polio.models.base.CustomPublicStorage(),
                upload_to="public_documents/incidentreport/",
            ),
        ),
        migrations.AddField(
            model_name="outgoingstockmovement",
            name="document",
            field=models.FileField(
                blank=True,
                null=True,
                storage=plugins.polio.models.base.CustomPublicStorage(),
                upload_to="public_documents/forma/",
            ),
        ),
        migrations.AddField(
            model_name="vaccineprealert",
            name="document",
            field=models.FileField(
                blank=True,
                null=True,
                storage=plugins.polio.models.base.CustomPublicStorage(),
                upload_to="public_documents/prealert/",
            ),
        ),
        migrations.AddField(
            model_name="vaccinerequestform",
            name="document",
            field=models.FileField(
                blank=True,
                null=True,
                storage=plugins.polio.models.base.CustomPublicStorage(),
                upload_to="public_documents/vrf/",
            ),
        ),
    ]
