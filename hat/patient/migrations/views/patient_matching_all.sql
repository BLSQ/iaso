create or replace view patient_matching_all as
select patient1_id, patient2_id, similarity_score, algorithm
from patient_matching_namesimilarity