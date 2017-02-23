{% query 'cases_file_by_hash', note='Get a cases_file_event by file hash' %}
   SELECT *
   FROM hat_import_cases_file_event
   WHERE file_hash = {{ file_hash|guards.string }}
{% endquery %}


{% query 'reconciled_file_by_hash', note='Get a reconciled_file_event by file hash' %}
   SELECT *
   FROM hat_import_reconciled_file_event
   WHERE file_hash = {{ file_hash|guards.string }}
{% endquery %}


{% sql 'insert_event', note='create event' %}
  {# This is the base event that forms one part of every event log.
     Every event consists of two rows, one in the general event table and one
     in the table with specific event data. Do not use this by itself #}
  INSERT INTO hat_event
      (table_name, created, updated, deleted, total)
  VALUES (
      {{ table_name|guards.string }}
    , {{ created|guards.integer }}
    , {{ updated|guards.integer }}
    , {{ deleted|guards.integer }}
    , {{ total|guards.integer }}
  )
  RETURNING id
{% endsql %}


{% sql 'insert_cases_file_import', note='create cases file import entry' %}
  WITH e AS ({{ insert_event }})
  INSERT INTO hat_import_cases_file_event
      (id, filename, file_hash, contents, source_type)
  SELECT e.id
       , {{ name|guards.string }}
       , {{ hash|guards.string }}
       , {{ contents|guards.string }}
       , {{ source_type|guards.string }}
  FROM e
  RETURNING id
{% endsql %}


{% sql 'insert_reconciled_file_import', note='create reconciled cases import entry' %}
  WITH e AS ({{ insert_event }})
  INSERT INTO hat_import_reconciled_file_event
      (id, filename, file_hash, contents)
  SELECT e.id
       , {{ name|guards.string }}
       , {{ hash|guards.string }}
       , {{ contents|guards.string }}
  FROM e
  RETURNING id
{% endsql %}


{% sql 'insert_cases_merge', note='create merge entry' %}
  WITH e AS ({{ insert_event }})
  INSERT INTO hat_merge_cases_event
      (id, documents)
  SELECT e.id
       , '{{ documents }}'
  FROM e
  RETURNING id
{% endsql %}


{% sql 'insert_cases_sync', note='insert sync entry' %}
  WITH e AS ({{ insert_event }})
  INSERT INTO hat_sync_cases_event
      (id, documents, device_id)
  SELECT e.id
       , '{{ documents }}'
       , {{ device_id|guards.string }}
  FROM e
  RETURNING id
{% endsql %}
