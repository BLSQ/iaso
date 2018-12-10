create or replace view patient_matching_invert as
  select p1.id as patient1_id, p2.id as patient2_id,
         cast(
               case when p1.origin_village_id=p2.origin_village_id then 0
                     when p1.origin_area_id=p2.origin_area_id then 500
                     else 1000 end as smallint
         ) as similarity_score,
         'invert'::varchar(10) as algorithm
  from patient_patient p1, patient_patient p2
  where
  (
    array_sort_agg(ARRAY[p1.first_name, p1.last_name, p1.post_name]) =
        array_sort_agg(ARRAY[p2.first_name, p2.last_name, p2.post_name])
  )
    and p1.mothers_surname % p2.mothers_surname
    and (p1.year_of_birth is null or p2.year_of_birth is null or abs(p2.year_of_birth-p1.year_of_birth)<5)
    and p1.id <> p2.id
    and p1.origin_area_id=p2.origin_area_id
    and not exists (select 1 from patient_patientignoredpair i
        where i.patient1_id=p1.id and i.patient2_id=p2.id)
