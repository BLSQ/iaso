{% query 'makepairs', note='Find duplicate pairs and put them in the pairs table' %}
    {# Clear the pairs table #}
    TRUNCATE cases_duplicatespair;

    {# Match cases and create pairs of duplicates #}
    INSERT INTO cases_duplicatespair
        (case1_id, case2_id, document_id1, document_id2)
    SELECT
        c1.id, c2.id, c1.document_id, c2.document_id
    FROM cases_case c1
    INNER JOIN (
        SELECT id, document_id,
               name, prename, lastname, mothers_surname, sex,
               "ZS", "AS", village
        FROM cases_case
        WHERE NOT deleted
    ) c2 ON c1.name % c2.name
         AND c1.prename % c2.prename
         AND c1.lastname % c2.lastname
         AND c1.mothers_surname % c2.mothers_surname
         AND c1.sex = c2.sex
         AND c1."ZS" = c2."ZS"
         AND c1."AS" = c2."AS"
         AND c1.village = c2.village
         AND c1.id > c2.id
    WHERE NOT deleted;

    {# Remove pairs that have formely been ignored #}
    DELETE
    FROM cases_duplicatespair c3
    USING cases_ignoredpair ic
    WHERE c3.document_id1 = ic.document_id1
      AND c3.document_id2 = ic.document_id2
{% endquery %}
