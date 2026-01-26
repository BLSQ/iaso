from django.urls import path

from .views import (
    debug,
    delete_all_instances_and_entities,
    delete_beneficiaries_analytics,
    show_missing_entities_in_analytics,
)


urlpatterns = [
    path("debug/<int:id>/", debug, name="wfp_debug"),
    path("delete_beneficiaries_analytics/", delete_beneficiaries_analytics, name="delete_beneficiaries_analytics"),
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
