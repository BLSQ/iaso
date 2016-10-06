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
        # We need to retreive the revision to delete user
        user_url = '_users/{}'.format(deleted.couchdb_id)
        get_user = couchdbapi.get(user_url)

        if get_user.status_code != 200:
            return

        couch_user = get_user.json()
        r = couchdbapi.delete(user_url + '?rev={}'.format(couch_user['_rev']))
        logger.info('Deleted CouchDB user: %s, response: %s', deleted.couchdb_id, r.status_code)
