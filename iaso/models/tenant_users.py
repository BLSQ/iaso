from dataclasses import dataclass

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from iaso.models import Account


@dataclass
class UserCreationData:
    account: Account
    email: str
    first_name: str
    last_name: str
    username: str


class UsernameAlreadyExistsError(ValidationError):
    pass


def get_unique_username(username: str, account_name: str) -> str:
    account_name_slug = account_name.lower().replace(" ", "_")
    max_length = User._meta.get_field("username").max_length
    return f"{username}_{account_name_slug}"[0:max_length]


class TenantUserManager(models.Manager):
    def create_user_or_tenant_user(self, data: UserCreationData) -> User:
        existing_user = User.objects.filter(username__iexact=data.username).first()

        # 1) No preexisting user, simply create a new one.
        if not existing_user:
            user = User.objects.create(
                username=data.username,
                email=data.email,
                first_name=data.first_name,
                last_name=data.last_name,
            )
            return user

        if hasattr(existing_user, "iaso_profile") and existing_user.iaso_profile.account == data.account:
            raise UsernameAlreadyExistsError("Username already exists for this account.")

        existing_tenant_user = self.filter(Q(main_user=existing_user) | Q(account_user=existing_user)).first()

        # 2) The user already has multiple accounts: add an account.
        if existing_tenant_user:
            main_user = existing_tenant_user.main_user

        # 3) The user doesn't have multiple accounts.
        elif hasattr(existing_user, "iaso_profile"):
            existing_account = existing_user.iaso_profile.account
            new_username = get_unique_username(data.username, existing_account.name)
            existing_user.username = new_username
            existing_user.save()
            main_user = User.objects.create(
                username=data.username,
                email=existing_user.email,
                first_name=existing_user.first_name,
                last_name=existing_user.last_name,
            )
            self.create(main_user=main_user, account_user=existing_user)

        # 4) The user has no profile. This can happen, e.g., for a superuser.
        else:
            main_user = existing_user

        new_username = get_unique_username(data.username, data.account.name)
        user = User.objects.create(
            username=new_username,
            email=data.email,
            first_name=data.first_name,
            last_name=data.last_name,
        )
        self.create(main_user=main_user, account_user=user)

        return user


class TenantUser(models.Model):
    main_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tenant_users")
    account_user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="tenant_user")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = TenantUserManager()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["main_user", "account_user"], name="main_user_user_constraint"),
        ]
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["updated_at"]),
        ]

    def __str__(self):
        account_name = "Unknown"
        try:
            if self.account_user.iaso_profile:
                account_name = self.account_user.iaso_profile.account
        except User.iaso_profile.RelatedObjectDoesNotExist:
            pass
        return f"{self.main_user} -- {self.account_user} ({account_name})"

    @property
    def account(self):
        try:
            return self.account_user.iaso_profile.account if self.account_user.iaso_profile else None
        except User.iaso_profile.RelatedObjectDoesNotExist:
            return None

    def get_all_account_users(self):
        return [tu.account_user for tu in self.main_user.tenant_users.all()]

    def get_other_accounts(self):
        return [tu.account for tu in self.main_user.tenant_users.exclude(pk=self.pk) if tu.account]

    def as_dict(self):
        account_dict = None
        try:
            if self.account_user.iaso_profile:
                account_dict = self.account_user.iaso_profile.account.as_dict()
        except User.iaso_profile.RelatedObjectDoesNotExist:
            pass
        return {
            "id": self.id,
            "main_user_id": self.main_user_id,
            "account": account_dict,
        }
