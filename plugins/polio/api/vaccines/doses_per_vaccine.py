from rest_framework import permissions
from rest_framework.mixins import ListModelMixin
from rest_framework.viewsets import GenericViewSet

from iaso.api.common import HasPermission
from iaso.api.config import ConfigSerializer
from iaso.models.json_config import Config
from plugins.polio.models.base import DOSES_PER_VIAL_CONFIG_SLUG
from plugins.polio.permissions import (
    POLIO_CONFIG_PERMISSION,
    POLIO_PERMISSION,
    POLIO_VACCINE_STOCK_EARMARKS_ADMIN_PERMISSION,
    POLIO_VACCINE_STOCK_EARMARKS_NONADMIN_PERMISSION,
    POLIO_VACCINE_STOCK_EARMARKS_READ_ONLY_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
    POLIO_VACCINE_SUPPLY_CHAIN_READ_ONLY_PERMISSION,
    POLIO_VACCINE_SUPPLY_CHAIN_READ_PERMISSION,
    POLIO_VACCINE_SUPPLY_CHAIN_WRITE_PERMISSION,
)


class DosesPerVialViewset(ListModelMixin, GenericViewSet):
    """
    Super custom endpoint to send the possible vaccine presentation (doses per vial) to the front end

    A config with a slug == DOSES_PER_VIAL_CONFIG_SLUG  is required (create it via the django admin)

    The config data should have 1 key per available vaccine, and the value should be a list of positive integers, eg: 'bOPV':[10,20]

    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(
            POLIO_CONFIG_PERMISSION,
            POLIO_PERMISSION,
            POLIO_VACCINE_SUPPLY_CHAIN_READ_ONLY_PERMISSION,
            POLIO_VACCINE_SUPPLY_CHAIN_READ_PERMISSION,
            POLIO_VACCINE_SUPPLY_CHAIN_WRITE_PERMISSION,
            POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
            POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
            POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
            POLIO_VACCINE_STOCK_EARMARKS_READ_ONLY_PERMISSION,
            POLIO_VACCINE_STOCK_EARMARKS_NONADMIN_PERMISSION,
            POLIO_VACCINE_STOCK_EARMARKS_ADMIN_PERMISSION,
        ),
    ]
    serializer_class = ConfigSerializer

    def get_queryset(self):
        return Config.objects.filter(slug=DOSES_PER_VIAL_CONFIG_SLUG)
