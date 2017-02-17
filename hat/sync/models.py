import logging
from django.db import models
from django.dispatch import receiver
from django.db.models.signals import post_save, post_delete
from .couchdb_helpers import create_db, delete_user, generate_db_name

logger = logging.getLogger(__name__)


class DeviceDB(models.Model):
    device_id = models.TextField(unique=True)

    # used to log the sync execution
    last_synced_date = models.DateTimeField(null=True)
    last_synced_seq = models.TextField(null=True, default=0)
    last_synced_docs = models.TextField(null=True)
    last_synced_log_status = models.TextField(null=True)
    last_synced_log_message = models.TextField(null=True)

    @property
    def db_name(self):
        ''' Returns the device's db name. '''
        return generate_db_name(self.device_id)


@receiver(post_save, sender=DeviceDB)
def device_db_post_save(sender, instance, *args, **kwargs):
    ''' Create the accompaning couchdb db for the device db record '''
    create_db(instance.device_id)


class MobileUser(models.Model):
    email = models.EmailField(unique=True)


@receiver(post_delete, sender=MobileUser)
def mobile_user_post_delete(sender, instance, *args, **kwargs):
    ''' When a Mobile User is deleted, delete the CouchDB user to revoke sync access '''
    delete_user(instance.email)
