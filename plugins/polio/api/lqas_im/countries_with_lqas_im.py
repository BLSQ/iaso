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
        category = self.request.query_params.get("category")
        # For lqas, we filter out the countries with no datastore
        if category == "lqas":
            configs = Config.objects.filter(slug=f"{category}-config").first().content
            country_ids = []
            for config in configs:
                if JsonDataStore.objects.filter(slug=f"{category}_{config['country_id']}").exists():
                    country_ids.append(config["country_id"])
                else:
                    continue

            return (
                OrgUnit.objects.filter_for_user_and_app_id(self.request.user, self.request.query_params.get("app_id"))
                .filter(validation_status="VALID")
                .filter(org_unit_type__category="COUNTRY")
                .filter(id__in=country_ids)
            )
        # For IM we send all countries. We'll align with LQAS when the datastores are configured for IM as well
        else:
            return (
                OrgUnit.objects.filter_for_user_and_app_id(self.request.user, self.request.query_params.get("app_id"))
                .filter(validation_status="VALID")
                .filter(org_unit_type__category="COUNTRY")
            )
