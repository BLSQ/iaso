import logging

from abc import ABC, abstractmethod
from dataclasses import dataclass
from importlib import import_module
from typing import Optional

from django.conf import settings
from django_stubs_ext import StrOrPromise

from iaso.modules import IasoModule
from iaso.permissions.utils import load_permissions_from_module


logger = logging.getLogger(__name__)


@dataclass
class IasoPermission(ABC):
    """
    Represents a permission in IASO.
    """

    name: str
    label: StrOrPromise  # For translation purposes
    module: Optional[IasoModule] = None
    group: Optional[str] = None  # Represents a permission group in the web interface
    category: Optional[str] = (
        None  # Represents a category whenever there are read/write/admin/non-admin/... permissions
    )
    type_in_category: Optional[str] = None  # Represents a type in the category, e.g. "read", "write", "admin"...

    def __post_init__(self):
        if self.module:
            self.module.add_permission(self)

    def __eq__(self, other):
        return isinstance(other, IasoPermission) and self.name == other.name

    def __str__(self):
        return self.name

    @abstractmethod
    def full_name(self) -> str:
        """
        Returns the full name of the permission, which is the name prefixed with its application name.
        This method should be called whenever you use any function that checks for permissions
        (e.g. HasPermission() in the API).
        """

    def model_permission(self) -> tuple[str, StrOrPromise]:
        """
        Returns the permission name and label.
        This method should be used when you define the list of permissions inside
        the `Meta.permissions` attribute of a class.
        """
        return self.name, self.label


ALL_PERMISSIONS = {}
PERMISSION_CLASSES = []

# Loading core permissions
core_permissions_module = import_module("iaso.permissions.core_permissions")
load_permissions_from_module(
    module=core_permissions_module, permissions_dict=ALL_PERMISSIONS, permission_classes=PERMISSION_CLASSES
)

# Now fetching all permissions from plugins
for plugin in settings.PLUGINS:
    try:
        permissions_module = import_module(f"plugins.{plugin}.permissions")
        logger.info(f"{plugin} plugin has a permission support")
        load_permissions_from_module(
            module=permissions_module, permissions_dict=ALL_PERMISSIONS, permission_classes=PERMISSION_CLASSES
        )
    except ImportError:
        logger.info(f"{plugin} plugin doesn't have a permission support")
