{% query 'prepare', note='Create view used in finding duplicate pairs' %}
  {# the reason of this view is to check manually the efficiency of the algorithm #}
  DROP VIEW IF EXISTS cases_duplicatespair_search_view;
  CREATE VIEW cases_duplicatespair_search_view AS
    SELECT
           c1.id           AS case1_id
         , c2.id           AS case2_id
         , c1.document_id  AS document_id1
         , c2.document_id  AS document_id2
      FROM      cases_case AS c1
     INNER JOIN cases_case AS c2
       {# similar in... #}
        ON c1.name            % c2.name
       AND c1.prename         % c2.prename
       AND c1.lastname        % c2.lastname
       AND c1.mothers_surname % c2.mothers_surname
       {# group by... #}
       AND c1.sex             = c2.sex
       AND c1."ZS"            = c2."ZS"
       AND c1."AS"            = c2."AS"
       AND c1.village         = c2.village
       {# enforce ids constraint #}
       AND c1.id              > c2.id
       {# exclude pairs that have formely been ignored #}
       AND (c1.document_id, c2.document_id) NOT IN
           (SELECT document_id1, document_id2 FROM cases_ignoredpair)
       AND (c2.document_id, c1.document_id) NOT IN
           (SELECT document_id1, document_id2 FROM cases_ignoredpair)
  ;

  CREATE OR REPLACE FUNCTION cases_duplicatespair_makepairs()
    RETURNS BOOLEAN AS $$
    BEGIN
      {# TRUNCATE complains if there are pending trigger events... #}
      SET CONSTRAINTS ALL IMMEDIATE;

      {# Clear the pairs table #}
      TRUNCATE cases_duplicatespair RESTART IDENTITY;

      {# Match cases and create pairs of duplicates #}
      INSERT INTO cases_duplicatespair (case1_id, case2_id, document_id1, document_id2)
        SELECT case1_id, case2_id, document_id1, document_id2
          FROM cases_duplicatespair_search_view;

      RETURN TRUE;
    END;
    $$ LANGUAGE plpgsql;
{% endquery %}


{% query 'makepairs', note='Find duplicate pairs and put them in the pairs table' %}
  SELECT cases_duplicatespair_makepairs();
{% endquery %}
