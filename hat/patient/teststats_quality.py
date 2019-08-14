from hat.api.export_utils import generate_xlsx


def getPourcentage(total, value):
    if total == 0 or value == 0:
        return 0
    return float("{0:.2f}".format(100 / (total / value)))


def getCountCell(total, value):
    cell = str(total)
    pourcentage = getPourcentage(total, value)
    if not pourcentage == 0 and not total == 0:
        cell = cell + " (" + str(pourcentage) + "% positifs)"
    if pourcentage == 0 and not total == 0:
        cell = cell + " (0 positif)"
    return cell


columns_screener = [
    {"title": "Nom", "width": 20},
    {"title": "Coordination", "width": 15},
    {"title": "Tests de dépistage", "width": 15},
    {"title": "CATT", "width": 15},
    {"title": "RDT", "width": 15},
    {"title": "CATT +", "width": 15},
    {"title": "CATT -", "width": 15},
    {"title": "RDT +", "width": 15},
    {"title": "RDT -", "width": 15},
    {"title": "Total Images", "width": 15},
]


def get_screener_row(row, row_num, **kwargs):
    name = row["tester__user__first_name"] + " " + row["tester__user__last_name"]
    return [
        name,
        row["tester__team__coordination__name"],
        getCountCell(row["screening_count"], row["positive_screening_test_count"]),
        getCountCell(row["catt_count"], row["positive_catt_count"]),
        getCountCell(row["rdt_count"], row["positive_rdt_count"]),
        row["positive_catt_count"],
        row["negative_catt_count"],
        row["positive_rdt_count"],
        row["negative_rdt_count"],
        row["rdt_test_pictures"] + row["catt_test_pictures"]
    ]


columns_confirmer = [
    {"title": "Nom", "width": 20},
    {"title": "Coordination", "width": 15},
    {"title": "Tests de confirmation", "width": 15},
    {"title": "PG", "width": 15},
    {"title": "MAECT", "width": 15},
    {"title": "PL", "width": 15},
    {"title": "Stage 1", "width": 15},
    {"title": "Stage 2", "width": 15},
    {"title": "Vidéos", "width": 15},
]


def get_confirmer_row(row, row_num, **kwargs):
    name = row["tester__user__first_name"] + " " + row["tester__user__last_name"]
    return [
        name,
        row["tester__team__coordination__name"],
        getCountCell(row["confirmation_count"], row["positive_confirmation_test_count"]),
        row["pg_count"],
        row["maect_count"],
        row["pl_count"],
        row["pl_count_stage1"],
        row["pl_count_stage2"],
        row["confirmation_video_count"],
    ]


columns_screenerqa = [
    {"title": "Nom", "width": 20},
    {"title": "Coordination", "width": 15},
    {"title": "Total", "width": 15},
    {"title": "Vérifiés", "width": 15},
    {"title": "Concordant", "width": 15},
    {"title": "A problème", "width": 15},
    {"title": "Illisible", "width": 15},
    {"title": "Invalide", "width": 15},
    {"title": "Non concordants", "width": 15},
]


def get_screenerqa_row(row, row_num, **kwargs):
    name = row["tester__user__first_name"] + " " + row["tester__user__last_name"]
    total_invalid = row["checked_unreadable"] + row["checked_invalid"] + row["checked_mismatch"]
    return [
        name,
        row["tester__team__coordination__name"],
        row["test_pictures"],
        str(row["checked"]) + " (" + str(getPourcentage(row["test_pictures"], row["checked"])) + "%)",
        str(row["checked_ok"]) + " (" + str(getPourcentage(row["checked"], row["checked_ok"])) + "%)",
        str(total_invalid) + " (" + str(getPourcentage(row["checked"], total_invalid)) + "%)",
        str(row["checked_unreadable"]) + " (" + str(getPourcentage(row["checked_ko"], row["checked_unreadable"])) + "%)",
        str(row["checked_invalid"]) + " (" + str(getPourcentage(row["checked_ko"], row["checked_invalid"])) + "%)",
        str(row["checked_mismatch"]) + " (" + str(getPourcentage(row["checked_ko"], row["checked_mismatch"])) + "%)",
    ]


columns_confirmerqa = [
    {"title": "Nom", "width": 20},
    {"title": "Coordination", "width": 15},
    {"title": "Vidéos", "width": 15},
    {"title": "Vérifiés", "width": 15},
    {"title": "Concordant", "width": 15},
    {"title": "Non concordant", "width": 15},
    {"title": "Pas net", "width": 15},
    {"title": "Mauvais endroit", "width": 15},
]


def get_confirmerqa_row(row, row_num, **kwargs):
    name = row["tester__user__first_name"] + " " + row["tester__user__last_name"]
    return [
        name,
        row["tester__team__coordination__name"],
        getCountCell(row["confirmation_video_count"], row["confirmation_positive_video_count"]),
        str(row["checked"]) + " (" + str(getPourcentage(row["confirmation_video_count"], row["checked"])) + "%)",
        str(row["checked_ko"]) + " (" + str(getPourcentage(row["checked"], row["checked_ko"])) + "%)",
        str(row["checked"] - row["is_clear"]) + " (" + str(getPourcentage(row["checked"], row["checked"] -
                                                                          row["is_clear"])) + "%)",
        str(row["checked"] - row["is_good_place"]) + " (" + str(getPourcentage(row["checked"], row["checked"] -
                                                                               row["is_good_place"])) + "%)",
    ]


columns_screenercentralqa = [
    {"title": "Nom", "width": 20},
    {"title": "Coordination", "width": 15},
    {"title": "Images", "width": 15},
    {"title": "Vérifiés", "width": 15},
    {"title": " = coord.", "width": 15},
    {"title": " = terrain", "width": 15},
    {"title": "<> coord.", "width": 15},
    {"title": "<> terrain", "width": 15},
]


def get_screenercentralqa_row(row, row_num, **kwargs):
    name = row["tester__user__first_name"] + " " + row["tester__user__last_name"]
    return [
        name,
        row["tester__team__coordination__name"],
        row["test_pictures"],
        str(row["checked_ok_central"]) + " (" + str(getPourcentage(row["test_pictures"], row["checked"])) + "%)",
        str(row["checked_ok_central"]) + " (" + str(getPourcentage(row["checked"], row["checked_ok_central"])) + "%)",
        str(row["checked_ok"]) + " (" + str(getPourcentage(row["checked"], row["checked_ok"])) + "%)",
        str(row["checked_ko_central"]) + " (" + str(getPourcentage(row["checked"], row["checked_ko_central"])) + "%)",
        str(row["checked_ko"]) + " (" + str(getPourcentage(row["checked"], row["checked_ko"])) + "%)",
    ]


columns_confirmercentralqa = [
    {"title": "Nom", "width": 20},
    {"title": "Coordination", "width": 15},
    {"title": "Videos", "width": 15},
    {"title": "Vérifiés", "width": 15},
    {"title": " = coord.", "width": 15},
    {"title": " = terrain", "width": 15},
    {"title": "<> coord.", "width": 15},
    {"title": "<> terrain", "width": 15},
]


def get_confirmercentralqa_row(row, row_num, **kwargs):
    name = row["tester__user__first_name"] + " " + row["tester__user__last_name"]
    return [
        name,
        row["tester__team__coordination__name"],
        row["confirmation_video_count"],
        row["checked"],
        str(row["checked_ok_central"]) + " (" + str(getPourcentage(row["checked"], row["checked_ok_central"])) + "%)",
        str(row["checked_ok"]) + " (" + str(getPourcentage(row["checked"], row["checked_ok"])) + "%)",
        str(row["checked_ko_central"]) + " (" + str(getPourcentage(row["checked"], row["checked_ko_central"])) + "%)",
        str(row["checked_mismatch"]) + " (" + str(getPourcentage(row["checked"], row["checked_mismatch"])) + "%)",
    ]


def generate_stats_xlsx(report_type, queryset):
    if report_type == "screener":
        return generate_xlsx(
            [
                'Stats dépisteur',
            ], [
                columns_screener,
            ], [
                queryset,
            ], [
                get_screener_row,
            ],
        )
    if report_type == "confirmer":
        return generate_xlsx(
            [
                'Stats confirmateur',
            ], [
                columns_confirmer,
            ], [
                queryset,
            ], [
                get_confirmer_row,
            ],
        )
    if report_type == "screenerqa":
        return generate_xlsx(
            [
                'Stats dépisteur - coordination',
            ], [
                columns_screenerqa,
            ], [
                queryset,
            ], [
                get_screenerqa_row,
            ],
        )
    if report_type == "confirmerqa":
        return generate_xlsx(
            [
                'Stats confirmateur - coordination',
            ], [
                columns_confirmerqa,
            ], [
                queryset,
            ], [
                get_confirmerqa_row,
            ],
        )
    if report_type == "screenercentralqa":
        return generate_xlsx(
            [
                'Stats dépisteur - central',
            ], [
                columns_screenercentralqa,
            ], [
                queryset,
            ], [
                get_screenercentralqa_row,
            ],
        )
    if report_type == "confirmercentralqa":
        return generate_xlsx(
            [
                'Stats confirmateur - central',
            ], [
                columns_confirmercentralqa,
            ], [
                queryset,
            ], [
                get_confirmercentralqa_row,
            ],
        )
    else:
        return None
