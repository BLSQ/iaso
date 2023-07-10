from django.db import migrations

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
    dependencies = [
        ("iaso", "0109_auto_20211024_2118"),
    ]

    operations = [migrations.RunSQL(QUERIES)]
