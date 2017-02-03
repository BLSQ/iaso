{% sql 'prepare_extensions', note='Create extensions' %}
  {# Load the trigrams extension #}
  CREATE EXTENSION IF NOT EXISTS pg_trgm;

  {# hstore is necessary to save the document changes #}
  CREATE EXTENSION IF NOT EXISTS hstore;
{% endsql %}


{% sql 'prepare_tables', note='Create auxiliary tables outside ORM' %}
  {% if case_file %}
    CREATE TABLE IF NOT EXISTS cases_case_file (
      file_id           text      PRIMARY_KEY,
      operation         text      NOT NULL,
      content           bytea     NULL,  {# raw data #}
      documents         jsonb     NULL   {# transformed data #}
    );
  {% endif %}


  {% if location_file %}
    CREATE TABLE IF NOT EXISTS cases_location_files (
      id                integer   PRIMARY KEY DEFAULT 0,
      villages          jsonb     NULL,
      areas             jsonb     NULL
    );

    {# insert one unique record if it does not exists yet #}
    INSERT INTO cases_location_files DEFAULT VALUES ON CONFLICT DO NOTHING;
  {% endif %}


  CREATE TABLE IF NOT EXISTS cases_history_log (
    step              serial    PRIMARY KEY,
    stamp             timestamp NOT NULL DEFAULT now(),
    operation         text      NOT NULL
  );


  {% if case_file or location_file %}
    CREATE TABLE IF NOT EXISTS cases_history_log_file (
      step              integer   PRIMARY KEY
                                  REFERENCES cases_history_log
                                    ON UPDATE CASCADE
                                    ON DELETE CASCADE,
      file_id           text      NOT NULL
    );
  {% endif %}


  CREATE TABLE IF NOT EXISTS cases_history_log_document (
    step              integer   PRIMARY KEY
                                REFERENCES cases_history_log
                                  ON UPDATE CASCADE
                                  ON DELETE CASCADE,
    document_id       text      NOT NULL,
    source_id         text      NULL,
    changed_values    jsonb     NULL
  );
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
    )
{% endsql %}


{% sql 'prepare_triggers', depends_on=['prepare_extensions', 'prepare_tables'] %}
  DROP TRIGGER IF EXISTS cases_case_action_update ON cases_case;

  CREATE OR REPLACE FUNCTION cases_case_update()
    RETURNS trigger AS $cases_case_update$
    DECLARE
      current_step  integer;
      operation     text;
    BEGIN
      IF NEW.update_with IS NULL THEN
        operation := 'UPDATE'; {# manual reconciliation #}
      ELSE
        operation := 'MERGE';  {# duplicates merge #}
      END IF;

      {# include the step in the history tables #}
      INSERT INTO cases_history_log (step, operation)
        VALUES (DEFAULT, operation)
        RETURNING step INTO current_step;

      INSERT INTO cases_history_log_document
               (step, document_id, source_id, changed_values)
        VALUES (current_step, NEW.document_id, NEW.update_with,
                hstore_to_jsonb_loose(hstore(NEW) - hstore(OLD)));

      {# make changes #}
      NEW.update_with    := NULL; {# remove any trace #}
      NEW.version_number := COALESCE(OLD.version_number, 0) + 1;

      {# result is NOT ignored since this is a BEFORE trigger #}
      RETURN NEW;
    END;
    $cases_case_update$ LANGUAGE plpgsql;

  CREATE TRIGGER cases_case_action_update
    BEFORE UPDATE ON cases_case
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE PROCEDURE cases_case_update();


  DROP TRIGGER IF EXISTS cases_case_action_delete ON cases_case;

  CREATE OR REPLACE FUNCTION cases_case_delete()
    RETURNS trigger AS $cases_case_delete$
    DECLARE
      current_step  integer;
    BEGIN
      {# include the step in the history tables #}
      INSERT INTO cases_history_log (step, operation)
        VALUES (DEFAULT, 'DELETE')
        RETURNING step INTO current_step;
      INSERT INTO cases_history_log_document (step, document_id)
        VALUES (current_step, OLD.document_id);

      {# result is ignored since this is an AFTER trigger #}
      RETURN NULL;
    END;
    $cases_case_delete$ LANGUAGE plpgsql;

  CREATE TRIGGER cases_case_action_delete
    AFTER DELETE ON cases_case
    FOR EACH ROW
    EXECUTE PROCEDURE cases_case_delete();


  {% if case_file %}
    DROP TRIGGER IF EXISTS cases_case_files_insert ON cases_case_file;

    CREATE OR REPLACE FUNCTION cases_case_file_insert()
      RETURNS trigger AS $cases_case_file_insert$
      DECLARE
        current_step  integer;
      BEGIN
        {# include the step in the history tables #}
        INSERT INTO cases_history_log (step, operation)
          VALUES (DEFAULT, NEW.operation)
          RETURNING step INTO current_step;

        INSERT INTO cases_history_log_file (step, file_id)
          VALUES (current_step, NEW.file_id);

        {# result is ignored since this is an AFTER trigger #}
        RETURN NULL;
      END;
      $cases_case_file_insert$ LANGUAGE plpgsql;

    CREATE TRIGGER cases_case_files_insert
      AFTER INSERT ON cases_case_file
      FOR EACH ROW
      EXECUTE PROCEDURE cases_case_file_insert();


    DROP TRIGGER IF EXISTS cases_case_files_delete ON cases_case_file;

    CREATE OR REPLACE FUNCTION cases_case_file_delete()
      RETURNS trigger AS $cases_case_file_delete$
      DECLARE
        current_step  integer;
      BEGIN
        {# include the step in the history tables #}
        INSERT INTO cases_history_log (step, operation)
          VALUES (DEFAULT, 'DELETE')
          RETURNING step INTO current_step;

        INSERT INTO cases_history_log_file (step, file_id)
          VALUES (current_step, OLD.file_id);

        {# result is ignored since this is an AFTER trigger #}
        RETURN NULL;
      END;
      $cases_case_file_delete$ LANGUAGE plpgsql;

    CREATE TRIGGER cases_case_files_delete
      AFTER DELETE ON cases_case_file
      FOR EACH ROW
      EXECUTE PROCEDURE cases_case_file_delete();
  {% endif %}


  {% if location_file %}
    DROP TRIGGER IF EXISTS cases_location_files_update ON cases_location_files;

    CREATE OR REPLACE FUNCTION cases_location_update()
      RETURNS trigger AS $cases_location_update$
      BEGIN
        IF NEW.villages IS NULL THEN
          TRUNCATE TABLE cases_location; {# empty locations #}
          RETURN NULL;
        END IF;

        IF OLD.villages IS DISTINCT FROM NEW.villages THEN
          TRUNCATE TABLE cases_location; {# reset locations #}
          {# TODO: call procedure to insert new entries #}
        END IF;

        IF NEW.areas IS NOT NULL THEN
          {# TODO: call method to update locations list with province info #}
        END IF;

        {# result is ignored since this is an AFTER trigger #}
        RETURN NULL;
      END;
      $cases_location_update$ LANGUAGE plpgsql;

    CREATE TRIGGER cases_location_files_update
      AFTER UPDATE ON cases_location_files
      FOR EACH ROW
      WHEN (OLD.* IS DISTINCT FROM NEW.*)
      EXECUTE PROCEDURE cases_location_update();
  {% endif %}
{% endsql %}


{% sql 'prepare_views', depends_on=['prepare_tables'] %}
  {# The best way is to DROP and CREATE again instead of CREATE OR REPLACE #}
  {# CREATE OR REPLACE complains if the fields order is changed or one more is added in between #}

  {# used to "reimport" all data #}
  DROP VIEW IF EXISTS cases_history_log_view;
  CREATE VIEW cases_history_log_view AS
    SELECT L.step, L.stamp, L.operation
         , text 'document'  AS type
         , D.document_id    AS id
         , D.source_id      AS document_source_id
         , D.changed_values AS document_changed_values
      FROM cases_history_log L
     INNER JOIN cases_history_log_document D
        ON L.step = D.step;
    {% if case_file or location_file %}
     UNION
    SELECT L.step, L.stamp, L.operation
        , text 'file'       AS type
        , F.file_id         AS id
        , NULL              AS document_source_id
        , NULL              AS document_changed_values
      FROM cases_history_log L
     INNER JOIN cases_history_log_file F
        ON L.step = F.step
    {% endif %}


  {# "CaseView" model #}
  DROP VIEW IF EXISTS cases_case_view;
  CREATE VIEW cases_case_view AS
    SELECT *
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
