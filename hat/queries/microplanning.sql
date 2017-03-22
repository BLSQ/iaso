{% query 'data_by_location', note='locations info with confirmed cases' %}
  SELECT a.province
       , a.province_old AS "formerProvince"
       , a."ZS"
       , a."AS"
       , a.village
       , a.longitude
       , a.latitude
       , a.gps_source   AS "gpsSource"

       , TRIM(BOTH
            TO_CHAR(a.longitude, '000.00000000')
            || ':' ||
            TO_CHAR(a.latitude, '000.00000000'))
         AS id
       , TRIM(BOTH a."ZS" || ' - ' || a."AS" || ' - ' || a.village)
         AS label
       , CASE a.village_official
            WHEN 'YES' THEN 'official'
            WHEN 'NO'  THEN 'other'
            WHEN 'NA'  THEN 'unknown'
         END
         AS type

       , COALESCE(a.population, 0)       AS population
       , a.population_year               AS "populationYear"
       , a.population_source             AS "populationSource"

      {# include confirmed cases data only if requested #}
      {% if caseyears is defined %}
       , b."lastConfirmedCaseYear"
       , b."lastConfirmedCaseDate"
       , b."confirmedCases"
      {% endif %}

    FROM cases_location a

    {# include confirmed cases data only if requested #}
    {% if caseyears is defined %}
    LEFT OUTER JOIN
      {# select the aggregated cases by location and year #}
      (
        SELECT "ZS"
             , "AS"
             , village
             , document_year
             , MAX(document_date)                      AS "lastConfirmedCaseDate"
             , COUNT(DISTINCT document_id)             AS "confirmedCases"

             {# this is last case year within the location #}
             , MAX(document_year)
               OVER (PARTITION BY "ZS", "AS", village) AS "lastConfirmedCaseYear"

          FROM cases_case_view
         WHERE document_date       IS NOT NULL
           AND confirmation_result IS TRUE
         GROUP BY "ZS", "AS", village, document_year
      ) b

      ON a."ZS" = b."ZS"
     AND a."AS" = b."AS"
     AND a.village = b.village

     {# take only the last case year record #}
     AND b.document_year = b."lastConfirmedCaseYear"

     AND b."lastConfirmedCaseYear" IN ({{ caseyears|join(',') }})
  {% endif %}

   WHERE a.village_official IN ('YES', 'NO', 'NA')

  {% if zones_sante is defined %}
     AND lower(a."ZS") IN ('{{ zones_sante|join("','") }}')
  {% endif %}

   ORDER BY a.longitude, a.latitude
{% endquery %}
