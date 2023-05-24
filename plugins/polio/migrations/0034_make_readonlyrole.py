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
polio_campaign,
polio_config,
polio_preparedness,
polio_round,
polio_surge
TO "readonlyrole";
"""


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0033_merge_20211028_1257"),
    ]

    operations = [migrations.RunSQL(QUERIES)]
