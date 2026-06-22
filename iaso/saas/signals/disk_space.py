import logging

from django.db import transaction
from django.db.models.signals import post_delete, post_save

from iaso.models import (
    BulkCreateUserFile,
    Instance,
    InstanceFile,
    ReportVersion,
)
from iaso.saas.constants import DISK_SPACE_QUOTA
from iaso.utils.signals import receiver_with_multiple_senders


log = logging.getLogger(__name__)

try:
    from plugins.saas.services import AccountUsageService
except ImportError as e:
    log.warning(e)


sender_list = [
    BulkCreateUserFile,
    Instance,
    InstanceFile,
    ReportVersion,
]


def get_account(sender, instance):
    if any([sender is c for c in [Instance, ReportVersion]]):
        return getattr(instance.project, "account", None)
    if sender is InstanceFile:
        return instance.instance.project.account
    return instance.account


@receiver_with_multiple_senders(post_save, senders=sender_list)
def update_disk_space_usage_on_save(sender, instance, created, **kwargs):
    if created:
        account = get_account(sender, instance)
        if account:
            transaction.on_commit(lambda: AccountUsageService.dispatch(DISK_SPACE_QUOTA, account))


@receiver_with_multiple_senders(post_delete, senders=sender_list)
def update_project_usage_on_delete(sender, instance, **_kwargs):
    account = get_account(sender, instance)
    if account:
        transaction.on_commit(lambda: AccountUsageService.dispatch(DISK_SPACE_QUOTA, account))
