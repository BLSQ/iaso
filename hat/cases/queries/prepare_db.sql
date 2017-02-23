{% sql 'prepare_views', note='Create any views' %}
  {# The best way is to DROP a view and CREATE it again instead of CREATE OR REPLACE #}
  {# CREATE OR REPLACE complains if the fields order is changed or one more is added in between #}

  {# View joining the hat event tables #}
  DROP VIEW if EXISTS hat_event_view;
  CREATE VIEW hat_event_view AS
    SELECT B.*
         , A.name
         , A.contents
         , A.documents
    FROM (
         SELECT id
              , filename AS name
              , contents
              , NULL::jsonb AS documents
         FROM hat_import_cases_file_event

         UNION ALL
         SELECT id
              , filename AS name
              , contents
              , NULL::jsonb AS documents
         FROM hat_import_reconciled_file_event

         UNION ALL
         SELECT id
              , NULL AS name
              , NULL AS contents
              , documents
         FROM hat_merge_cases_event

         UNION ALL
         SELECT id
              , device_id AS name
              , NULL AS contents
              , documents
         from hat_sync_cases_event
    ) A
    JOIN hat_event B
    ON B.id = A.id
    ORDER BY stamp ASC;

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
