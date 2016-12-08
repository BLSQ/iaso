from django.db import migrations, models

def forwards(apps, schema_editor):
    if not schema_editor.connection.alias == 'default':
        return
    # Your migration code goes here

class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0006_auto_20161121_1519'),
    ]

    operations = [
        migrations.CreateModel(
            name='CaseView',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source', models.TextField(choices=[('historic', 'Historic'), ('mobile_backup', 'Mobile backup'), ('pv', 'Pharamcovigilance')], db_index=True, null=True)),
                ('document_date', models.DateTimeField(db_index=True, null=True)),
                ('document_id', models.TextField(db_index=True)),
                ('ZS', models.TextField(db_index=True, null=True)),
                ('AS', models.TextField(null=True)),
                ('village', models.TextField(null=True)),
                ('latitude', models.DecimalField(decimal_places=8, max_digits=10, null=True)),
                ('longitude', models.DecimalField(decimal_places=8, max_digits=11, null=True)),
                ('screening_result', models.NullBooleanField()),
                ('confirmation_result', models.NullBooleanField()),
                ('stage_result', models.TextField(null=True)),
            ],
            options={
                'managed': False,
                'db_table': 'cases_case_view',
            },
        ),
        migrations.RunSQL('''
        CREATE OR REPLACE VIEW cases_case_view AS
        SELECT source
             , document_date
             , document_id
             , "ZS"
             , "AZ" AS "AS"
             , village
             , latitude
             , longitude

             , CASE
                 WHEN test_catt IS TRUE
                   OR test_rdt IS TRUE
                 THEN TRUE
                 WHEN test_catt IS FALSE
                   OR test_rdt IS FALSE
                 THEN FALSE
                 ELSE NULL
               END AS screening_result

             , CASE
                 WHEN test_maect IS TRUE
                   OR test_ge IS TRUE
                   OR test_pg IS TRUE
                   OR test_ctcwoo IS TRUE
                   OR test_lymph_node_puncture IS TRUE
                   OR test_sf IS TRUE
                   OR test_lcr IS TRUE
                 THEN TRUE
                 WHEN test_maect IS FALSE
                   OR test_ge IS FALSE
                   OR test_pg IS FALSE
                   OR test_ctcwoo IS FALSE
                   OR test_lymph_node_puncture IS FALSE
                   OR test_sf IS FALSE
                   OR test_lcr IS FALSE
                 THEN FALSE
                 ELSE NULL
               END AS confirmation_result

             , test_pl_result AS stage_result
        FROM cases_case
        '''),
    ]
