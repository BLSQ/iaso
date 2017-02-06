{% query 'export_cases', note='export cases' %}
   {# We use the psql \copy command to dump the data locally to a file #}
   \copy
   (
        SELECT {{ fields|join(', ') }}
        FROM cases_case_view
        WHERE TRUE
           {% if date_to is defined %}
              AND document_date < {{ date_to|guards.date }}
           {% endif %}
           {% if date_from is defined %}
              AND document_date >= {{ date_from|guards.date }}
           {% endif %}
           {% if sources is defined %}
              AND source IN ({{ sources|join(', ') }})
           {% endif %}
           {% if only_suspects %}
              AND screening_result    IS TRUE
              AND confirmation_result IS NULL
              AND stage_result        IS NULL
           {% endif %}
        ORDER BY document_date DESC
   )
   TO {{ filename|guards.string }}
   DELIMITER {{ delimiter|guards.string }}
   CSV
   HEADER
{% endquery %}
