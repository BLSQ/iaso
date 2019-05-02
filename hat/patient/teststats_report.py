from hat.api.export_utils import generate_xlsx

columns_village = [
    {"title": "FOYER", "width": 15},
    {"title": "ZSR", "width": 15},
    {"title": "AS / CS", "width": 15},
    {"title": "VILLAGE/LOCALITE", "width": 20},
    {"title": "PTR", "width": 8},
    {"title": "PTE TOTAL", "width": 10},
    {"title": "PTE CATT", "width": 10},
    {"title": "PTE TDR", "width": 10},
    {"title": "TP", "width": 7, "format": "percent"},
    {"title": "CATT+", "width": 7},
    {"title": "TDR+", "width": 7},
    {"title": "NC", "width": 7},
    {"title": "ST1", "width": 7},
    {"title": "ST2", "width": 7},
    {"title": "INC", "width": 7},
    {"title": "TI", "width": 7, "format": "percent"},
]


def get_village_row(row, row_num, **kwargs):
    return [
        row["village__AS__ZS__name"],  # Foyer ?
        row["village__AS__ZS__name"],
        row["village__AS__name"],
        row["village__name"],
        row["village__population"],
        row["screening_count"],
        row["catt_count"],
        row["rdt_count"],
        f"=F{row_num}/E{row_num}",
        row["positive_catt_count"],
        row["positive_rdt_count"],
        row["positive_confirmation_test_count"],
        row["pl_count_stage1"],
        row["pl_count_stage2"],
        0,  # INC ?
        f"=L{row_num}/F{row_num}",
    ]


columns_date = [
    {"title": "Date", "width": 10},
    {"title": "Tests"},
    {"title": "CATT"},
    {"title": "RDT", "width": 4},
    {"title": "PG", "width": 4},
    {"title": "CTCWOO", "width": 7},
    {"title": "MAECT", "width": 6},
    {"title": "PL", "width": 4},
    {"title": "Population\ntotale"},
    {"title": "Tests de\nconfirmation", "width": 10},
    {"title": "CATT positifs"},
    {"title": "RDT positifs"},
    {"title": "Tests de\ndépistage positifs", "width": 10},
    {"title": "PL stade 1"},
    {"title": "PL stade 2"},
    {"title": "Confirmations\npositives", "width": 10},
    {"title": "PG positifs"},
    {"title": "CTCWOO positifs"},
    {"title": "MAECT positifs"},
    {"title": "PL positifs"},
]


def get_month_row(row, **kwargs):
    return [
        str(row["date"])[:10],
        row["test_count"],
        row["catt_count"],
        row["rdt_count"],
        row["pg_count"],
        row["ctcwoo_count"],
        row["maect_count"],
        row["pl_count"],
        row["total_population"],
        row["confirmation_count"],
        row["positive_catt_count"],
        row["positive_rdt_count"],
        row["positive_screening_test_count"],
        row["pl_count_stage1"],
        row["pl_count_stage2"],
        row["positive_confirmation_test_count"],
        row["pg_count_positive"],
        row["ctcwoo_count_positive"],
        row["maect_count_positive"],
        row["pl_count_positive"],
    ]


columns_villageday = [
    {"title": "Nom\nVillage", "width": 15},
    {"title": "Id\nVillage", "width": 10},
    {"title": "Coordonnées\nVillage", "width": 18},
    {"title": "Date", "width": 10},
    {"title": "Tests"},
    {"title": "CATT"},
    {"title": "RDT", "width": 4},
    {"title": "PG", "width": 4},
    {"title": "CTCWOO", "width": 7},
    {"title": "MAECT", "width": 6},
    {"title": "PL", "width": 4},
    {"title": "Population\ntotale", "width": 10},
    {"title": "Tests de\nconfirmation", "width": 11},
]


def get_villageday_row(row, **kwargs):
    return [
               row["village__name"],
               row["village__id"],
               f"{row['village__latitude']} {row['village__longitude']}" if row["village__latitude"] else "",
               str(row["date"])[:10],
               row["test_count"],
               row["catt_count"],
               row["rdt_count"],
               row["pg_count"],
               row["ctcwoo_count"],
               row["maect_count"],
               row["pl_count"],
               row["total_population"],
               row["confirmation_count"],
           ]


def generate_report(report_type, grouped_queryset, total_queryset):
    if report_type == "village":
        return generate_xlsx(
            [
                'Rapport Village',
            ], [
                columns_village,
            ], [
                grouped_queryset,
            ], [
                get_village_row,
            ],
        )
    elif report_type == "month":
        return generate_xlsx(
            [
                'Rapport par mois',
            ], [
                columns_date,
            ], [
                grouped_queryset,
            ], [
                get_month_row,
            ],
        )
    elif report_type == "year":
        return generate_xlsx(
            [
                'Rapport par année',
            ], [
                columns_date,
            ], [
                grouped_queryset,
            ], [
                get_month_row,
            ],
        )
    elif report_type == "villageday":
        return generate_xlsx(
            [
                'Rapport village jour',
            ], [
                columns_villageday,
            ], [
                grouped_queryset,
            ], [
                get_villageday_row,
            ],
        )
    else:
        return None
