from django.db import migrations


class Migration(migrations.Migration):
    """This migration add a trigger constraint to ensure that we have the same source version
    between OrgUnit and Group."""

    dependencies = [
        ("iaso", "0085_merge_20210415_2144"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
CREATE OR REPLACE FUNCTION iaso_group_org_units_same_source_version() RETURNS trigger AS
$F$
BEGIN
    IF ((select count(*) from iaso_group_org_units go
            join iaso_group on (iaso_group.id = go.group_id)
            join iaso_orgunit on (iaso_orgunit.id = go.orgunit_id)
            where go.group_id = new.group_id
            and go.orgunit_id = new.orgunit_id
            and iaso_orgunit.version_id != iaso_group.source_version_id) > 0)
    THEN
        RAISE EXCEPTION 'Constraint violation iaso_group_org_units_same_source_version_constraint';
    END IF;
    RETURN NEW;
END;
$F$ LANGUAGE plpgsql;""",
            reverse_sql="""DROP FUNCTION iaso_group_org_units_same_source_version;""",
        ),
        migrations.RunSQL(
            sql="""
        CREATE CONSTRAINT TRIGGER iaso_group_org_units_same_source_version_constraint
        AFTER INSERT OR UPDATE
        ON iaso_group_org_units
        DEFERRABLE INITIALLY DEFERRED
        FOR EACH ROW
        EXECUTE PROCEDURE iaso_group_org_units_same_source_version();
        """,
            reverse_sql="""
        DROP TRIGGER iaso_group_org_units_same_source_version_constraint
        ON iaso_group_org_units;""",
        ),
        migrations.RunSQL(
            sql="""
    CREATE OR REPLACE FUNCTION iaso_group_org_units_same_source_version_group() RETURNS trigger AS
    $F$
    BEGIN
        IF ((select count(*) from iaso_group_org_units go
                join iaso_group on (iaso_group.id = go.group_id)
                join iaso_orgunit on (iaso_orgunit.id = go.orgunit_id)
                where go.group_id = new.id

                and iaso_orgunit.version_id != iaso_group.source_version_id) > 0)
        THEN
            RAISE EXCEPTION 'Constraint violation iaso_group_org_units_same_source_version_constraint';
        END IF;
        RETURN NEW;
    END;
    $F$ LANGUAGE plpgsql;""",
            reverse_sql="""DROP FUNCTION iaso_group_org_units_same_source_version;""",
        ),
        migrations.RunSQL(
            sql="""
            CREATE CONSTRAINT TRIGGER iaso_group_same_source_version_as_org_unit_constraint
            AFTER INSERT OR UPDATE
            ON iaso_group
            DEFERRABLE INITIALLY DEFERRED
            FOR EACH ROW
            EXECUTE PROCEDURE iaso_group_org_units_same_source_version_group();""",
            reverse_sql="""
            DROP TRIGGER iaso_group_same_source_version_as_org_unit_constraint
            ON iaso_group;""",
        ),
        migrations.RunSQL(
            sql="""
    CREATE OR REPLACE FUNCTION iaso_group_org_units_same_source_version_orgunit() RETURNS trigger AS
    $F$
    BEGIN
        IF ((select count(*) from iaso_group_org_units go
                join iaso_group on (iaso_group.id = go.group_id)
                join iaso_orgunit on (iaso_orgunit.id = go.orgunit_id)
                where go.orgunit_id = new.id
                and iaso_orgunit.version_id != iaso_group.source_version_id) > 0)
        THEN
            RAISE EXCEPTION 'Constraint violation iaso_group_org_units_same_source_version_constraint';
        END IF;
        RETURN NEW;
    END;
    $F$ LANGUAGE plpgsql;""",
            reverse_sql="""DROP FUNCTION iaso_group_org_units_same_source_version_orgunit;""",
        ),
        migrations.RunSQL(
            sql="""
            CREATE CONSTRAINT TRIGGER iaso_org_units_same_source_version_constraint
            AFTER INSERT OR UPDATE
            ON iaso_orgunit
            DEFERRABLE INITIALLY DEFERRED
            FOR EACH ROW
            EXECUTE PROCEDURE iaso_group_org_units_same_source_version_orgunit();
            """,
            reverse_sql="""
            DROP TRIGGER iaso_org_units_same_source_version_constraint ON iaso_orgunit;""",
        ),
    ]
