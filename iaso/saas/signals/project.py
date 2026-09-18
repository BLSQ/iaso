import logging

from django.db import transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from iaso.models import Project

from ..constants import PROJECT_QUOTA


log = logging.getLogger(__name__)

try:
    from plugins.saas.services import AccountUsageService
except ImportError as e:
    log.warning(e)


@receiver(post_save, sender=Project)
def update_project_usage_on_save(sender, instance, created, **kwargs):
    if created:
        transaction.on_commit(lambda: AccountUsageService.dispatch(PROJECT_QUOTA, instance.account))


@receiver(post_delete, sender=Project)
def update_project_usage_on_delete(sender, instance, **_kwargs):
    transaction.on_commit(lambda: AccountUsageService.dispatch(PROJECT_QUOTA, instance.account))
