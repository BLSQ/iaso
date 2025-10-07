import tempfile

from iaso.exports import parquet
from iaso.models import MONTH, Form, Instance
from iaso.test import TestCase

from .parquet_helper import get_columns_from_parquet


STANDARD_COLUMNS = [
    ["iaso_subm_id", "INTEGER"],
    ["iaso_subm_form_id", "INTEGER"],
    ["iaso_subm_period", "VARCHAR"],
    ["iaso_subm_uuid", "VARCHAR"],
    ["iaso_subm_org_unit_id", "INTEGER"],
    ["iaso_subm_org_unit_name", "VARCHAR"],
    ["iaso_subm_org_unit_source_ref", "VARCHAR"],
    ["iaso_subm_entity_id", "INTEGER"],
    ["iaso_subm_created_at", "TIMESTAMP WITH TIME ZONE"],
    ["iaso_subm_source_created_at", "TIMESTAMP WITH TIME ZONE"],
    ["iaso_subm_created_by_username", "VARCHAR"],
    ["iaso_subm_created_by_id", "INTEGER"],
    ["iaso_subm_updated_at", "TIMESTAMP WITH TIME ZONE"],
    ["iaso_subm_source_updated_at", "TIMESTAMP WITH TIME ZONE"],
    ["iaso_subm_last_modified_by_username", "VARCHAR"],
    ["iaso_subm_last_modified_by_id", "INTEGER"],
    ["iaso_subm_deleted", "BOOLEAN"],
    ["iaso_subm_export_id", "VARCHAR"],
    ["iaso_subm_correlation_id", "BIGINT"],
    ["iaso_subm_is_reference", "BOOLEAN"],
    ["iaso_subm_form_version_id", "VARCHAR"],
    ["iaso_subm_longitude", "DOUBLE"],
    ["iaso_subm_latitude", "DOUBLE"],
    ["iaso_subm_altitude", "DOUBLE"],
    ["iaso_subm_accuracy", "DECIMAL(7,2)"],
]


class SubmissionsExportTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.form_to_export = Form.objects.create(
            name="Form to export",
            period_type=MONTH,
            single_per_period=True,
            possible_fields=[{"name": "answer_A"}, {"name": "answer_B"}],
        )
        cls.maxDiff = None

    def test_expected_columns_all_fields_even_if_no_records(self):
        qs, mapping = parquet.build_submissions_queryset(Instance.objects, self.form_to_export.id)

        with tempfile.NamedTemporaryFile(suffix=".parquet") as tmpfile:
            parquet.export_django_query_to_parquet_via_duckdb(qs, tmpfile.name, mapping)
            actual_columns = get_columns_from_parquet(tmpfile)

        expected = [
            *STANDARD_COLUMNS,
            ["answer_A", "VARCHAR"],
            ["answer_B", "VARCHAR"],
        ]
        self.assertEqual(actual_columns, expected)

    def test_expected_columns_all_fields_even_if_some_answers_collide_with_model_field(
        self,
    ):
        self.form_to_export.possible_fields = [
            {"name": "answer_A"},
            {"name": "id"},
            {"name": "created_at"},
        ]
        self.form_to_export.save()

        qs, mapping = parquet.build_submissions_queryset(Instance.objects, self.form_to_export.id)

        with tempfile.NamedTemporaryFile(suffix=".parquet") as tmpfile:
            parquet.export_django_query_to_parquet_via_duckdb(qs, tmpfile.name, mapping)
            actual_columns = get_columns_from_parquet(tmpfile)

        expected = [
            *STANDARD_COLUMNS,
            ["answer_A", "VARCHAR"],
            ["id", "VARCHAR"],
            ["created_at", "VARCHAR"],
        ]
        self.assertEqual(actual_columns, expected)

    def test_expected_columns_all_fields_even_if_some_answers_collide_with_same_name_case(
        self,
    ):
        self.form_to_export.possible_fields = [
            {
                "name": "Prise_en_charge_des_survivantes_de_violences_sexuelles_Au_cours_de_2_dernieres_annees",
                "type": "integer",
                "label": "Au cours de 2 dernieres annees",
            },
            {
                "name": "Prise_en_charge_des_survivantes_de_violences_sexuelles_au_cours_de_annee_de_rapportage",
                "type": "integer",
                "label": "Au cours de l'annee de rapportage",
            },
        ]

        self.form_to_export.save()

        qs, mapping = parquet.build_submissions_queryset(Instance.objects, self.form_to_export.id)

        with tempfile.NamedTemporaryFile(suffix=".parquet") as tmpfile:
            parquet.export_django_query_to_parquet_via_duckdb(qs, tmpfile.name, mapping)
            actual_columns = get_columns_from_parquet(tmpfile)

        expected = [
            *STANDARD_COLUMNS,
            [
                "Prise_en_charge_des_survivantes_de_violences_sexuelles_Au_cours_de_2_dernieres_annees",
                "VARCHAR",
            ],
            [
                "Prise_en_charge_des_survivantes_de_violences_sexuelles_au_cours_de_annee_de_rapportage",
                "VARCHAR",
            ],
        ]
        self.assertEqual(actual_columns, expected)
