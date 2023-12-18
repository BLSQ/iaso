import csv
from random import randint, random

reader = csv.DictReader(open("./data/persons.csv"))
persons = [line for line in reader]
persons_max = len(persons) - 1


def fake_person():
    lastname = persons[randint(0, persons_max)]["lastname"]
    person = persons[randint(0, persons_max)]

    return {
        "lastname": lastname,
        "firstname": person["firstname"],
        "gender": person["gender"],
        "age_in_months": randint(0, 50),
    }
