# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0008_location_newfields'),
    ]
    operations = [
        migrations.RunSQL('''
        CREATE OR REPLACE VIEW cases_case_view AS
        SELECT id
             , source
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

             , hat_id
             , mobile_unit
             , name
             , lastname
             , prename
             , sex
             , age
             , year_of_birth
             , province

        FROM cases_case
        '''),
    ]
