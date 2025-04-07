# Generated by Django 3.1.14 on 2022-01-10 14:29

from django.db import migrations, models


# Functions from the following migrations need manual copying.
# Move them and any dependencies into this file, then update the
# RunPython operations to refer to the local versions:
# iaso.migrations.0104_seed_form_possible_fields_20210825_0949
# iaso.migrations.0108_add_page_feature_flag_20211005_1346


def create_page_account_flag(apps, schema_editor):
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")
    AccountFeatureFlag.objects.get_or_create(code="SHOW_PAGES", defaults={"name": "Show page menu"})


def reverse_create_page_account_flag(apps, schema_editor):
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")
    AccountFeatureFlag.objects.get(code="SHOW_PAGES", name="Show page menu").delete()


"""
Create a read only role for django-sql-dashboard.
You need to manually assign it to a postrgesql user with:
GRANT readonlyrole to <youruser>
"""

QUERIES = """
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'readonlyrole') THEN
      CREATE ROLE "readonlyrole";
   END IF;
END
$do$;
GRANT USAGE ON SCHEMA PUBLIC TO "readonlyrole";
GRANT SELECT ON TABLE 
 audit_modification,
 auth_group,
 auth_group_permissions,
 auth_permission,
 --auth_user,
 auth_user_groups,
 auth_user_user_permissions,
 django_admin_log,
 django_comment_flags,
 django_comments,
 django_content_type,
 django_migrations,
 --django_session,
 django_site,
 iaso_account,
 iaso_accountfeatureflag,
 iaso_account_feature_flags,
 iaso_account_users,
 iaso_algorithmrun,
 iaso_commentiaso,
 iaso_datasource,
 iaso_datasource_projects,
 iaso_device,
 iaso_deviceownership,
 iaso_deviceposition,
 iaso_device_projects,
 iaso_exportlog,
 iaso_exportrequest,
 iaso_exportstatus,
 iaso_exportstatus_export_logs,
 iaso_externalcredentials,
 iaso_featureflag,
 iaso_form,
 iaso_form_org_unit_types,
 iaso_formversion,
 iaso_group,
 iaso_group_org_units,
 iaso_groupset,
 iaso_groupset_groups,
 iaso_importgpkg,
 iaso_instance,
 iaso_instancefile,
 iaso_link,
 iaso_mapping,
 iaso_mappingversion,
 iaso_matchingalgorithm,
 iaso_orgunit,
 iaso_orgunittype,
 iaso_orgunittype_projects,
 iaso_orgunittype_sub_unit_types,
 iaso_page,
 iaso_page_users,
 iaso_profile_org_units,
 iaso_project,
 iaso_project_feature_flags,
 iaso_project_forms,
 iaso_record,
 iaso_recordtype,
 iaso_recordtype_projects,
 iaso_sourceversion,
 iaso_task,
  -- vector_control_apiimport
 spatial_ref_sys
TO "readonlyrole";
GRANT SELECT(
  id, last_login, is_superuser, username, first_name,
  last_name, email, is_staff, is_active, date_joined
) ON auth_user TO "readonlyrole";
"""


class Migration(migrations.Migration):
    replaces = [
        ("iaso", "0101_page_needs_authentication"),
        ("iaso", "0102_page_type"),
        ("iaso", "0103_auto_20210825_0945"),
        ("iaso", "0104_seed_form_possible_fields_20210825_0949"),
        ("iaso", "0105_auto_20210825_1015"),
        ("iaso", "0102_auto_20210802_1612"),
        ("iaso", "0103_merge_20210827_1341"),
        ("iaso", "0106_merge_20210906_1310"),
        ("iaso", "0107_auto_20211001_1845"),
        ("iaso", "0108_add_page_feature_flag_20211005_1346"),
        ("iaso", "0109_auto_20211024_2118"),
        ("iaso", "0110_make_readonlyrole"),
    ]

    dependencies = [
        ("django_comments", "0004_add_object_pk_is_removed_index"),
        ("audit", "0001_squashed_0002_auto_20210611_0951"),
        ("iaso", "0100_auto_20210702_0835"),
    ]

    operations = [
        migrations.AddField(
            model_name="page",
            name="needs_authentication",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="page",
            name="type",
            field=models.CharField(
                choices=[("RAW", "Raw html"), ("TEXT", "Text"), ("IFRAME", "Iframe")], default="RAW", max_length=40
            ),
        ),
        migrations.RenameField(
            model_name="form",
            old_name="fields",
            new_name="possible_fields",
        ),
        # migrations.RunPython(
        #     code=iaso.migrations.0104_seed_form_possible_fields_20210825_0949.seed_form_possible_fields,
        #     reverse_code=django.db.migrations.operations.special.RunPython.noop,
        # ),
        migrations.AlterField(
            model_name="form",
            name="possible_fields",
            field=models.JSONField(
                blank=True,
                help_text="Questions present in all versions of the form, as a flat list.Automatically updated on new versions.",
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="importgpkg",
            name="version_number",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="orgunittype",
            name="category",
            field=models.CharField(
                blank=True,
                choices=[("COUNTRY", "Country"), ("REGION", "Region"), ("DISTRICT", "District")],
                max_length=8,
                null=True,
            ),
        ),
        migrations.RunPython(create_page_account_flag, reverse_create_page_account_flag),
        migrations.AlterField(
            model_name="orgunittype",
            name="category",
            field=models.CharField(
                blank=True,
                choices=[
                    ("COUNTRY", "Country"),
                    ("REGION", "Region"),
                    ("DISTRICT", "District"),
                    ("HF", "Health Facility"),
                ],
                max_length=8,
                null=True,
            ),
        ),
        migrations.RunSQL(QUERIES),
    ]
