{% query 'cases_over_time', note='cases timeseries aggregated by day' %}
  SELECT date
       , COALESCE(registered_total, 0)   AS registered_total

       , COALESCE(screening_total, 0)    AS screening_total
       , COALESCE(screening_pos,   0)    AS screening_pos
       , COALESCE(screening_neg,   0)    AS screening_neg

       , COALESCE(confirmation_total, 0) AS confirmation_total
       , COALESCE(confirmation_pos,   0) AS confirmation_pos
       , COALESCE(confirmation_neg,   0) AS confirmation_neg

       , COALESCE(staging_total, 0)      AS staging_total
       , COALESCE(stage1,        0)      AS stage1
       , COALESCE(stage2,        0)      AS stage2

    FROM (
        {# Create a table with a row for each date_interval between two dates #}
        SELECT date::date
          FROM generate_series(timestamp {{ date_from|guards.date }}
                             , timestamp {{ date_to|guards.date }}
                             , interval {{ date_interval|guards.string }}) AS date
   ) dates

    LEFT JOIN (
        {# Count test results for each date in the date range #}
        SELECT
               date_trunc({{ date_trunc_to|guards.string }}, document_date)::date
               AS date

             , COUNT(document_id)
               AS registered_total

             , COUNT(document_id) FILTER (WHERE screening_result IS NOT NULL)
               AS screening_total
             , COUNT(document_id) FILTER (WHERE screening_result = {{ positive }})
               AS screening_pos
             , COUNT(document_id) FILTER (WHERE screening_result = {{ negative }})
               AS screening_neg

             , COUNT(document_id) FILTER (WHERE confirmation_result IS NOT NULL)
               AS confirmation_total
             , COUNT(document_id) FILTER (WHERE confirmation_result = {{ positive }})
               AS confirmation_pos
             , COUNT(document_id) FILTER (WHERE confirmation_result = {{ negative }})
               AS confirmation_neg

             , COUNT(document_id) FILTER (WHERE stage_result IS NOT NULL)
               AS staging_total
             , COUNT(document_id) FILTER (WHERE stage_result = 'stage1')
               AS stage1
             , COUNT(document_id) FILTER (WHERE stage_result = 'stage2')
               AS stage2

          FROM cases_case_view
         WHERE document_date >= {{ date_from|guards.date }}
           AND document_date <  {{ date_to|guards.date }}

           {% if zones_sante is defined %}
            AND "ZS" IN ('{{ zones_sante|join("','") }}')
           {% endif %}

          {% if source is defined %}
           AND source ILIKE {{ source|guards.string }}
          {% endif %}

         GROUP BY date
   ) tests

   USING (date)
   ORDER BY date
{% endquery %}


{% query 'population_coverage', note='get the population of visited villages' %}
  SELECT
      {# Total number of visited villages #}
         COUNT(DISTINCT cases.full_location)
         AS total_visited

      {# Visited villages that have population data #}
       , COUNT(DISTINCT cases.full_location)
         FILTER (WHERE locations.population IS NOT NULL)
         AS visited_with_population

      {# Number of registered cases in villages with population data #}
       , SUM(cases.registered)
         FILTER (WHERE locations.population IS NOT NULL)
         AS registered_with_population

      {# Total population in visited locations #}
       , SUM(locations.population)
         AS population

    FROM (
        {# Count the registered participants per distinct location #}
        SELECT "ZS", "AS", village, full_location
              , COUNT(document_id) AS registered
          FROM cases_case_view
         WHERE document_date >= {{ date_from|guards.date }}
           AND document_date <  {{ date_to|guards.date }}

          {% if zones_sante is defined %}
           AND "ZS" IN ('{{ zones_sante|join("','") }}')
          {% endif %}

          {% if source is defined %}
           AND source ILIKE {{ source|guards.string }}
          {% endif %}
         GROUP BY "ZS", "AS", village, full_location
    ) cases

    LEFT JOIN cases_location locations

      ON cases."ZS"           = locations."ZS"
     AND cases."AS"           = locations."AS"
     AND cases.village        = locations.village
     AND locations.population > 0
{% endquery %}
