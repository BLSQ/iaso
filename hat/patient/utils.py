from hat.cases.models import testResultString


columns = ['Identifiant', 'Nom', 'Postnom', 'Prénom', 'Sexe', 'Age', 'Nom de la mère', 'Province', 'Zone',
           'Aire', 'Village', 'Décès', 'ID Tests', 'ID traitements']

columns_tests = ['Identifiant', 'ID Patient', 'Type', 'Index', 'Résultats', 'Equipe',
                    'Village', 'Création', 'Modification', 'Image', 'Vidéo', 'Session',  'PL  Gb/mm³',
                    'LCR', 'Trypanosome', 'Albumine', 'Commentaires']

columns_treatments = ['Identifiant', 'ID Patient', 'Index', 'Médicament', 'Date de début', 'Date de fin',
                        "Cause de l'incomplétude", 'Evenements indésirables', 'Complet', 'Succés', 'Perdu', 'ID Tablette', 'Utilisateur tablette', 'Equipe Tablette']

def get_row(patient, request = None):
    pdict = patient.as_dict()
    dead = "--"
    if (pdict["dead"]):
        dead = patient.death_date.strftime("%d-%m-%Y")
    treatments = ""
    treatmentsList = patient.treatment_set.all()
    if not treatmentsList:
        treatments = "--"
    else:
        for treatment in treatmentsList:
            if treatments == "":
                treatments = str(treatment.id)
            else:
                treatments = treatments + ", " + str(treatment.id)
    tests = "--"
    for caseItem in patient.case_set.all():
        for test in caseItem.test_set.all():
            if tests == "--":
                tests = str(test.id)
            else:
                tests = tests + ", " + str(test.id)

    return [
        pdict["id"],
        pdict["last_name"],
        pdict["post_name"],
        pdict["first_name"],
        pdict["sex"],
        pdict["age"],
        pdict["mothers_surname"],
        pdict["province"],
        pdict["ZS"],
        pdict["AS"],
        pdict["village"],
        dead,
        tests,
        treatments,
    ]

def get_row_tests(test, request = None):
    caseItem = test.form
    return [
        test.id,
        test.form.normalized_patient.id,
        test.type,
        test.index if test.index else '/',
        testResultString(test.result),
        test.team.name if test.team else '/',
        test.village.name if test.village else '/',
        test.created_at.strftime("%Y-%m-%d %H:%M"),
        test.updated_at.strftime("%Y-%m-%d %H:%M"),
        request.build_absolute_uri(test.image.image.url) if test.image else '/',
        request.build_absolute_uri(test.video.video.url) if test.video else '/',
        test.form.test_catt_session_type if (test.form.test_catt_session_type and test.type == 'CATT') else '/',
        test.form.test_pl_gb_mm3 if (test.form.test_pl_gb_mm3 and test.type == 'PL') else '/',
        test.form.test_pl_lcr if (test.form.test_pl_lcr and test.type == 'PL') else '/',
        test.form.test_pl_trypanosome if (test.form.test_pl_trypanosome and test.type == 'PL') else '/',
        test.form.test_pl_albumine if (test.form.test_pl_albumine and test.type == 'PL') else '/',
        test.form.test_pl_comments if (test.form.test_pl_comments and test.type == 'PL') else '/'
    ]

def get_row_treatments(treatment, request = None):
    tdict = treatment.as_dict()
    return [
        tdict["id"],
        tdict["patient_id"],
        tdict["index"],
        tdict["medicine"],
        treatment.start_date.strftime("%d-%m-%Y"),
        treatment.end_date.strftime("%d-%m-%Y") if treatment.end_date else '/',
        str(treatment.incomplete_reasons).strip("[]'"),  # TODO: add translations
        str(treatment.issues).strip("[]'"),  # TODO: add translations
        'Oui' if tdict["complete"] == True else 'Non' if tdict["complete"] == False else "Inconnu",
        'Oui' if tdict["success"] == True else 'Non' if tdict["complete"] == False else "Inconnu",
        'Oui' if tdict["lost"] == True else 'Non' if tdict["complete"] == False else "Inconnu",
        treatment.device.device_id,
        treatment.device.last_user.username if treatment.device.last_user else '/',
        treatment.device.last_user.profile.team.name if (
            treatment.device.last_user and treatment.device.last_user.profile.team) else '/',
    ]
