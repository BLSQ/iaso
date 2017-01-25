{% query 'data_by_location', note='locations info with confirmed cases' %}
  SELECT a."ZS"
       , a."AS"
       , a.village
       , a.longitude
       , a.latitude
       , a.gps_source as "gpsSource"

       , TRIM(BOTH
            TO_CHAR(a.longitude, '000.00000000')
            || ':' ||
            TO_CHAR(a.latitude, '000.00000000')) as id
       , TRIM(BOTH a."ZS" || ' - ' || a."AS" || ' - ' || a.village) as label
       , CASE a.village_official
            WHEN 'YES' THEN 'official'
            WHEN 'NO'  THEN 'other'
            WHEN 'NA'  THEN 'unknown'
          END as type

       , COALESCE(a.population, 0) as population
       , a.population_year as "populationYear"
       , a.population_source as "populationSource"
       , COALESCE(b."screenedPeople", 0) as "screenedPeople"
       , b."lastScreeningDate"
       , COALESCE(b."confirmedCases", 0) as "confirmedCases"
       , b."lastConfirmedCaseDate"

    FROM cases_location a

    LEFT OUTER JOIN (
      SELECT "ZS"
           , "AS"
           , village

           , count(DISTINCT document_id) FILTER (WHERE screening_result IS NOT NULL) as "screenedPeople"
           , max(document_date) FILTER (WHERE screening_result IS NOT NULL) as "lastScreeningDate"

           , count(DISTINCT document_id) FILTER (WHERE confirmation_result IS TRUE) as "confirmedCases"
           , max(document_date) FILTER (WHERE confirmation_result IS TRUE) as "lastConfirmedCaseDate"

        FROM cases_case_view
       WHERE document_date BETWEEN {{ date_from|guards.date }} AND {{ date_to|guards.date }}

        {% if casedatefrom is defined %}
         AND confirmation_result IS TRUE
         AND document_date >= {{ casedatefrom|guards.date }}
        {% endif %}

        {% if screeningdateto is defined %}
         AND (screening_result IS NULL OR document_date < {{ screeningdateto|guards.date }})
        {% endif %}
    GROUP BY "ZS", "AS", village
    ) b

      ON a."ZS" = b."ZS"
     AND a."AS" = b."AS"
     AND a.village = b.village

   WHERE a.village_official IN ('YES', 'NO', 'NA')

  {% if zones_sante is defined %}
     AND lower(a."ZS") IN ('{{ zones_sante|join("','") }}')
  {% endif %}

   ORDER BY a.longitude, a.latitude
{% endquery %}
