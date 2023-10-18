from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_yasg.utils import swagger_auto_schema
from rest_framework import filters, permissions

from iaso.api.common import ModelViewSet
from iaso.api.serializers import OrgUnitDropdownSerializer
from iaso.models import OrgUnit
from iaso.models.data_store import JsonDataStore
from plugins.polio.models import Config


@swagger_auto_schema(tags=["lqasimcountries"])
class CountriesWithLqasIMConfigViewSet(ModelViewSet):
    http_method_names = ["get"]
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    results_key = "results"
    serializer_class = OrgUnitDropdownSerializer
    ordering_fields = ["name", "id"]
    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,
    ]

    def get_queryset(self):
        return (
            OrgUnit.objects.filter_for_user_and_app_id(self.request.user, self.request.query_params.get("app_id"))
            .filter(validation_status="VALID")
            .filter(org_unit_type__category="COUNTRY")
        )
