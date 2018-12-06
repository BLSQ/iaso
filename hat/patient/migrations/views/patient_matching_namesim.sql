create or replace view patient_matching_namesimilarity as
  select p1.id as patient1_id,
         p2.id as patient2_id,
         cast(((p1.post_name <-> p2.post_name)
           + (p1.first_name <-> p2.first_name)
           + (p1.last_name <-> p2.last_name)
           + (p1.mothers_surname <-> p2.mothers_surname)) / 4 * 1000 as smallint)
           as similarity_score,
         'namesim' as algorithm
  from patient_patient p1, patient_patient p2
  where p1.first_name % p2.first_name
  and p1.last_name % p2.last_name
  and p1.post_name % p2.post_name
  and p1.mothers_surname % p2.mothers_surname
  and (p1.year_of_birth is null or p2.year_of_birth is null
       or abs(p2.year_of_birth-p1.year_of_birth)<5)
  and p1.id <> p2.id
  and not exists (select 1 from patient_patientignoredpair i
    where i.patient1_id=p1.id and i.patient2_id=p2.id)