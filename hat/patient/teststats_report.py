from hat.api.export_utils import generate_xlsx

columns_month = [
    {"title": "FOYER", "width": 15},
    {"title": "ZSR", "width": 15},
    {"title": "AS / CS", "width": 15},
    {"title": "VILLAGE/LOCALITE", "width": 20},
    {"title": "PTR", "width": 8},
    {"title": "PTE TOTAL", "width": 10},
    {"title": "PTE CATT", "width": 10},
    {"title": "PTE TDR", "width": 10},
    {"title": "TP", "width": 7},
    {"title": "CATT+", "width": 7},
    {"title": "TDR+", "width": 7},
    {"title": "NC", "width": 7},
    {"title": "ST1", "width": 7},
    {"title": "ST2", "width": 7},
    {"title": "INC", "width": 7},
    {"title": "TI", "width": 7},
]


def get_village_day_row(row, row_num, **kwargs):
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
        row["confirmation_count"],
        row["pl_count_stage1"],
        row["pl_count_stage2"],
        0,  # INC ?
        f"=L{row_num}/F{row_num}",
    ]


def generate_village_report(grouped_queryset, total_queryset):
    return generate_xlsx(
        [
            'Rapport Village',
        ], [
            columns_month,
        ], [
            grouped_queryset,
        ], [
            get_village_day_row,
        ],
    )
