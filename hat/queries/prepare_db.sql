{% sql 'run_premigration', note='Delete old views' %}
   {# The best way is to DROP a view and CREATE it again instead of CREATE OR REPLACE #}
   {# CREATE OR REPLACE complains if the fields order is changed or one more is added in between #}
   {# CASCADE option will skip problems if the view is used in other views #}

   DROP VIEW IF EXISTS hat_event_view CASCADE;
   DROP VIEW IF EXISTS cases_case_view CASCADE;
   DROP VIEW IF EXISTS sync_devicedb_view CASCADE;

{% endsql %}

{% sql 'run_postmigration', note='Create any views' %}
  {# View joining the hat event tables #}
  CREATE OR REPLACE VIEW hat_event_view AS
    SELECT E.id
         , E.stamp
         , E.table_name
         , A.name
         , A.sub_type
         , E.total
         , E.created
         , E.updated
         , E.deleted
         , A.contents
         , A.data
      FROM hat_event E
      JOIN (
         SELECT id
              , filename    AS name
              , contents
              , data
              , source_type AS sub_type
           FROM hat_import_cases_file_event

          UNION ALL
         SELECT id
              , filename    AS name
              , contents
              , NULL::jsonb AS data
              , NULL::text  AS sub_type
           FROM hat_import_reconciled_file_event

          UNION ALL
         SELECT id
              , NULL::text  AS name
              , NULL::bytea AS contents
              , documents   AS data
              , NULL::text  AS sub_type
           FROM hat_merge_cases_event

          UNION ALL
         SELECT id
              , device_id   AS name
              , NULL::bytea AS contents
              , documents   AS data
              , NULL::text  AS sub_type
           FROM hat_sync_cases_event
         ) A
        ON E.id = A.id
  ;


  {# View of cases with aggregated results for test types #}
  CREATE OR REPLACE VIEW cases_case_view AS
    SELECT *

         , DATE_TRUNC('day',   document_date) AS document_date_day
         , DATE_TRUNC('month', document_date) AS document_date_month
         , DATE_TRUNC('year',  document_date) AS document_date_year

         , CAST(EXTRACT(DAY   FROM document_date) AS INT) AS document_day
         , CAST(EXTRACT(MONTH FROM document_date) AS INT) AS document_month
         , CAST(EXTRACT(YEAR  FROM document_date) AS INT) AS document_year

         , COALESCE(province, '***') || ' - ' ||
           COALESCE("ZS", '***') || ' - ' ||
           COALESCE("AS", '***') || ' - ' ||
           COALESCE(village, '***')                       AS full_location
         , COALESCE(name, '') || ' ' ||
           COALESCE(prename, '') || ' ' ||
           COALESCE(lastname, '')                         AS full_name

         , CASE
             WHEN test_catt={{positive}}
               OR test_rdt={{positive}}
             THEN {{positive}}
             WHEN test_catt={{negative}}
               OR test_rdt={{negative}}
             THEN {{negative}}
             WHEN test_catt={{missing}}
               OR test_rdt={{missing}}
             THEN {{missing}}
             WHEN test_catt={{absent}}
               OR test_rdt={{absent}}
             THEN {{absent}}
             ELSE NULL
           END AS screening_result

         , CASE
             WHEN test_maect={{positive}}
               OR test_ge={{positive}}
               OR test_pg={{positive}}
               OR test_ctcwoo={{positive}}
               OR test_lymph_node_puncture={{positive}}
               OR test_sf={{positive}}
               OR test_lcr={{positive}}
             THEN {{positive}}
             WHEN test_maect={{negative}}
               OR test_ge={{negative}}
               OR test_pg={{negative}}
               OR test_ctcwoo={{negative}}
               OR test_lymph_node_puncture={{negative}}
               OR test_sf={{negative}}
               OR test_lcr={{negative}}
             THEN {{negative}}
             WHEN test_maect={{missing}}
               OR test_ge={{missing}}
               OR test_pg={{missing}}
               OR test_ctcwoo={{missing}}
               OR test_lymph_node_puncture={{missing}}
               OR test_sf={{missing}}
               OR test_lcr={{missing}}
             THEN {{missing}}
             WHEN test_maect={{absent}}
               OR test_ge={{absent}}
               OR test_pg={{absent}}
               OR test_ctcwoo={{absent}}
               OR test_lymph_node_puncture={{absent}}
               OR test_sf={{absent}}
               OR test_lcr={{absent}}
             THEN {{absent}}
             ELSE NULL
           END AS confirmation_result

         , test_pl_result AS stage_result

      FROM cases_case
  ;


  {# View joining devices and aggregated cases by device #}
  CREATE OR REPLACE VIEW sync_devicedb_view AS
    SELECT COALESCE(D.device_id, C.device_id)                      AS device_id
         , CASE WHEN D.device_id IS NULL THEN FALSE ELSE TRUE END  AS is_synced
         , regexp_split_to_array(D.last_synced_log_message, ' - ') AS last_synced_stats
         , D.last_synced_date
         , D.last_synced_seq
         , C.date_first
         , C.date_last
         , C.locations
         , C.participants
      FROM sync_devicedb D
      FULL OUTER JOIN (
        SELECT device_id
             , MIN(document_date)                         AS date_first
             , MAX(document_date)                         AS date_last
             , COUNT(DISTINCT full_location)              AS locations
             , COUNT(DISTINCT document_id)                AS participants
          FROM cases_case_view
         GROUP BY device_id) C
        ON D.device_id = C.device_id
     WHERE COALESCE(D.device_id, C.device_id) IS NOT NULL
  ;

{% endsql %}
