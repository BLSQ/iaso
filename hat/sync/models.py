import logging
from django.db import models
from django.dispatch import receiver
from django.db.models.signals import post_save, post_delete
from .couchdb_helpers import create_db, delete_user

logger = logging.getLogger(__name__)


class DeviceDB(models.Model):
    device_id = models.TextField(unique=True)


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
