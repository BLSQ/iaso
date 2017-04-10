{% sql 'run' %}
  {#
    Create tables and views used for event sourcing any operations on the
    data, to be able to replay the import, duplicates merging and any other
    operations that add or mutate the data, we keep track of all events
    and their associated raw data in chronological order.
  #}

  {#
    Table to record events of any type. The actual event data are persisted
    in a event specific table that points to an entry in this table.
  #}
  CREATE TABLE hat_event (
    id            serial          PRIMARY KEY,
    stamp         timestamp       NOT NULL DEFAULT now(),
    table_name    text            NOT NULL,
    created       integer         DEFAULT 0,
    updated       integer         DEFAULT 0,
    deleted       integer         DEFAULT 0,
    total         integer         DEFAULT 0
  );

  CREATE TABLE hat_import_cases_file_event (
    id            integer         PRIMARY KEY REFERENCES hat_event
                                    ON UPDATE CASCADE
                                    ON DELETE CASCADE,
    filename      text            NOT NULL,
    file_hash     text            NOT NULL UNIQUE,
    contents      bytea           NULL,
    source_type   text            NOT NULL,
    data          jsonb           NOT NULL DEFAULT '{}'::jsonb
  );

  CREATE TABLE hat_import_reconciled_file_event (
    id            integer         PRIMARY KEY REFERENCES hat_event
                                    ON UPDATE CASCADE
                                    ON DELETE CASCADE,
    filename      text            NOT NULL,
    file_hash     text            NOT NULL UNIQUE,
    contents      bytea           NOT NULL
  );

  CREATE TABLE hat_merge_cases_event (
    id            integer         PRIMARY KEY REFERENCES hat_event
                                    ON UPDATE CASCADE
                                    ON DELETE CASCADE,
    documents     jsonb           NOT NULL
  );

  CREATE TABLE hat_sync_cases_event (
    id            integer         PRIMARY KEY REFERENCES hat_event
                                    ON UPDATE CASCADE
                                    ON DELETE CASCADE,
    documents     jsonb           NOT NULL,
    device_id     text            NOT NULL
  );

{% endsql %}
