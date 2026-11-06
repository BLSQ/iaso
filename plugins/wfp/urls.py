from django.urls import path

from .views import (
    beneficiaries,
    beneficiaries_coda_export,
    beneficiaries_raw_export,
    beneficiary_data,
    debug,
    debug_summary,
    delete_all_instances_and_entities,
    delete_beneficiaries_analytics,
    show_missing_entities_in_analytics,
    submission_fields,
)


urlpatterns = [
    path("beneficiaries/", beneficiaries, name="wfp_beneficiaries"),
    path("beneficiaries/export/coda/", beneficiaries_coda_export, name="wfp_beneficiaries_coda_export"),
    path("beneficiaries/export/raw/", beneficiaries_raw_export, name="wfp_beneficiaries_raw_export"),
    path("beneficiaries/<int:entity_id>/data/", beneficiary_data, name="wfp_beneficiary_data"),
    path("submissions/<int:instance_id>/fields/", submission_fields, name="wfp_submission_fields"),
    path("debug/<int:id>/", debug, name="wfp_debug"),
    path("debug_summary/", debug_summary, name="wfp_debug_summary"),
    path(
        "delete_beneficiaries_analytics/<int:account_id>/",
        delete_beneficiaries_analytics,
        name="delete_beneficiaries_analytics",
    ),
    path(
        "delete_all_instances_and_entities/",
        delete_all_instances_and_entities,
        name="delete_all_instances_and_entities",
    ),
    path(
        "show_missing_entities/<int:account_id>/<int:entity_type>/",
        show_missing_entities_in_analytics,
        name="show_missing_entities",
    ),
]
