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
  {#
    This is the query used for inserting events of any type. It will insert two rows
    into two tables. One into the general event table and one into the specific
    event table with a FK pointing to the corresponding row in the general table.
  #}
  WITH E AS (
    INSERT INTO hat_event
           ( table_name, created, updated, deleted, total )
    VALUES (
             {{ details_table|guards.string }}
           , {{ created|guards.integer }}
           , {{ updated|guards.integer }}
           , {{ deleted|guards.integer }}
           , {{ total|guards.integer }}
           )
    RETURNING id
  )
    INSERT INTO {{ details_table }}
            (  id, {{ details_fields }} )
      SELECT E.id, {{ details_values }}
        FROM E
    RETURNING id
{% endsql %}
