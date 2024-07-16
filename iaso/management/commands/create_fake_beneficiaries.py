import csv
import os
from random import randint
import uuid

from django.core.management.base import BaseCommand

from iaso.models import Account, Entity, EntityType, Form, Instance, Project, OrgUnit

csv_file_path = os.path.join(os.path.dirname(__file__), "persons.csv")
reader = csv.DictReader(open(csv_file_path))
persons = [line for line in reader]
persons_max = len(persons) - 1


class Command(BaseCommand):
    help = "Create a ton of fake beneficiaries"

    def add_arguments(self, parser):
        parser.add_argument("amount", type=int, help="The amount of fake entities to create")

    def handle(self, *args, **options):
        amount = options["amount"]

        account = Account.objects.first()
        project = Project.objects.first()
        form = Form.objects.filter(form_id="trypelim_registration").first()
        form_version = form.latest_version
        entity_type = EntityType.objects.first()

        print(f"Creating {amount} fake beneficiaries")
        for i in range(amount):
            fake_json = fake_person_attributes(form_version.version_id)
            form_instance = Instance.objects.create(
                uuid=uuid.uuid4(),
                form=form,
                form_version=form_version,
                org_unit=get_random_village(),
                json=fake_json,
                project=project,
                file="fake.xml",
                file_name="fake.xml",
            )
            entity = Entity.objects.create(
                name=fake_json["_full_name"],
                entity_type=entity_type,
                attributes=form_instance,
                account=account,
            )
            form_instance.entity = entity
            form_instance.save()
            print(f"\tCreated {fake_json['_full_name']}")


def get_random_village():
    query = OrgUnit.objects.filter(validation_status=OrgUnit.VALIDATION_VALID)
    count = query.count()
    random_index = randint(0, count - 1)

    return query[random_index : random_index + 1].get()


def fake_person_attributes(version):
    lastname = persons[randint(0, persons_max)]["lastname"]
    person = persons[randint(0, persons_max)]

    return {
        "first_name": person["firstname"],
        "last_name": lastname,
        "post_name": "",
        "_full_name": person["firstname"] + " " + lastname,
        "gender": person["gender"][0].upper(),
        "stade": "0",
        "birth_year": "2016-01-01",
        "_version": version,
        "instanceID": f"uuid:{uuid.uuid4()}",
        "birth_year_is_known": "yes",
        "clinical_signs_done": "0",
        "confirmation_pg_done": "0",
        "confirmation_pg_not_done": "0",
        "first_test_done": "0",
        "has_clinical_signs": "0",
        "infection_location": "0",
        "infection_type_selected": "0",
        "is_confirmed_positive": str(randint(0, 1)),
        "is_confirmed_negative": "0",
        "is_deceased": "0",
        "is_not_done": "0",
        "is_qpcr_positive": "0",
        "is_trypanolyse_positive": "0",
        "is_suspect": str(randint(0, 1)),
        "is_treatment_ongoing": "0",
        "manque_confirmation_done": "0",
        "mother_last_name": "Maman",
        "number_of_previous_treatments": "0",
        "phone_number": "089",
        "pl_stad_globules_blanc": "0",
        "pl_stad_is_done": "0",
        "pl_stad_is_not_done": "0",
        "pl_stad_presence_trypanosome": "0",
        "plresearch_not_done": "0",
        "presence_trypanosomes": "0",
        "profession_type": "diamond_searcher",
        "repeat_case_treated_type": "uncertain",
        "repeat_case_type": "yes",
        "st_fixe_referral": "self_presented",
        "st_fixe_registration_date": "2024-02-29",
        "st_fixe_residency_country": "République Démocratique du Congo",
        "st_fixe_traveller_village_id": "66300",
        "st_fixe_traveller_village_label": "",
        "st_fixe_traveller_village_name": "Quartier Bufua",
        "st_fixe_traveller_village_note": "",
        "test_ctcwoo_done": "0",
        "test_ctcwoo_not_done": "0",
        "test_maect_done": "0",
        "test_maect_not_done": "0",
        "trypelim_profile": "FIXED_STRUCTURE",
        "white_cells_count": "0",
        "qr_code": f"Registre {str(randint(1, 1000000))}_Page 06_Ticket N°085",
    }
