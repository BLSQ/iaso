{% sql 'prepare_extensions', note='Create extensions' %}
  {# Load the trigrams extension #}
  CREATE EXTENSION IF NOT EXISTS pg_trgm;

  {# hstore is necessary to save the document changes #}
  CREATE EXTENSION IF NOT EXISTS hstore;
{% endsql %}


{% sql 'prepare_indices', depends_on=['prepare_extensions'] %}
  {#  create trigram indexes for names #}
  CREATE INDEX IF NOT EXISTS cases_case_names_trgm_idx
    ON cases_case
    USING gin (
      name            gin_trgm_ops,
      prename         gin_trgm_ops,
      lastname        gin_trgm_ops,
      mothers_surname gin_trgm_ops
    );
{% endsql %}


{% sql 'prepare_views', note='Create views outside migration files' %}
  {# The best way is to DROP and CREATE again instead of CREATE OR REPLACE #}
  {# CREATE OR REPLACE complains if the fields order is changed or one more is added in between #}

  {# "CaseView" model #}
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


{% sql 'cleaning', note='Cleaning the house' %}
  DROP TRIGGER IF EXISTS cases_case_action_update ON cases_case;
  DROP TRIGGER IF EXISTS cases_case_action_delete ON cases_case;

  DROP FUNCTION IF EXISTS cases_case_update();
  DROP FUNCTION IF EXISTS cases_case_delete();

  {# DROP VIEW IF EXISTS cases_history_log_view; #}
  {# DROP TABLE IF EXISTS cases_history_log; #}
  {# DROP TABLE IF EXISTS cases_history_log_document; #}
{% endsql %}
