import logging
from django.db import models
from django.dispatch import receiver
from django.db.models.signals import post_save, post_delete
from .couchdb_helpers import create_db, delete_user

logger = logging.getLogger(__name__)


class DeviceDB(models.Model):
    device_id = models.TextField(unique=True)

    # used to log the sync execution
    last_synced_date = models.DateTimeField(null=True)
    last_synced_seq = models.TextField(null=True, default=0)
    last_synced_docs = models.TextField(null=True)


@receiver(post_save, sender=DeviceDB)
def device_db_post_save(sender, instance, *args, **kwargs):
    ''' Create the accompaning couchdb db for the device db record '''
    create_db(instance.device_id)


class DeviceDBEntry(models.Model):
    '''
    In this class we are going to keep track of each device records
    If a record is updated in Couchdb (synced) it will have a different revision_number
    from the one in this table; that will indicate us that we should create/update it
    in the Case table.
    '''
    device_id = models.TextField(db_index=True)
    device_doc_id = models.TextField(db_index=True, null=True)
    device_doc_rev = models.TextField(null=True)

    class Meta:
        unique_together = (('device_id', 'device_doc_id'),)
        permissions = (
            ("import_sync", "Can import synced cases"),
        )


class MobileUser(models.Model):
    email = models.EmailField(unique=True)


@receiver(post_delete, sender=MobileUser)
def mobile_user_post_delete(sender, instance, *args, **kwargs):
    ''' When a Mobile User is deleted, delete the CouchDB user to revoke sync access '''
    delete_user(instance.email)
