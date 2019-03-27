from hat.api.export_utils import generate_xlsx

columns_month = [
    "FOYER", "ZSR", "AS / CS", "VILLAGE/LOCALITE", "PTR", "PTE TOTAL", 	"PTE CATT", "PTE TDR", "TP", "CATT+", "TDR+",
    "NC", "ST1", "ST2", "INC", "TI"
]
columns_month_sizes = [10, 10, 10, 20, 10, 10, 10, 10, 10, 10, 10, 10,
                       10, 10, 10, 10]


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
        column_sizes=[
            columns_month_sizes,
        ]
    )
