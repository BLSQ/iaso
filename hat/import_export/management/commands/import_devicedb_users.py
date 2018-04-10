from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from hat.couchdb import api
from hat.sync.models import DeviceDB


class Command(BaseCommand):
    help = 'Import synced devices data'

    def handle(self, *args, **options):
        all_users = api.get('_users/_all_docs')
        for user_entry in all_users.json()['rows']:
            user_couch_id = user_entry['id']
            if 'org.couchdb.user' in user_couch_id:
                user_couch_username = user_couch_id.split(':')[1]
                try:
                    user_db = User.objects.get(username=user_couch_username)
                except User.DoesNotExist:
                    print("User", user_couch_username, "not found in database, skipping")
                    continue

                user_details = api.get('_users/{}'.format(user_couch_id))
                device_ids = user_details.json()['roles']
                for device_id in device_ids:
                    try:
                        device_db = DeviceDB.objects.get(device_id=device_id)
                        if device_db.creator is None:
                            device_db.creator = user_db
                            print("Setting device id", device_id, " creator to user", user_couch_username)
                        if device_db.last_user is None:
                            device_db.last_user = user_db
                            print("Setting device id", device_id, " last_user to user", user_couch_username)
                        device_db.save()

                    except DeviceDB.DoesNotExist:
                        print("Couldn't find device", device_id, "for user", user_couch_username)
