{% sql 'prepare_views', note='Create any views' %}
  {# The best way is to DROP a view and CREATE it again instead of CREATE OR REPLACE #}
  {# CREATE OR REPLACE complains if the fields order is changed or one more is added in between #}

  {# View of cases with aggregated results for test types #}
  DROP VIEW IF EXISTS cases_case_view;
  CREATE VIEW cases_case_view AS
    SELECT *

         , date_trunc('day',   document_date) AS date_day
         , date_trunc('month', document_date) AS date_month
         , date_trunc('year',  document_date) AS date_year

         , CASE
             WHEN test_catt
               OR test_rdt
             THEN TRUE
             WHEN test_catt IS FALSE
               OR test_rdt  IS FALSE
             THEN FALSE
             ELSE NULL
           END AS screening_result

         , CASE
             WHEN test_maect
               OR test_ge
               OR test_pg
               OR test_ctcwoo
               OR test_lymph_node_puncture
               OR test_sf
               OR test_lcr
             THEN TRUE
             WHEN test_maect               IS FALSE
               OR test_ge                  IS FALSE
               OR test_pg                  IS FALSE
               OR test_ctcwoo              IS FALSE
               OR test_lymph_node_puncture IS FALSE
               OR test_sf                  IS FALSE
               OR test_lcr                 IS FALSE
             THEN FALSE
             ELSE NULL
           END AS confirmation_result

         , test_pl_result AS stage_result

      FROM cases_case;
{% endsql %}
