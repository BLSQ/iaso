import copy

from dataclasses import dataclass
from typing import Optional

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q, QuerySet

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
    def create_user_or_tenant_user(
        self, data: UserCreationData
    ) -> tuple[Optional[User], Optional[User], Optional[User]]:
        """
        Creates a user or a tenant user.

        Returns a tuple of (new_user, main_user, account_user) specifying which objects were created:

        - (new_user, None, None) when a user was created
        - (None, main_user, account_user) when a tenant user was created
        """
        existing_user = User.objects.filter(username__iexact=data.username).first()

        # 1) No preexisting user, simply create a new one.
        if not existing_user:
            user = User.objects.create(
                username=data.username,
                email=data.email,
                first_name=data.first_name,
                last_name=data.last_name,
            )
            return user, None, None

        if hasattr(existing_user, "iaso_profile") and existing_user.iaso_profile.account == data.account:
            raise UsernameAlreadyExistsError("Username already exists for this account.")

        existing_tenant_user = self.filter(Q(main_user=existing_user) | Q(account_user=existing_user)).first()

        # 2) The user already has multiple accounts: add an account.
        if existing_tenant_user:
            main_user = existing_tenant_user.main_user

        # 3) The user has a single account: switch him into multiple accounts mode.
        elif hasattr(existing_user, "iaso_profile"):
            password = copy.copy(existing_user.password)

            existing_user.username = get_unique_username(data.username, existing_user.iaso_profile.account.name)
            existing_user.set_unusable_password()
            existing_user.save()

            main_user = User.objects.create(
                username=data.username,
                email=existing_user.email,
                first_name=existing_user.first_name,
                last_name=existing_user.last_name,
                password=password,
            )

            self.create(main_user=main_user, account_user=existing_user)

        # 4) The user has no profile. This can happen, e.g., for a superuser.
        else:
            main_user = existing_user

        account_user = User(
            username=get_unique_username(data.username, data.account.name),
            email=data.email,
            first_name=data.first_name,
            last_name=data.last_name,
        )
        account_user.set_unusable_password()
        account_user.save()

        self.create(main_user=main_user, account_user=account_user)

        return None, main_user, account_user


class TenantUser(models.Model):
    """
    Multi tenant (or multiple accounts).

    `main_user` is the user who logs in with `username/password` (or with `email` with the WFP CIAM OAuth protocol).

    There can be a bunch of `account_user` for a given `main_user`.

    When `main_user` logs in, an "under the hood" login is performed so that
    `main_user` is switched to one of its `account_user`.

    Ideally:

    - `main_user` shouldn't have any profile
    - `account_user` should have an unusable password to avoid a "direct" login
    """

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
        try:
            account_name = self.account_user.iaso_profile.account.name
        except User.iaso_profile.RelatedObjectDoesNotExist:
            account_name = "Unknown"
        return f"{self.main_user} -- {self.account_user} ({account_name})"

    @property
    def account(self) -> Optional[Account]:
        try:
            return self.account_user.iaso_profile.account
        except User.iaso_profile.RelatedObjectDoesNotExist:
            return None

    def get_other_accounts(self) -> QuerySet[Account]:
        account_ids = self.main_user.tenant_users.exclude(pk=self.pk).values_list(
            "account_user__iaso_profile__account_id", flat=True
        )
        return Account.objects.filter(id__in=account_ids)

    def get_all_account_users(self) -> list[User]:
        return [tu.account_user for tu in self.main_user.tenant_users.all()]

    @classmethod
    def is_multi_account_user(cls, user: User) -> bool:
        return hasattr(user, "tenant_user")
