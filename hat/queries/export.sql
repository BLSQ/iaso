{% query 'export', note='export sql sentence' %}
  {# We use the psql \copy command to dump the data locally to a file #}
  \copy ({{ sql_sentence }})
  TO {{ filename|guards.string }}
  DELIMITER {{ delimiter|guards.string }}
  CSV
  HEADER
{% endquery %}
