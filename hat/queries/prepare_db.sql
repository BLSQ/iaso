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

         , COALESCE(document_date, make_timestamp(form_year, coalesce(form_month, 1), 1, 1, 1, 1)) as normalized_date
         , COALESCE(extract(year from document_date), form_year) as normalized_year
         , COALESCE(extract(month from document_date), form_month) as normalized_month

         , DATE_TRUNC('day',   COALESCE(document_date, make_timestamp(form_year, coalesce(form_month, 1), 1, 1, 1, 1)))
              AS normalized_date_day
         , DATE_TRUNC('month', COALESCE(document_date, make_timestamp(form_year, coalesce(form_month, 1), 1, 1, 1, 1)))
              AS normalized_date_month
         , DATE_TRUNC('year',  COALESCE(document_date, make_timestamp(form_year, coalesce(form_month, 1), 1, 1, 1, 1)))
              AS normalized_date_year

         , COALESCE(province, '***') || ' - ' ||
           COALESCE("ZS", '***') || ' - ' ||
           COALESCE("AS", '***') || ' - ' ||
           COALESCE(village, '***')                       AS full_location

         , COALESCE(name, '') || ' ' ||
           COALESCE(prename, '') || ' ' ||
           COALESCE(lastname, '')                         AS full_name

         , CASE

            {% for result in results %}
              {% for test in screening %}
             WHEN {{ test }} = {{ result }} THEN {{ result }}
              {% endfor %}
            {% endfor %}

             ELSE NULL
           END AS screening_result

         , CASE

            {% for result in results %}
              {% for test in confirmation %}
             WHEN {{ test }} = {{ result }} THEN {{ result }}
              {% endfor %}
            {% endfor %}

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
