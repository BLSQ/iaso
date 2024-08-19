from django.contrib.auth.models import User
from django.db import models


class TenantUser(models.Model):
    main_user = models.ForeignKey(User, on_delete=models.PROTECT, related_name="tenant_users")
    account_user = models.OneToOneField(User, on_delete=models.PROTECT, related_name="tenant_user")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["main_user", "account_user"], name="main_user_user_constraint"),
        ]
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["updated_at"]),
        ]

    @property
    def account(self):
        return self.account_user.iaso_profile and self.account_user.iaso_profile.account

    def get_all_account_users(self):
        return [tu.account_user for tu in self.main_user.tenant_users.all()]

    def get_other_accounts(self):
        return [tu.account for tu in self.main_user.tenant_users.exclude(pk=self.pk)]

    def __str__(self):
        return "%s -- %s (%s)" % (self.main_user, self.account_user, self.account_user.iaso_profile.account)

    def as_dict(self):
        return {
            "id": self.id,
            "main_user_id": self.main_user_id,
            "account": self.account_user.iaso_profile.account.as_dict(),
        }
