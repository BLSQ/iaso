from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from django.db import models, transaction
from uuid import uuid4
from collections import defaultdict
from django.db.models import Q
from iaso.models import Account
from django.contrib.admin.utils import NestedObjects
from django.db import router


from django.contrib.admin.utils import NestedObjects
from iaso.models.base import ExternalCredentials, Instance, Mapping
from iaso.models.forms import Form
from iaso.models.pages import Page
from iaso.models.microplanning import Assignment, Team, Planning
from iaso.models.project import Project
from django.contrib.contenttypes.models import ContentType


def dump_counts():
    counts = defaultdict()
    print("******************* COUNTS")
    for ct in ContentType.objects.all():
        m = ct.model_class()
        try:
            count = m._default_manager.count()
            # print(m.__module__, m.__name__, count)
            counts[m.__module__ + "." + m.__name__] = count
        except:
            # don't know why (abstract model ? missing migration) but I had to add this catch statement
            # the error raised below :
            # db_1       | 2022-10-19 08:30:32.838 UTC [153] ERROR:  relation "menupermissions_custompermissionsupport" does not exist at character 35
            # db_1       | 2022-10-19 08:30:32.838 UTC [153] STATEMENT:  SELECT COUNT(*) AS "__count" FROM "menupermissions_custompermissionsupport"
            print(m.__module__, m.__name__, "not available")
    print("******************* ")

    return counts


def dump_diffs(counts_before, counts_after):
    print("***** diff")
    print("\t".join(["model", "before", "after", "deleted"]))
    for model in counts_before.keys():
        print(
            "\t".join(
                [
                    model,
                    str(counts_before[model]),
                    str(counts_after[model]),
                    str(counts_before[model] - counts_after[model]),
                ]
            )
        )


class Command(BaseCommand):
    help = "Import a complete tree from a csv file"

    def add_arguments(self, parser):
        parser.add_argument("--account-to-keep", type=int)

    def handle(self, *args, **options):

        account_id_to_keep = options.get("account_to_keep")
        if account_id_to_keep is None:
            for account in Account.objects.all():
                print(account.id, account.name)
            raise Exception("No account id provided via --account-to-keep")
        print("keeping", account_id_to_keep)
        account_to_keep = Account.objects.get(pk=account_id_to_keep)

        counts_before = dump_counts()

        print("keeping ", account_to_keep.name)
        accounts = Account.objects.filter(~Q(id=account_id_to_keep))
        print("all the others")

        for account in accounts:
            with transaction.atomic():
                print("deleting data related to ", account.id, account.name)

                projects = Project.objects.filter(account=account)
                for project in projects:
                    forms = Form.objects_include_deleted.filter(projects__account=account)
                    print(Instance.objects.filter(project=project).delete())
                    print(Mapping.objects.filter(form__in=forms).delete())
                    print(forms.delete())
                    print(Assignment.objects.filter(team__in=Team.objects.filter(project=project)).delete())
                    print(Planning.objects.filter(project=project).delete())
                    print(Team.objects.filter(parent__in=Team.objects.filter(project=project)).delete())
                    print(Team.objects.filter(project=project).delete())
                    print(project.delete())

                print(Page.objects.filter(account=account).delete())
                print(account.delete())

        counts_after = dump_counts()

        dump_diffs(counts_before, counts_after)
        print("******* Review external credentials left")
        for ext_cred in ExternalCredentials.objects.all():
            print(ext_cred.url)
