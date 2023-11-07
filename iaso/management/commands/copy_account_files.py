import os
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


def model_and_fields_with_files(account_id_to_keep, model_to_copy, offset):
    for ct in ContentType.objects.all():
        m = ct.model_class()
        skip = False
        if m:
            if model_to_copy and m.__name__ == model_to_copy:
                skip = False
            elif model_to_copy is None:
                skip = False
            else:
                skip = True

        if m and not skip:
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
                all_objects = (
                    m.objects.order_by("id").all()[offset : offset + LIMIT]
                    if offset
                    else m.objects.order_by("id").all()
                )

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

                                if not os.path.exists(target_file_name):
                                    # avoid touching the s3 storage before this line so resuming the copy is faster
                                    file_field = getattr(object, field.name)
                                    os.makedirs(Path(target_file_name).parent.absolute(), exist_ok=True)
                                    with open(target_file_name, "wb") as target_f:
                                        print(
                                            "copying ",
                                            field.name,
                                            object.__class__.__qualname__,
                                            object.id,
                                            " : ",
                                            "from s3 ",
                                            values.get(field.name),
                                            "to",
                                            target_file_name,
                                            "of",
                                            object,
                                        )
                                        target_f.write(file_field.file.read())


class Command(BaseCommand):
    help = "Copy account files to another bucket or local directory"

    def add_arguments(self, parser):
        parser.add_argument("--account", type=str)
        parser.add_argument("--model", type=str, required=False)
        parser.add_argument("--offset", type=int, required=False)

    def handle(self, *args, **options):
        account_id_to_keep = options.get("account")
        model = options.get("model")
        offset = options.get("offset")

        print("Copy files from S3 to other s3 or local directory")

        for ct in ContentType.objects.all():
            m = ct.model_class()
            if m:
                file_fields = []
                for field in m._meta.get_fields():
                    if fullname(field) == "django.db.models.fields.files.FileField":
                        file_fields.append(field)

                if len(file_fields) > 0:
                    print(m.__module__, m.__name__, file_fields)

        model_and_fields_with_files(account_id_to_keep, model, offset)
