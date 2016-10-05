from django.db import models
from django.dispatch import receiver
from django.db.models.signals import post_delete
import logging

from hat.couchdb import api as couchdbapi

logger = logging.getLogger(__name__)


class MobileUser(models.Model):
    email = models.EmailField(unique=True)
    db_name = models.TextField(null=True, help_text='Filled in automatically by sync endpoint')
    couchdb_id = models.TextField(null=True, help_text='Filled in automatically by sync endpoint')


# When a Mobile User is deleted,
# delete the CouchDB user to revoke sync access:
@receiver(post_delete, sender=MobileUser)
def mobile_user_post_delete(sender, **kwargs):
    deleted = kwargs['instance']
    # delete the CouchDB user to revoke sync access:
    if deleted.couchdb_id:
        # FIXME: retreive user and add revision, otherwise this will just 409
        r = couchdbapi.delete('_users/{}'.format(deleted.couchdb_id))
        logger.info('Deleted CouchDB user: %s, response: %s', deleted.couchdb_id, r.status_code)
