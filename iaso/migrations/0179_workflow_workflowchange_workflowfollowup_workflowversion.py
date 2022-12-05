# Generated by Django 3.2.15 on 2022-11-29 13:18

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("iaso", "0178_remove_beneficiary_user_perm"),
    ]

    operations = [
        migrations.CreateModel(
            name="Workflow",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("deleted_at", models.DateTimeField(blank=True, default=None, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "entity_type",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE, related_name="workflow", to="iaso.entitytype"
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="WorkflowVersion",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(default="No Name", max_length=50)),
                (
                    "status",
                    models.CharField(
                        choices=[("D", "Draft"), ("U", "Unpublished"), ("P", "Published")], default="D", max_length=2
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "reference_form",
                    models.ForeignKey(
                        default=None, null=True, on_delete=django.db.models.deletion.CASCADE, to="iaso.form"
                    ),
                ),
                (
                    "workflow",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workflow_versions",
                        to="iaso.workflow",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="WorkflowFollowup",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("order", models.IntegerField(default=0)),
                ("condition", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("forms", models.ManyToManyField(to="iaso.Form")),
                (
                    "workflow",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="follow_ups",
                        to="iaso.workflowversion",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="WorkflowChange",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("mapping", models.JSONField(default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("form", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.form")),
                (
                    "workflow",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="changes", to="iaso.workflowversion"
                    ),
                ),
            ],
        ),
    ]
