import logging

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from iaso.models import Instance

from ..constants import SUBMISSION_QUOTA


log = logging.getLogger(__name__)

try:
    from plugins.saas.services import AccountUsageService
except ImportError as e:
    log.warning(e)


@receiver(post_save, sender=Instance)
def update_submission_usage_on_save(sender, instance, created, **kwargs):
    if created:
        account = getattr(instance.project, "account", None)
        if account:
            transaction.on_commit(lambda: AccountUsageService.dispatch(SUBMISSION_QUOTA, account, create=True))
