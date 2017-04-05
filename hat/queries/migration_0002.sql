{% sql 'run' %}
  ALTER TABLE hat_import_cases_file_event
  ALTER COLUMN contents DROP NOT NULL;

  ALTER TABLE hat_import_cases_file_event
  ADD COLUMN data jsonb NOT NULL DEFAULT '{}'::jsonb
{% endsql %}
