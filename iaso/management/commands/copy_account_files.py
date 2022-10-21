def fullname(o):
    klass = o.__class__
    module = klass.__module__
    if module == "builtins":
        return klass.__qualname__  # avoid outputs like 'builtins.str'
    return module + "." + klass.__qualname__


def model_and_fields_with_files():
    for ct in ContentType.objects.all():
        m = ct.model_class()
        file_fields = [
            field for field in m._meta.get_fields() if fullname(field) == "django.db.models.fields.files.FileField"
        ]
        if len(file_fields) == 0:
            return
        print(m.__module__, m.__name__)
        for field in file_fields:
            print(
                "\t",
                field.name,
                "\t",
                fullname(field),
            )


class Command(BaseCommand):
    help = "Copy account files to another bucket or local directory"

    def add_arguments(self, parser):
        parser.add_argument("--account-to-keep", type=int)

    def handle(self, *args, **options):
        model_and_fields_with_files()
