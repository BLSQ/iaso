create or replace view patient_matching_namesimilarity as
  select p1.id as patient1_id,
         p2.id as patient2_id,
         cast(((coalesce(p1.post_name, 'Xx') <-> coalesce(p2.post_name, 'Xx'))
           + (coalesce(p1.first_name, 'Xx') <-> coalesce(p2.first_name, 'Xx'))
           + (coalesce(p1.last_name, 'Xx') <-> coalesce(p2.last_name, 'Xx'))
           + (coalesce(p1.mothers_surname , 'Xx') <-> coalesce(p2.mothers_surname, 'Xx'))
           + (CASE WHEN p1.origin_village_id=p1.origin_village_id then 0 ELSE 1 END)
           ) / 5 * 1000 as smallint)
           as similarity_score,
         'namesim'::varchar(10) as algorithm
  from patient_patient p1, patient_patient p2
  where coalesce(p1.first_name, 'Xx') % coalesce(p2.first_name, 'Xx')
  and coalesce(p1.last_name, 'Xx') % coalesce(p2.last_name, 'Xx')
  and coalesce(p1.post_name, 'Xx') % coalesce(p2.post_name, 'Xx')
  and coalesce(p1.mothers_surname, 'Xx') % coalesce(p2.mothers_surname, 'Xx')
  and p1.sex = p2.sex
  and p1.origin_area_id=p2.origin_area_id
  and (p1.year_of_birth is null or p2.year_of_birth is null
       or abs(p2.year_of_birth-p1.year_of_birth)<5)
  and p1.id <> p2.id
  and not exists (select 1 from patient_patientignoredpair i
    where i.patient1_id=p1.id and i.patient2_id=p2.id)
