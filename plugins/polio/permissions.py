from django.db import models
from django.utils.translation import gettext_lazy as _


_PREFIX = "polio."

_POLIO = "iaso_polio"
_POLIO_BUDGET = "iaso_polio_budget"
_POLIO_BUDGET_ADMIN = "iaso_polio_budget_admin"
_POLIO_CONFIG = "iaso_polio_config"
_POLIO_CHRONOGRAM = "iaso_polio_chronogram"
_POLIO_CHRONOGRAM_RESTRICTED_WRITE = "iaso_polio_chronogram_restricted_write"
_POLIO_NOTIFICATIONS = "iaso_polio_notifications"
_POLIO_VACCINE_AUTHORIZATIONS_ADMIN = "iaso_polio_vaccine_authorizations_admin"
_POLIO_VACCINE_AUTHORIZATIONS_READ_ONLY = "iaso_polio_vaccine_authorizations_read_only"
_POLIO_VACCINE_STOCK_EARMARKS_ADMIN = "iaso_polio_vaccine_stock_earmarks_admin"
_POLIO_VACCINE_STOCK_EARMARKS_NONADMIN = "iaso_polio_vaccine_stock_earmarks_nonadmin"
_POLIO_VACCINE_STOCK_EARMARKS_READ_ONLY = "iaso_polio_vaccine_stock_earmarks_read_only"
_POLIO_VACCINE_STOCK_MANAGEMENT_READ = (
    "iaso_polio_vaccine_stock_management_read"  # This is actually NONADMIN permission
)
_POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY = "iaso_polio_vaccine_stock_management_read_only"
_POLIO_VACCINE_STOCK_MANAGEMENT_WRITE = "iaso_polio_vaccine_stock_management_write"  # This is actually ADMIN permission
_POLIO_VACCINE_SUPPLY_CHAIN_READ = "iaso_polio_vaccine_supply_chain_read"  # This is actually NONADMIN permission
_POLIO_VACCINE_SUPPLY_CHAIN_READ_ONLY = "iaso_polio_vaccine_supply_chain_read_only"
_POLIO_VACCINE_SUPPLY_CHAIN_WRITE = "iaso_polio_vaccine_supply_chain_write"  # This is actually ADMIN permission


POLIO = _PREFIX + _POLIO
POLIO_BUDGET = _PREFIX + _POLIO_BUDGET
POLIO_BUDGET_ADMIN = _PREFIX + _POLIO_BUDGET_ADMIN
POLIO_CHRONOGRAM = _PREFIX + _POLIO_CHRONOGRAM
POLIO_CHRONOGRAM_RESTRICTED_WRITE = _PREFIX + _POLIO_CHRONOGRAM_RESTRICTED_WRITE
POLIO_CONFIG = _PREFIX + _POLIO_CONFIG
POLIO_NOTIFICATIONS = _PREFIX + _POLIO_NOTIFICATIONS
POLIO_VACCINE_AUTHORIZATIONS_ADMIN = _PREFIX + _POLIO_VACCINE_AUTHORIZATIONS_ADMIN
POLIO_VACCINE_AUTHORIZATIONS_READ_ONLY = _PREFIX + _POLIO_VACCINE_AUTHORIZATIONS_READ_ONLY
POLIO_VACCINE_STOCK_EARMARKS_ADMIN = _PREFIX + _POLIO_VACCINE_STOCK_EARMARKS_ADMIN
POLIO_VACCINE_STOCK_EARMARKS_NONADMIN = _PREFIX + _POLIO_VACCINE_STOCK_EARMARKS_NONADMIN
POLIO_VACCINE_STOCK_EARMARKS_READ_ONLY = _PREFIX + _POLIO_VACCINE_STOCK_EARMARKS_READ_ONLY
POLIO_VACCINE_STOCK_MANAGEMENT_READ = _PREFIX + _POLIO_VACCINE_STOCK_MANAGEMENT_READ
POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY = _PREFIX + _POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY
POLIO_VACCINE_STOCK_MANAGEMENT_WRITE = _PREFIX + _POLIO_VACCINE_STOCK_MANAGEMENT_WRITE
POLIO_VACCINE_SUPPLY_CHAIN_READ = _PREFIX + _POLIO_VACCINE_SUPPLY_CHAIN_READ
POLIO_VACCINE_SUPPLY_CHAIN_READ_ONLY = _PREFIX + _POLIO_VACCINE_SUPPLY_CHAIN_READ_ONLY
POLIO_VACCINE_SUPPLY_CHAIN_WRITE = _PREFIX + _POLIO_VACCINE_SUPPLY_CHAIN_WRITE


read_edit_permissions = {
    "iaso_polio_budget_permissions": {
        "read": "iaso_polio_budget",
        "write": "iaso_polio_budget_admin",
    },
    "iaso_polio_chronogram_permissions": {
        "read": "iaso_polio_chronogram_restricted_write",
        "write": "iaso_polio_chronogram",
    },
    "iaso_polio_vaccine_supply_chain_permissions": {
        "read_only": "iaso_polio_vaccine_supply_chain_read_only",
        "no_admin": "iaso_polio_vaccine_supply_chain_read",
        "admin": "iaso_polio_vaccine_supply_chain_write",
    },
    "iaso_polio_vaccine_stock_management_permissions": {
        "read_only": "iaso_polio_vaccine_stock_management_read_only",
        "no_admin": "iaso_polio_vaccine_stock_management_read",
        "admin": "iaso_polio_vaccine_stock_management_write",
    },
    "iaso_polio_vaccine_authorization_permissions": {
        "no_admin": "iaso_polio_vaccine_authorizations_read_only",
        "admin": "iaso_polio_vaccine_authorizations_admin",
    },
    "iaso_polio_vaccine_stock_earmarks_permissions": {
        "read_only": "iaso_polio_vaccine_stock_earmarks_read_only",
        "no_admin": "iaso_polio_vaccine_stock_earmarks_nonadmin",
        "admin": "iaso_polio_vaccine_stock_earmarks_admin",
    },
}

permissions_presentation = {
    "polio": [
        "iaso_polio_config",
        "iaso_polio",
        "iaso_polio_budget_admin",
        "iaso_polio_budget",
        "iaso_polio_chronogram",
        "iaso_polio_chronogram_restricted_write",
        "iaso_polio_vaccine_supply_chain_read",
        "iaso_polio_vaccine_supply_chain_write",
        "iaso_polio_vaccine_supply_chain_read_only",
        "iaso_polio_vaccine_stock_management_read",
        "iaso_polio_vaccine_stock_management_write",
        "iaso_polio_vaccine_stock_management_read_only",
        "iaso_polio_notifications",
        "iaso_polio_vaccine_authorizations_read_only",
        "iaso_polio_vaccine_authorizations_admin",
        "iaso_polio_vaccine_stock_earmarks_nonadmin",
        "iaso_polio_vaccine_stock_earmarks_admin",
        "iaso_polio_vaccine_stock_earmarks_read_only",
    ],
}

# can't be defined here yet, because it is used in Account and generates new migrations
# modules = [
#     {"name": "Polio project", "codename": "POLIO_PROJECT", "fr_name": "Projet Polio"},
# ]

module_permissions = {
    "POLIO_PROJECT": [
        "iaso_polio_config",
        "iaso_polio",
        "iaso_polio_budget_admin",
        "iaso_polio_budget",
        "iaso_polio_chronogram",
        "iaso_polio_chronogram_restricted_write",
        "iaso_polio_vaccine_supply_chain_read",
        "iaso_polio_vaccine_supply_chain_write",
        "iaso_polio_vaccine_supply_chain_read_only",
        "iaso_polio_vaccine_stock_management_read",
        "iaso_polio_vaccine_stock_management_write",
        "iaso_polio_vaccine_stock_management_read_only",
        "iaso_polio_notifications",
        "iaso_polio_vaccine_authorizations_read_only",
        "iaso_polio_vaccine_authorizations_admin",
        "iaso_polio_vaccine_stock_earmarks_nonadmin",
        "iaso_polio_vaccine_stock_earmarks_admin",
        "iaso_polio_vaccine_stock_earmarks_read_only",
    ],
}


class PolioPermissionSupport(models.Model):
    class Meta:
        managed = False
        default_permissions = []
        permissions = (
            (_POLIO, _("Polio")),
            (_POLIO_BUDGET, _("Budget Polio")),
            (_POLIO_BUDGET_ADMIN, _("Budget Polio Admin")),
            (_POLIO_CONFIG, _("Polio config")),
            (_POLIO_CHRONOGRAM, _("Polio chronogram")),
            (_POLIO_CHRONOGRAM_RESTRICTED_WRITE, _("Polio chronogram user (restricted write)")),
            (_POLIO_NOTIFICATIONS, _("Polio notifications")),
            (_POLIO_VACCINE_AUTHORIZATIONS_ADMIN, _("Polio Vaccine Authorizations Admin")),
            (_POLIO_VACCINE_AUTHORIZATIONS_READ_ONLY, _("Polio Vaccine Authorizations Read Only")),
            (_POLIO_VACCINE_STOCK_EARMARKS_ADMIN, _("Polio Vaccine Stock Earmarks Admin")),
            (_POLIO_VACCINE_STOCK_EARMARKS_NONADMIN, _("Polio Vaccine Stock Earmarks Non Admin")),
            (_POLIO_VACCINE_STOCK_EARMARKS_READ_ONLY, _("Polio Vaccine Stock Earmarks Read Only")),
            (_POLIO_VACCINE_STOCK_MANAGEMENT_READ, _("Polio Vaccine Stock Management Read")),
            (_POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY, _("Polio Vaccine Stock Management Read Only")),
            (_POLIO_VACCINE_STOCK_MANAGEMENT_WRITE, _("Polio Vaccine Stock Management Write")),
            (_POLIO_VACCINE_SUPPLY_CHAIN_READ, _("Polio Vaccine Supply Chain Read")),
            (_POLIO_VACCINE_SUPPLY_CHAIN_READ_ONLY, _("Polio Vaccine Supply Chain Read Only")),
            (_POLIO_VACCINE_SUPPLY_CHAIN_WRITE, _("Polio Vaccine Supply Chain Write")),
        )


permission_model = PolioPermissionSupport
