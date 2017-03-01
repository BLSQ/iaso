{% sql 'run' %}
  {# Load the trigrams extension #}
  CREATE EXTENSION IF NOT EXISTS pg_trgm;

  {# hstore is necessary to save the document changes #}
  CREATE EXTENSION IF NOT EXISTS hstore;

  {#  Create trigram indexes for cases names. #}
  CREATE INDEX IF NOT EXISTS cases_case_names_trgm_idx
    ON cases_case
    USING gin (
      name            gin_trgm_ops,
      prename         gin_trgm_ops,
      lastname        gin_trgm_ops,
      mothers_surname gin_trgm_ops
    );

   {# Create tables and views used for event sourcing any operations on the
      data, to be able to replay the import, duplicates merging and any other
      operations that add or mutate the data, we keep track of all events
      and their associated raw data in chronological order. #}

   {# Table to record events of any type. The actual event data is persisted
      in a event specific table that points to an entry in this table. #}
   CREATE TABLE hat_event (
     id         serial          PRIMARY KEY,
     stamp      timestamp       NOT NULL DEFAULT now(),
     table_name text            NOT NULL,
     created    integer         DEFAULT 0,
     updated    integer         DEFAULT 0,
     deleted    integer         DEFAULT 0,
     total      integer         DEFAULT 0
   );

   CREATE TABLE hat_import_cases_file_event (
     id         integer         PRIMARY KEY REFERENCES hat_event
                                  ON UPDATE CASCADE
                                  ON DELETE CASCADE,
     filename    text           NOT NULL,
     file_hash   text           NOT NULL UNIQUE,
     contents    bytea          NOT NULL,
     source_type text           NOT NULL
   );

   CREATE TABLE hat_import_reconciled_file_event (
     id         integer         PRIMARY KEY REFERENCES hat_event
                                  ON UPDATE CASCADE
                                  ON DELETE CASCADE,
     filename    text           NOT NULL,
     file_hash   text           NOT NULL UNIQUE,
     contents    bytea          NOT NULL
   );

   CREATE TABLE hat_merge_cases_event (
     id          integer         PRIMARY KEY REFERENCES hat_event
                                   ON UPDATE CASCADE
                                   ON DELETE CASCADE,
     documents   jsonb           NOT NULL
   );

   CREATE TABLE hat_sync_cases_event (
     id          integer         PRIMARY KEY REFERENCES hat_event
                                   ON UPDATE CASCADE
                                   ON DELETE CASCADE,
     documents   jsonb           NOT NULL,
     device_id   text            NOT NULL
   );

   {# cleanup some tables and triggers from pre migration times #}
   DROP TRIGGER IF EXISTS cases_case_action_update ON cases_case;
   DROP TRIGGER IF EXISTS cases_case_action_delete ON cases_case;

   DROP FUNCTION IF EXISTS cases_case_update();
   DROP FUNCTION IF EXISTS cases_case_delete();

   DROP VIEW IF EXISTS cases_history_log_view;
   DROP TABLE IF EXISTS cases_history_log_document;
   DROP TABLE IF EXISTS cases_history_log;
{% endsql %}
