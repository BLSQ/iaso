from django.conf import settings
from django.core.validators import MinLengthValidator
from django.db import models
from django.utils.text import slugify

from iaso.modules import MODULES, IasoModule
from iaso.permissions.base import IasoPermission
from iaso.utils.models.choice_array_field import ChoiceArrayField


MODULE_CHOICES = ((module.codename, module.name) for module in MODULES)


class AccountFeatureFlag(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=255, primary_key=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class Account(models.Model):
    """Account represent a tenant (=roughly a client organization or a country)"""

    name = models.TextField(unique=True, validators=[MinLengthValidator(1)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    default_version = models.ForeignKey("SourceVersion", null=True, blank=True, on_delete=models.SET_NULL)
    feature_flags = models.ManyToManyField(AccountFeatureFlag)
    user_manual_path = models.TextField(null=True, blank=True)
    forum_path = models.TextField(null=True, blank=True)
    modules = ChoiceArrayField(
        models.CharField(max_length=100, choices=MODULE_CHOICES), blank=True, null=True, default=list
    )
    # analytics_script is no longer used (replaced by the plausible setup) - it's kept in case we need another
    # specific analytics setup for a specific account
    analytics_script = models.TextField(blank=True, null=True)
    custom_translations = models.JSONField(null=True, blank=True)
    enforce_password_validation = models.BooleanField(default=False)

    @property
    def short_sanitized_name(self):
        """
        Short sanitized name mainly used in file path storage
        """
        if not self.name or not self.name.strip():
            return "invalid_name"

        text = slugify(self.name, allow_unicode=False)
        text = text.replace("-", "_")[:30]
        text = text.strip("_")

        return text if len(text) >= 1 else "invalid_name"

    def as_dict(self):
        return {
            "name": self.name,
            "id": self.id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "default_version": self.default_version.as_dict() if self.default_version else None,
            "feature_flags": [flag.code for flag in self.feature_flags.all()],
            "user_manual_path": self.user_manual_path or settings.USER_MANUAL_PATH,
            "forum_path": self.forum_path or settings.FORUM_PATH,
            "analytics_script": self.analytics_script,
        }

    def as_small_dict(self):
        return {
            "name": self.name,
            "id": self.id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "default_version": self.default_version.as_small_dict() if self.default_version else None,
            "feature_flags": [flag.code for flag in self.feature_flags.all()],
            "user_manual_path": self.user_manual_path or settings.USER_MANUAL_PATH,
            "forum_path": self.forum_path or settings.FORUM_PATH,
            "analytics_script": self.analytics_script,
            "modules": self.modules,
        }

    def __str__(self):
        return "%s " % (self.name,)

    @property
    def iaso_modules(self) -> list[IasoModule]:
        """Convert the modules stored as strings in the database to IasoModule objects."""
        return [module for module in MODULES if module.codename in self.modules]

    @property
    def permissions_from_active_modules(self) -> list[IasoPermission]:
        permissions = []
        for module in self.iaso_modules:
            permissions.extend(module.permissions)
        return permissions
