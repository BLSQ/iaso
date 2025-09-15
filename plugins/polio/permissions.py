from dataclasses import dataclass

from django.db import models
from django.utils.translation import gettext_lazy as _

from iaso.modules import MODULE_POLIO_PROJECT
from iaso.permissions.base import IasoPermission


@dataclass
class PolioPermission(IasoPermission):
    """
    Represents a polio plugin permission.
    """

    def full_name(self) -> str:
        return f"polio.{self.name}"


# Groups displayed in the web interface
PERMISSION_GROUP_POLIO = "polio"

# Add here any new polio permission - it must start with the "POLIO_" prefix and end with "_PERMISSION"
POLIO_PERMISSION = PolioPermission(
    name="iaso_polio", label=_("Polio"), module=MODULE_POLIO_PROJECT, group=PERMISSION_GROUP_POLIO
)
POLIO_BUDGET_PERMISSION = PolioPermission(
    name="iaso_polio_budget",
    label=_("Budget Polio"),
    module=MODULE_POLIO_PROJECT,
    group=PERMISSION_GROUP_POLIO,
    category="iaso_polio_budget_permissions",
    type_in_category="read",
    order_in_category=1,
)
POLIO_BUDGET_ADMIN_PERMISSION = PolioPermission(
    name="iaso_polio_budget_admin",
    label=_("Budget Polio Admin"),
    module=MODULE_POLIO_PROJECT,
    group=PERMISSION_GROUP_POLIO,
    category="iaso_polio_budget_permissions",
    type_in_category="write",
    order_in_category=2,
)
POLIO_CONFIG_PERMISSION = PolioPermission(
    name="iaso_polio_config", label=_("Polio config"), module=MODULE_POLIO_PROJECT, group=PERMISSION_GROUP_POLIO
)
POLIO_CHRONOGRAM_PERMISSION = PolioPermission(
    name="iaso_polio_chronogram",
    label=_("Polio chronogram"),
    module=MODULE_POLIO_PROJECT,
    group=PERMISSION_GROUP_POLIO,
    category="iaso_polio_chronogram_permissions",
    type_in_category="write",
    order_in_category=2,
)
POLIO_CHRONOGRAM_RESTRICTED_WRITE_PERMISSION = PolioPermission(
    name="iaso_polio_chronogram_restricted_write",
    label=_("Polio chronogram user (restricted write)"),
    module=MODULE_POLIO_PROJECT,
    group=PERMISSION_GROUP_POLIO,
    category="iaso_polio_chronogram_permissions",
    type_in_category="read",
    order_in_category=1,
)
POLIO_NOTIFICATIONS_PERMISSION = PolioPermission(
    name="iaso_polio_notifications",
    label=_("Polio notifications"),
    module=MODULE_POLIO_PROJECT,
    group=PERMISSION_GROUP_POLIO,
)
POLIO_VACCINE_AUTHORIZATIONS_ADMIN_PERMISSION = PolioPermission(
    name="iaso_polio_vaccine_authorizations_admin",
    label=_("Polio Vaccine Authorizations Admin"),
    module=MODULE_POLIO_PROJECT,
    group=PERMISSION_GROUP_POLIO,
    category="iaso_polio_vaccine_authorization_permissions",
    type_in_category="admin",
    order_in_category=2,
)
POLIO_VACCINE_AUTHORIZATIONS_READ_ONLY_PERMISSION = PolioPermission(
    name="iaso_polio_vaccine_authorizations_read_only",
    label=_("Polio Vaccine Authorizations Read Only"),
    module=MODULE_POLIO_PROJECT,
    group=PERMISSION_GROUP_POLIO,
    category="iaso_polio_vaccine_authorization_permissions",
    type_in_category="no_admin",
    order_in_category=1,
)
POLIO_VACCINE_STOCK_EARMARKS_ADMIN_PERMISSION = PolioPermission(
    name="iaso_polio_vaccine_stock_earmarks_admin",
    label=_("Polio Vaccine Stock Earmarks Admin"),
    module=MODULE_POLIO_PROJECT,
    group=PERMISSION_GROUP_POLIO,
    category="iaso_polio_vaccine_stock_earmarks_permissions",
    type_in_category="admin",
    order_in_category=3,
)
POLIO_VACCINE_STOCK_EARMARKS_NONADMIN_PERMISSION = PolioPermission(
    name="iaso_polio_vaccine_stock_earmarks_nonadmin",
    label=_("Polio Vaccine Stock Earmarks Non Admin"),
    module=MODULE_POLIO_PROJECT,
    group=PERMISSION_GROUP_POLIO,
    category="iaso_polio_vaccine_stock_earmarks_permissions",
    type_in_category="no_admin",
    order_in_category=2,
)
POLIO_VACCINE_STOCK_EARMARKS_READ_ONLY_PERMISSION = PolioPermission(
    name="iaso_polio_vaccine_stock_earmarks_read_only",
    label=_("Polio Vaccine Stock Earmarks Read Only"),
    module=MODULE_POLIO_PROJECT,
    group=PERMISSION_GROUP_POLIO,
    category="iaso_polio_vaccine_stock_earmarks_permissions",
    type_in_category="read_only",
    order_in_category=1,
)
POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION = PolioPermission(
    name="iaso_polio_vaccine_stock_management_read",
    label=_("Polio Vaccine Stock Management Read"),
    module=MODULE_POLIO_PROJECT,
    group=PERMISSION_GROUP_POLIO,
    category="iaso_polio_vaccine_stock_management_permissions",
    type_in_category="no_admin",
    order_in_category=2,
)
POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION = PolioPermission(
    name="iaso_polio_vaccine_stock_management_read_only",
    label=_("Polio Vaccine Stock Management Read Only"),
    module=MODULE_POLIO_PROJECT,
    group=PERMISSION_GROUP_POLIO,
    category="iaso_polio_vaccine_stock_management_permissions",
    type_in_category="read_only",
    order_in_category=1,
)
POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION = PolioPermission(
    name="iaso_polio_vaccine_stock_management_write",
    label=_("Polio Vaccine Stock Management Write"),
    module=MODULE_POLIO_PROJECT,
    group=PERMISSION_GROUP_POLIO,
    category="iaso_polio_vaccine_stock_management_permissions",
    type_in_category="admin",
    order_in_category=3,
)
POLIO_VACCINE_SUPPLY_CHAIN_READ_PERMISSION = PolioPermission(
    name="iaso_polio_vaccine_supply_chain_read",
    label=_("Polio Vaccine Supply Chain Read"),
    module=MODULE_POLIO_PROJECT,
    group=PERMISSION_GROUP_POLIO,
    category="iaso_polio_vaccine_supply_chain_permissions",
    type_in_category="no_admin",
    order_in_category=2,
)
POLIO_VACCINE_SUPPLY_CHAIN_READ_ONLY_PERMISSION = PolioPermission(
    name="iaso_polio_vaccine_supply_chain_read_only",
    label=_("Polio Vaccine Supply Chain Read Only"),
    module=MODULE_POLIO_PROJECT,
    group=PERMISSION_GROUP_POLIO,
    category="iaso_polio_vaccine_supply_chain_permissions",
    type_in_category="read_only",
    order_in_category=1,
)
POLIO_VACCINE_SUPPLY_CHAIN_WRITE_PERMISSION = PolioPermission(
    name="iaso_polio_vaccine_supply_chain_write",
    label=_("Polio Vaccine Supply Chain Write"),
    module=MODULE_POLIO_PROJECT,
    group=PERMISSION_GROUP_POLIO,
    category="iaso_polio_vaccine_supply_chain_permissions",
    type_in_category="admin",
    order_in_category=3,
)


permissions = {
    perm.name: perm
    for variable_name, perm in globals().items()
    if variable_name.startswith("POLIO_")
    and variable_name.endswith("_PERMISSION")
    and isinstance(perm, PolioPermission)
}


class PolioPermissionSupport(models.Model):
    class Meta:
        managed = False
        default_permissions = []
        permissions = [perm.model_permission() for perm in permissions.values()]


permission_models = [PolioPermissionSupport]
