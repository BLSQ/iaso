from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0345_fuzzy_extension"),
    ]

    operations = [
        migrations.RunSQL(
            sql="\nCREATE OR REPLACE FUNCTION iaso_group_org_units_same_source_version() RETURNS trigger AS\n$F$\nBEGIN\n    IF ((select count(*) from iaso_group_org_units go\n            join iaso_group on (iaso_group.id = go.group_id)\n            join iaso_orgunit on (iaso_orgunit.id = go.orgunit_id)\n            where go.group_id = new.group_id\n            and go.orgunit_id = new.orgunit_id\n            and iaso_orgunit.version_id != iaso_group.source_version_id) > 0)\n    THEN\n        RAISE EXCEPTION 'Constraint violation iaso_group_org_units_same_source_version_constraint';\n    END IF;\n    RETURN NEW;\nEND;\n$F$ LANGUAGE plpgsql;",
            reverse_sql="DROP FUNCTION iaso_group_org_units_same_source_version;",
        ),
        migrations.RunSQL(
            sql="\n        CREATE CONSTRAINT TRIGGER iaso_group_org_units_same_source_version_constraint\n        AFTER INSERT OR UPDATE\n        ON iaso_group_org_units\n        DEFERRABLE INITIALLY DEFERRED\n        FOR EACH ROW\n        EXECUTE PROCEDURE iaso_group_org_units_same_source_version();\n        ",
            reverse_sql="\n        DROP TRIGGER iaso_group_org_units_same_source_version_constraint\n        ON iaso_group_org_units;",
        ),
        migrations.RunSQL(
            sql="\n    CREATE OR REPLACE FUNCTION iaso_group_org_units_same_source_version_group() RETURNS trigger AS\n    $F$\n    BEGIN\n        IF ((select count(*) from iaso_group_org_units go\n                join iaso_group on (iaso_group.id = go.group_id)\n                join iaso_orgunit on (iaso_orgunit.id = go.orgunit_id)\n                where go.group_id = new.id\n\n                and iaso_orgunit.version_id != iaso_group.source_version_id) > 0)\n        THEN\n            RAISE EXCEPTION 'Constraint violation iaso_group_org_units_same_source_version_constraint';\n        END IF;\n        RETURN NEW;\n    END;\n    $F$ LANGUAGE plpgsql;",
            reverse_sql="DROP FUNCTION iaso_group_org_units_same_source_version;",
        ),
        migrations.RunSQL(
            sql="\n            CREATE CONSTRAINT TRIGGER iaso_group_same_source_version_as_org_unit_constraint\n            AFTER INSERT OR UPDATE\n            ON iaso_group\n            DEFERRABLE INITIALLY DEFERRED\n            FOR EACH ROW\n            EXECUTE PROCEDURE iaso_group_org_units_same_source_version_group();",
            reverse_sql="\n            DROP TRIGGER iaso_group_same_source_version_as_org_unit_constraint\n            ON iaso_group;",
        ),
        migrations.RunSQL(
            sql="\n    CREATE OR REPLACE FUNCTION iaso_group_org_units_same_source_version_orgunit() RETURNS trigger AS\n    $F$\n    BEGIN\n        IF ((select count(*) from iaso_group_org_units go\n                join iaso_group on (iaso_group.id = go.group_id)\n                join iaso_orgunit on (iaso_orgunit.id = go.orgunit_id)\n                where go.orgunit_id = new.id\n                and iaso_orgunit.version_id != iaso_group.source_version_id) > 0)\n        THEN\n            RAISE EXCEPTION 'Constraint violation iaso_group_org_units_same_source_version_constraint';\n        END IF;\n        RETURN NEW;\n    END;\n    $F$ LANGUAGE plpgsql;",
            reverse_sql="DROP FUNCTION iaso_group_org_units_same_source_version_orgunit;",
        ),
        migrations.RunSQL(
            sql="\n            CREATE CONSTRAINT TRIGGER iaso_org_units_same_source_version_constraint\n            AFTER INSERT OR UPDATE\n            ON iaso_orgunit\n            DEFERRABLE INITIALLY DEFERRED\n            FOR EACH ROW\n            EXECUTE PROCEDURE iaso_group_org_units_same_source_version_orgunit();\n            ",
            reverse_sql="\n            DROP TRIGGER iaso_org_units_same_source_version_constraint ON iaso_orgunit;",
        ),
    ]
