import argparse
import json
import sys
import uuid

from django.core.management.base import BaseCommand

from hat.couchdb import api
from hat.import_export.utils import replace_in_dict_recursive
from hat.sync.models import DeviceDB


class Command(BaseCommand):
    help = 'Import a json file as if it had been uploaded by a mobile sync device, create the devicedb in the process'

    def add_arguments(self, parser):
        parser.add_argument(
            'jsonfile',
            metavar='input_file',
            type=argparse.FileType('r'),
            help='name of the json file to import',
            nargs='?',
            default=sys.stdin
        )

        parser.add_argument(
            "--deviceid",
            action="store",
            dest="deviceid",
            default="importmobilejson",
            help="Device ID to create/load into, defaults to 'importmobilejson'"
        )

        parser.add_argument(
            "--asis",
            action="store_true",
            dest="asis",
            help="By default, the IDs are randomized and the deviceid is replaced."
                 "Set this option to use the provided json as-is."
        )

    def handle(self, *args, **options):
        device_id = options["deviceid"]
        input_file = options['jsonfile']
        input_json = json.load(input_file)
        if not options['asis']:
            input_json['_id'] = "participant-" + str(uuid.uuid4())
            input_json['deviceId'] = device_id
            input_json = replace_in_dict_recursive(input_json, "device", device_id)

        device_db, device_created = DeviceDB.objects.get_or_create(device_id=device_id)
        if device_created:
            print("Created the device")

        doc_upload_result = api.post(device_db.db_name, json=input_json).json()

        if doc_upload_result:
            print(json.dumps(doc_upload_result))
