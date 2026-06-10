from django.conf import settings
from django.core.validators import MinLengthValidator
from django.db import models
from django.db.models import Q, QuerySet
from django.utils.text import slugify
from django.utils.timezone import now

from iaso.models.common import CreatedAndUpdatedModel
from iaso.modules import MODULES, IasoModule
from iaso.permissions.base import IasoPermission
from iaso.utils.models.choice_array_field import ChoiceArrayField
from iaso.utils.models.encrypted_text_field import EncryptedTextField


MODULE_CHOICES = ((module.codename, module.name) for module in MODULES)


class AccountFeatureFlag(CreatedAndUpdatedModel):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=255, primary_key=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class AccountQuerySet(QuerySet):
    def filter_for_user(self, user):
        if not user or not user.is_authenticated:
            return self.none()

        tenant_user = getattr(user, "tenant_user", None)

        if tenant_user:
            return self.filter(
                profile__in=tenant_user.main_user.tenant_users.values_list(
                    "account_user__iaso_profile__id",
                    flat=True,
                )
            )

        return self.filter(profile=user.iaso_profile)

    def exclude_disabled_accounts(self):
        return self.exclude(Q(disabled_at__isnull=False) & Q(disabled_at__lte=now()))

    def only_disabled_accounts(self):
        return self.filter(Q(disabled_at__isnull=False) & Q(disabled_at__lte=now()))


class Account(CreatedAndUpdatedModel):
    """Account represent a tenant (=roughly a client organization or a country)"""

    name = models.TextField(unique=True, validators=[MinLengthValidator(1)])
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
    enforce_password_validation = models.BooleanField(default=True)
    anthropic_api_key = EncryptedTextField(null=True, blank=True, help_text="Anthropic API key used by the Form AI")
    disabled_at = models.DateTimeField(null=True)

    objects = models.Manager.from_queryset(AccountQuerySet)()

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

    @property
    def is_active(self):
        return not self.disabled_at or self.disabled_at <= now()
