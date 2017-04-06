{% query 'list_of_field_values', note='flat list of field values' %}
  SELECT DISTINCT "{{ field }}"
    FROM cases_case
   WHERE "{{ field }}" IS NOT NULL
   ORDER BY "{{ field }}";
{% endquery %}
