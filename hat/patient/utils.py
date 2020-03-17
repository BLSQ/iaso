from hat.cases.models import testResultString

columns = [
    {"title": "Identifiant", "width": 10},
    {"title": "Nom", "width": 12},
    {"title": "Postnom", "width": 12},
    {"title": "Prénom", "width": 12},
    {"title": "Sexe", "width": 5},
    {"title": "Age", "width": 4},
    {"title": "Nom de la mère", "width": 12},
    {"title": "Province", "width": 10},
    {"title": "Zone", "width": 14},
    {"title": "Aire", "width": 14},
    {"title": "Village", "width": 14},
    {"title": "Décès", "width": 6},
    {"title": "ID Tests", "width": 14},
    {"title": "ID traitements", "width": 11},
]

columns_tests = [
    {"title": "Identifiant", "width": 10},
    {"title": "ID Patient", "width": 8},
    {"title": "Type", "width": 8},
    {"title": "Index", "width": 5},
    {"title": "Résultats", "width": 8},
    {"title": "Equipe", "width": 10},
    {"title": "Village", "width": 14},
    {"title": "Date du test", "width": 14},
    {"title": "Création", "width": 14},
    {"title": "Modification", "width": 14},
    {"title": "Image", "width": 6, "format": "link"},
    {"title": "Vidéo", "width": 6, "format": "link"},
    {"title": "Session", "width": 10},
    {"title": "PL  Gb/mm³", "width": 10},
    {"title": "LCR", "width": 3},
    {"title": "Trypanosome", "width": 11},
    {"title": "Albumine", "width": 8},
    {"title": "Commentaires", "width": 20},
    {"title": "Dépistage\nactif/passif", "width": 15},
]

columns_treatments = [
    {"title": "Identifiant", "width": 10},
    {"title": "ID Patient", "width": 8},
    {"title": "Index", "width": 5},
    {"title": "Médicament", "width": 12},
    {"title": "Date de début", "width": 10},
    {"title": "Date de fin", "width": 10},
    {"title": "Cause de l'incomplétude", "width": 20},
    {"title": "Evenements indésirables", "width": 20},
    {"title": "Complet", "width": 7},
    {"title": "Succès", "width": 7},
    {"title": "Perdu", "width": 7},
    {"title": "ID Tablette", "width": 15},
    {"title": "Utilisateur tablette", "width": 16},
    {"title": "Equipe Tablette", "width": 15},
]


def get_row(patient, anon=True, **kwargs):
    pdict = patient.as_dict(anonymous=anon)
    dead = "--"
    if pdict["dead"]:
        dead = patient.death_date.strftime("%d-%m-%Y")
    treatments_list = patient.treatment_ids
    if not patient.treatment_ids:
        treatments = "--"
    else:
        treatments = ", ".join([str(t) for t in treatments_list if t is not None])
    tests = patient.test_ids  # annotate ArrayAgg("case__test")
    if tests is None:
        tests = "--"
    else:
        tests = ", ".join([str(t) for t in tests if t is not None])

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


def get_row_tests(test, request=None, **kwargs):
    return [
        test.id,
        test.form.normalized_patient.id,
        test.type,
        test.index if test.index else "/",
        testResultString(test.result),
        test.team.name if test.team else "/",
        test.village.name if test.village else "/",
        test.date.strftime("%Y-%m-%d %H:%M") if test.date else None,
        test.created_at.strftime("%Y-%m-%d %H:%M"),
        test.updated_at.strftime("%Y-%m-%d %H:%M"),
        request.build_absolute_uri(test.image.image.url) if test.image else None,
        request.build_absolute_uri(test.video.video.url) if test.video else None,
        test.form.test_catt_session_type
        if (test.form.test_catt_session_type and test.type == "CATT")
        else "/",
        test.form.test_pl_gb_mm3
        if (test.form.test_pl_gb_mm3 and test.type == "PL")
        else "/",
        test.form.test_pl_lcr if (test.form.test_pl_lcr and test.type == "PL") else "/",
        test.form.test_pl_trypanosome
        if (test.form.test_pl_trypanosome and test.type == "PL")
        else "/",
        test.form.test_pl_albumine
        if (test.form.test_pl_albumine and test.type == "PL")
        else "/",
        test.form.test_pl_comments
        if (test.form.test_pl_comments and test.type == "PL")
        else "/",
        test.form.screening_type,
    ]


def get_row_treatments(treatment, **kwargs):
    tdict = treatment.as_dict()
    device = treatment.device
    return [
        tdict["id"],
        tdict["patient_id"],
        tdict["index"],
        tdict["medicine"],
        treatment.start_date.strftime("%d-%m-%Y"),
        treatment.end_date.strftime("%d-%m-%Y") if treatment.end_date else "/",
        str(treatment.incomplete_reasons).strip("[]'"),  # TODO: add translations
        str(treatment.issues).strip("[]'"),  # TODO: add translations
        "Oui"
        if tdict["complete"] is True
        else "Non"
        if tdict["complete"] is False
        else "Inconnu",
        "Oui"
        if tdict["success"] is True
        else "Non"
        if tdict["complete"] is False
        else "Inconnu",
        "Oui"
        if tdict["lost"] is True
        else "Non"
        if tdict["complete"] is False
        else "Inconnu",
        device.device_id if device else None,
        device.last_user.username if device and device.last_user else "/",
        device.last_user.profile.team.name
        if (
            device
            and device.last_user
            and hasattr(device.last_user, "profile")
            and device.last_user.profile.team
        )
        else "/",
    ]
