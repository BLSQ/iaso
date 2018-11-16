-- This operation is very time consuming and therefore not included in the actual migration.
-- Executing this big update within a single query/transaction tends to crash the Docker db container
-- Update chunks below take around 50s to execute on a laptop but only 10s or so in production.
-- Update origin_area/village in patients
create temporary table patient_patient2 as
select id,
       (select "normalized_AS_id" from cases_case cc where normalized_patient_id=p.id and "normalized_AS_id" is not null order by cc.id desc limit 1 ) as origin_area_id,
       (select "normalized_village_id" from cases_case cc where normalized_patient_id=p.id and "normalized_village_id" is not null order by cc.id desc limit 1 ) as origin_village_id
       from patient_patient p; -- 42sec
update patient_patient p set origin_village_id=p2.origin_village_id, origin_area_id=p2.origin_area_id from patient_patient2 p2
where p.id=p2.id and p.origin_area_id is null and p.id < 100000;
update patient_patient p set origin_village_id=p2.origin_village_id, origin_area_id=p2.origin_area_id from patient_patient2 p2
where p.id=p2.id and p.origin_area_id is null and p.id >=100000 and p.id < 200000;
update patient_patient p set origin_village_id=p2.origin_village_id, origin_area_id=p2.origin_area_id from patient_patient2 p2
where p.id=p2.id and p.origin_area_id is null and p.id >=200000 and p.id < 300000;
update patient_patient p set origin_village_id=p2.origin_village_id, origin_area_id=p2.origin_area_id from patient_patient2 p2
where p.id=p2.id and p.origin_area_id is null and p.id >=300000 and p.id < 400000;
update patient_patient p set origin_village_id=p2.origin_village_id, origin_area_id=p2.origin_area_id from patient_patient2 p2
where p.id=p2.id and p.origin_area_id is null and p.id >=400000 and p.id < 500000;
update patient_patient p set origin_village_id=p2.origin_village_id, origin_area_id=p2.origin_area_id from patient_patient2 p2
where p.id=p2.id and p.origin_area_id is null and p.id >=500000 and p.id < 700000; -- lots of blanks here
update patient_patient p set origin_village_id=p2.origin_village_id, origin_area_id=p2.origin_area_id from patient_patient2 p2
where p.id=p2.id and p.origin_area_id is null and p.id >=700000 and p.id < 900000;
update patient_patient p set origin_village_id=p2.origin_village_id, origin_area_id=p2.origin_area_id from patient_patient2 p2
where p.id=p2.id and p.origin_area_id is null and p.id >=900000 and p.id < 1300000;
update patient_patient p set origin_village_id=p2.origin_village_id, origin_area_id=p2.origin_area_id from patient_patient2 p2
where p.id=p2.id and p.origin_area_id is null and p.id >=1300000 and p.id < 1400000;
update patient_patient p set origin_village_id=p2.origin_village_id, origin_area_id=p2.origin_area_id from patient_patient2 p2
where p.id=p2.id and p.origin_area_id is null and p.id >=1400000 and p.id < 1700000;
update patient_patient p set origin_village_id=p2.origin_village_id, origin_area_id=p2.origin_area_id from patient_patient2 p2
where p.id=p2.id and p.origin_area_id is null and p.id >=1700000 and p.id < 1800000;
update patient_patient p set origin_village_id=p2.origin_village_id, origin_area_id=p2.origin_area_id from patient_patient2 p2
where p.id=p2.id and p.origin_area_id is null and p.id >=1800000 and p.id < 1900000;
update patient_patient p set origin_village_id=p2.origin_village_id, origin_area_id=p2.origin_area_id from patient_patient2 p2
where p.id=p2.id and p.origin_area_id is null and p.id >=1900000 and p.id < 2000000;
update patient_patient p set origin_village_id=p2.origin_village_id, origin_area_id=p2.origin_area_id from patient_patient2 p2
where p.id=p2.id and p.origin_area_id is null and p.id >=2000000