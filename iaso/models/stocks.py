import typing
import uuid

from django.contrib.auth.models import AnonymousUser, User
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import QuerySet
from numpy import emath

from iaso.models import Project
from iaso.models.entity import UserNotAuthError
from iaso.utils.models.soft_deletable import SoftDeletableModel


class StockImpacts(models.TextChoices):
    """StockImpacts is an Enum-like class representing the impact of a rule on the stock."""

    ADD = "ADD", "Add"
    SUBTRACT = "SUBTRACT", "Subtract"
    RESET = "RESET", "Reset"


class StockKeepingUnitQuerySet(QuerySet):
    def filter_for_user(self, user: typing.Optional[typing.Union[User, AnonymousUser]]):
        if not user or not user.is_authenticated:
            raise UserNotAuthError("User not Authenticated")

        profile = user.iaso_profile
        return self.filter(account=profile.account)

    def filter_for_user_and_app_id(self, user: typing.Optional[typing.Union[User, AnonymousUser]], app_id: str):
        project = Project.objects.get_for_user_and_app_id(user, app_id)
        return self.filter_for_project(project)

    def filter_for_project(self, project: Project):
        return self.filter(
            account=project.account,
            projects__in=[project],
        )


def validate_precision(value):
    result = emath.log10(value)
    if result != int(result):
        raise ValidationError(f"{value} is not a power of 10")


class StockKeepingUnit(SoftDeletableModel):
    """
    A distinct type of item for tracking in inventory. This is often referred as SKU.
    """

    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=255)
    account = models.ForeignKey("iaso.Account", on_delete=models.CASCADE, null=False, blank=False)
    projects = models.ManyToManyField("Project", related_name="skus", blank=True)
    org_unit_types = models.ManyToManyField("OrgUnitType", related_name="skus", blank=True)
    forms = models.ManyToManyField("Form", related_name="skus", blank=True)
    children = models.ManyToManyField("self", blank=True, through="StockKeepingUnitChildren")
    display_unit = models.CharField(max_length=25, blank=True)
    """
    The display_precision should be a power of 10 by which the value will be divided.
    E.g.: 
    - if you want to display kilograms, the value should be in grams but the display_precision is going to be 1000
    """
    display_precision = models.IntegerField(null=False, blank=False, default=1, validators=[validate_precision])
    created_by = models.ForeignKey(
        User, null=True, related_name="sku_created_by", blank=True, on_delete=models.SET_NULL
    )
    updated_by = models.ForeignKey(
        User, null=True, related_name="sku_updated_by", blank=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager.from_queryset(StockKeepingUnitQuerySet)()

    def __str__(self):
        return f"{self.name} ({self.short_name})"


class StockKeepingUnitChildren(models.Model):
    parent = models.ForeignKey(
        "StockKeepingUnit", related_name="children_reverse", on_delete=models.CASCADE, null=False, blank=False
    )
    child = models.ForeignKey(
        "StockKeepingUnit", related_name="parents", on_delete=models.CASCADE, null=False, blank=False
    )
    value = models.IntegerField()
    created_by = models.ForeignKey(
        User, related_name="sku_children_created_by", null=True, blank=True, on_delete=models.SET_NULL
    )
    updated_by = models.ForeignKey(
        User, related_name="sku_children_updated_by", null=True, blank=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class StockItemQuerySet(QuerySet):
    def filter_for_user(self, user: typing.Optional[typing.Union[User, AnonymousUser]]):
        if not user or not user.is_authenticated:
            raise UserNotAuthError("User not Authenticated")

        profile = user.iaso_profile
        return self.filter(sku__account=profile.account)


class StockItem(models.Model):
    """
    The number of items in a stock for a particular SKU and OrgUnit.
    """

    org_unit = models.ForeignKey(
        "OrgUnit", related_name="stock_items", null=False, blank=False, on_delete=models.CASCADE
    )
    sku = models.ForeignKey(
        "StockKeepingUnit", related_name="stock_items", null=False, blank=False, on_delete=models.CASCADE
    )
    value = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager.from_queryset(StockItemQuerySet)()


class StockLedgerItemQuerySet(QuerySet):
    def filter_for_user(self, user: typing.Optional[typing.Union[User, AnonymousUser]]):
        if not user or not user.is_authenticated:
            raise UserNotAuthError("User not Authenticated")

        profile = user.iaso_profile
        return self.filter(sku__account=profile.account)

    def filter_for_user_and_app_id(self, user: typing.Optional[typing.Union[User, AnonymousUser]], app_id: str):
        project = Project.objects.get_for_user_and_app_id(user, app_id)
        return self.filter_for_project(project)

    def filter_for_project(self, project: Project):
        return self.filter(
            sku__account=project.account,
            sku__projects__in=[project],
        )


class StockLedgerItem(models.Model):
    """
    An action that changed the stock item value based on a StockItemRule.
    """

    id = models.UUIDField(primary_key=True, auto_created=True, default=uuid.uuid4, editable=False)
    sku = models.ForeignKey(
        "StockKeepingUnit", related_name="ledger_items", null=False, blank=False, on_delete=models.CASCADE
    )
    org_unit = models.ForeignKey(
        "OrgUnit", related_name="ledger_items", null=False, blank=False, on_delete=models.CASCADE
    )
    rule = models.ForeignKey(
        "StockItemRule", related_name="ledger_items", null=True, blank=True, on_delete=models.CASCADE
    )
    submission = models.ForeignKey(
        "Instance", related_name="ledger_items", null=True, blank=True, on_delete=models.CASCADE
    )
    question = models.CharField(max_length=255, blank=True)
    value = models.IntegerField()
    impact = models.CharField(max_length=8, choices=StockImpacts.choices, blank=True)
    created_by = models.ForeignKey(User, related_name="ledger_item", blank=False, on_delete=models.CASCADE)
    created_at = models.DateTimeField()
    received_at = models.DateTimeField(auto_now_add=True)

    objects = models.Manager.from_queryset(StockLedgerItemQuerySet)()

    def save(self, *args, **kwargs):
        if StockLedgerItem.objects.filter(id=self.id).exists():
            raise ValidationError(f"StockLedgerItem {self.id} already exists")
        super().save(*args, **kwargs)


class StockItemRuleQuerySet(QuerySet):
    def filter_for_user(self, user: typing.Optional[typing.Union[User, AnonymousUser]]):
        if not user or not user.is_authenticated:
            raise UserNotAuthError("User not Authenticated")

        profile = user.iaso_profile
        return self.filter(sku__account=profile.account)

    def filter_for_user_and_app_id(self, user: typing.Optional[typing.Union[User, AnonymousUser]], app_id: str):
        project = Project.objects.get_for_user_and_app_id(user, app_id)
        return self.filter_for_project(project)

    def filter_for_project(self, project: Project):
        return self.filter(
            sku__projects__in=[project],
            form__projects__in=[project],
        )


class StockItemRule(models.Model):
    """
    Defines how a form impacts stock items.
    """

    sku = models.ForeignKey(
        "StockKeepingUnit", related_name="stock_item_rules", null=False, blank=False, on_delete=models.CASCADE
    )
    form = models.ForeignKey("Form", related_name="stock_item_rules", null=False, blank=False, on_delete=models.CASCADE)
    question = models.CharField(max_length=255, blank=False)
    impact = models.CharField(max_length=8, choices=StockImpacts.choices, blank=True)
    created_by = models.ForeignKey(
        User, related_name="stock_item_rule_created_by", null=True, blank=True, on_delete=models.SET_NULL
    )
    updated_by = models.ForeignKey(
        User, related_name="stock_item_rule_updated_by", null=True, blank=True, on_delete=models.SET_NULL
    )
    version = models.ForeignKey(
        "StockRulesVersion", related_name="rules", null=False, blank=False, on_delete=models.CASCADE
    )
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager.from_queryset(StockItemRuleQuerySet)()


class StockRulesVersionQuerySet(QuerySet):
    def filter_for_user(self, user: typing.Optional[typing.Union[User, AnonymousUser]]):
        if not user or not user.is_authenticated:
            raise UserNotAuthError("User not Authenticated")

        profile = user.iaso_profile
        return self.filter(account=profile.account)

    def filter_for_user_and_app_id(self, user: typing.Optional[typing.Union[User, AnonymousUser]], app_id: str):
        project = Project.objects.get_for_user_and_app_id(user, app_id)
        return self.filter_for_project(project)

    def filter_for_project(self, project: Project):
        return self.filter(account=project.account)

    def filter_published(self):
        return self.filter(status=StockRulesVersionsStatus.PUBLISHED)


class StockRulesVersionsStatus(models.TextChoices):
    """StockRulesVersionsStatus is an Enum-like class for the Status of a StockRulesVersion."""

    DRAFT = "DRAFT", "Draft"
    UNPUBLISHED = "UNPUBLISHED", "Unpublished"
    PUBLISHED = "PUBLISHED", "Published"


StockRulesVersionStatusAllowedTransitions = {
    StockRulesVersionsStatus.DRAFT: {StockRulesVersionsStatus.UNPUBLISHED, StockRulesVersionsStatus.PUBLISHED},
    StockRulesVersionsStatus.UNPUBLISHED: {StockRulesVersionsStatus.PUBLISHED},
    StockRulesVersionsStatus.PUBLISHED: {StockRulesVersionsStatus.UNPUBLISHED},
}


def is_transition_allowed(self: "StockRulesVersion", new_status: str):
    allowed_set: typing.Set[str] = StockRulesVersionStatusAllowedTransitions.get(self.status, set())
    return new_status in allowed_set


class StockRulesVersion(SoftDeletableModel):
    """
    A version of the stock item rules.
    """

    NAME_MAX_LENGTH = 50

    account = models.ForeignKey(
        "iaso.Account", related_name="stock_rule_versions", on_delete=models.CASCADE, null=False, blank=False
    )
    name = models.CharField(max_length=NAME_MAX_LENGTH, default="No Name")
    status = models.CharField(
        max_length=12,
        choices=StockRulesVersionsStatus.choices,
        default=StockRulesVersionsStatus.DRAFT,
    )
    created_by = models.ForeignKey(
        User, related_name="stock_rule_version_created_by", null=True, blank=True, on_delete=models.SET_NULL
    )
    updated_by = models.ForeignKey(
        User, related_name="stock_rule_version_updated_by", null=True, blank=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager.from_queryset(StockRulesVersionQuerySet)()

    def transition_to_status(self, new_status_str: str, do_save=True):
        old_status_str = self.status

        if is_transition_allowed(self, new_status_str):
            self.status = new_status_str
            if do_save:
                self.save()

            if new_status_str == StockRulesVersionsStatus.PUBLISHED.value:
                # We passed all the other PUBLISHED -> UNPUBLISHED
                StockRulesVersion.objects.filter(
                    account=self.account, status=StockRulesVersionsStatus.PUBLISHED
                ).update(status=StockRulesVersionsStatus.UNPUBLISHED)

            return {"success": True}

        return {
            "success": False,
            "error": f"Transition from {old_status_str} to {new_status_str} is not allowed",
        }

    def __str__(self):
        return f"{self.name}({self.id}): {self.status}"
