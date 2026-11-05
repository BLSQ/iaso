from dataclasses import dataclass

from django.db import models
from django.utils.translation import gettext_lazy as _

from iaso.modules import MODULE_ENTITIES
from iaso.permissions.base import IasoPermission
from iaso.permissions.core_permissions import PERMISSION_GROUP_ENTITIES


@dataclass
class WfpPermission(IasoPermission):
    """
    Represents a permission of the WFP plugin.
    """

    def full_name(self) -> str:
        return f"wfp.{self.codename}"


# Add here any new permission - it must start with the "WFP_" prefix and end with "_PERMISSION"
WFP_BENEFICIARY_EXPORT_PERMISSION = WfpPermission(
    codename="iaso_wfp_beneficiary_export",
    label=_("Export WFP beneficiaries"),
    module=MODULE_ENTITIES,
    ui_group=PERMISSION_GROUP_ENTITIES,
)

permissions = {
    perm.codename: perm
    for variable_name, perm in globals().items()
    if variable_name.startswith("WFP_") and variable_name.endswith("_PERMISSION") and isinstance(perm, WfpPermission)
}


class WfpPermissionSupport(models.Model):
    class Meta:
        managed = False
        default_permissions = []
        permissions = [perm.model_permission() for perm in permissions.values()]


permission_models = [WfpPermissionSupport]
