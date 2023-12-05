import os
import csv
from pathlib import Path
from django.core.paginator import Paginator

from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand


def fullname(o):
    klass = o.__class__
    module = klass.__module__
    if module == "builtins":
        return klass.__qualname__  # avoid outputs like 'builtins.str'
    return module + "." + klass.__qualname__


def model_and_fields_with_files(account_id_to_keep):
    file_path = "./media/account/" + account_id_to_keep + "/inventory.csv"
    print("producing ", file_path)

    fieldnames = ["source", "destination", "model", "field_name", "id"]

    with open(file_path, "w", newline="") as csvfile:
        csv_writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        csv_writer.writeheader()

        for ct in ContentType.objects.all():
            m = ct.model_class()
            if m:
                file_fields = []
                for field in m._meta.get_fields():
                    if fullname(field) == "django.db.models.fields.files.FileField":
                        file_fields.append(field)

                if len(file_fields) > 0:
                    print(m.__module__, m.__name__)
                    for field in file_fields:
                        print(
                            "\t",
                            field.name,
                            "\t",
                            fullname(field),
                        )

                    print("\t", "count", m.objects.count())
                    LIMIT = 10000
                    all_objects = m.objects.order_by("id").all()

                    paginator = Paginator(all_objects, LIMIT)

                    for page_num in paginator.page_range:
                        page = paginator.get_page(page_num)
                        for object in page:
                            values = object.__dict__
                            for field in file_fields:
                                if values.get(field.name):
                                    target_file_name = (
                                        "./media/account/" + account_id_to_keep + "/" + values.get(field.name)
                                    )

                                    record = {
                                        "source": values.get(field.name),
                                        "destination": target_file_name,
                                        "model": object.__class__.__qualname__,
                                        "field_name": field.name,
                                        "id": object.id,
                                    }
                                    csv_writer.writerows([record])


#
# this "replace" the process to extract an "account of the saas" and more specifically the copy_account_files task
#
# since downloading from s3 is slow, doing it on a machine "nearer" (like our bastion machine helps a lot)
# so this task generate an csv with all the files to download (that we will upload to s3 afterwards)
# and the the bastion will run a ruby script to download these files in parallel at max speed
# for the moment I kept the "copy_account_files" command since I'm not sharing the download script here
# if the the next extract is working well, we should probably delete the copy_account_files_command
#
# exemple usage : docker-compose run --rm iaso manage list_account_files --account 17


class Command(BaseCommand):
    help = "Generate a list of files to copy to a local directory"

    def add_arguments(self, parser):
        parser.add_argument("--account", type=str)

    def handle(self, *args, **options):
        account_id_to_keep = options.get("account")

        print("Listing files from S3 to extract for a given account")

        print("all models that have a FileField")
        for ct in ContentType.objects.all():
            m = ct.model_class()
            if m:
                file_fields = []
                for field in m._meta.get_fields():
                    if fullname(field) == "django.db.models.fields.files.FileField":
                        file_fields.append(field)

                if len(file_fields) > 0:
                    print(m.__module__, m.__name__, file_fields)

        model_and_fields_with_files(account_id_to_keep)
