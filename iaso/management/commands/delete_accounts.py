import pdb
from django.db import connection
import traceback
from django.contrib.auth.models import User
from django.db.models import Count
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from django.db import models, transaction
from uuid import uuid4
from collections import defaultdict
from django.db.models import Q
from iaso.models import Account
from django.contrib.admin.utils import NestedObjects
from django.db import router

import random
from django.contrib.admin.utils import NestedObjects
from iaso.models.base import DataSource, ExternalCredentials, Instance, Mapping, Profile, InstanceFile
from iaso.models.entity import Entity, EntityType
from iaso.models.org_unit import OrgUnit
from iaso.models.forms import Form
from iaso.models.pages import Page
from iaso.models import BulkCreateUserCsvFile
from iaso.models.microplanning import Assignment, Team, Planning
from iaso.models.project import Project
from hat.audit.models import Modification
from django.contrib.contenttypes.models import ContentType


def flatten(l):
    return [item for sublist in l for item in sublist]


def fullname(m):
    if m is None:
        return ""
    return m.__module__ + "." + m.__name__


def dump_counts():
    counts = defaultdict()
    print("******************* COUNTS")
    for ct in ContentType.objects.all():
        m = None
        if ct.model_class():
            try:
                m = ct.model_class()
                count = m._default_manager.count()
                # print(m.__module__, m.__name__, count)
                counts[fullname(m)] = count
            except:
                # don't know why (abstract model ? missing migration) but I had to add this catch statement
                # the error raised below :
                # db_1       | 2022-10-19 08:30:32.838 UTC [153] ERROR:  relation "menupermissions_custompermissionsupport" does not exist at character 35
                # db_1       | 2022-10-19 08:30:32.838 UTC [153] STATEMENT:  SELECT COUNT(*) AS "__count" FROM "menupermissions_custompermissionsupport"
                print(fullname(m), "not available")

    print("******************* ")

    return counts


def dump_diffs(counts_before, counts_after):
    print("***** diff")
    print("\t".join(["model", "before", "after", "deleted"]))
    for model in counts_after.keys():
        print(
            "\t".join(
                [
                    model,
                    str(counts_before.get(model, 0)),
                    str(counts_after.get(model, 0)),
                    str(counts_before.get(model, 0) - counts_after.get(model, 0)),
                ]
            )
        )


class Command(BaseCommand):
    help = "Local hosting delete all the data related to other accounts"

    def add_arguments(self, parser):
        parser.add_argument("--account-to-keep", type=int)

    def delete_account(self, account):

        print("************ deleting data related to ", account.id, account.name)

        forms = Form.objects_include_deleted.filter(projects__account=account)

        for form in forms:

            print(
                "InstanceFile without project",
                InstanceFile.objects.filter(instance__form=form, instance__project=None).delete(),
            )

            print("Instance without project", Instance.objects.filter(form=form, project=None).delete())

            print(
                form.name,
                Instance.objects.filter(form=form)
                .values("project__name")
                .annotate(Count("project__name", distinct=True)),
            )

        projects = Project.objects.filter(account=account)
        for project in projects:
            Form.objects.raw(
                f"delete vector_control_apiimport where headers->>'QUERY_STRING' like 'app_id={project.app_id}%'"
            )
            forms = Form.objects_include_deleted.filter(projects__in=[project])

            print(
                "OrgUnit remove reference_instance",
                OrgUnit.objects.filter(reference_instance__in=Instance.objects.filter(project=project)).update(
                    reference_instance=None
                ),
            )
            print("Instance update", Instance.objects.filter(project=project).update(entity=None))
            print("Entity", Entity.objects.filter(account=account).delete())
            print("EntityType", EntityType.objects.filter(account=account).delete())
            print(
                "InstanceFile delete",
                InstanceFile.objects.filter(instance__in=Instance.objects.filter(project=project)).delete(),
            )
            print("Instance delete", Instance.objects.filter(project=project).delete())
            print("InstanceFile delete", InstanceFile.objects.filter(instance__form__in=forms).delete())
            print("Instance delete", Instance.objects.filter(form__in=forms).delete())
            print("Mapping", Mapping.objects.filter(form__in=forms).delete())
            print("Forms", [f.name for f in forms])
            for f in forms:
                try:
                    print("Instance delete", Instance.objects.filter(form__in=forms).delete())
                    f.delete_hard()
                except:
                    print("can't hard delete form ", f, "soft deleting")
                    f.delete()

            print(
                "Assignment",
                Assignment.objects.filter(team__in=Team.objects.filter(project=project)).delete(),
            )
            print("Planning", Planning.objects.filter(project=project).delete())
            print(
                "Team children",
                Team.objects.filter(parent__in=Team.objects.filter(project=project)).delete(),
            )
            print("Team", Team.objects.filter(project=project).delete())

            datasources = project.data_sources.all()
            for data_source in datasources:
                print("missing related datasource", datasources)
                print(InstanceFile.objects.filter(instance__org_unit__version__in=data_source.versions.all()).delete())
                print(Instance.objects.filter(org_unit__version__in=data_source.versions.all()).delete())
            print("datasources", datasources.delete())
            print("project", project.delete())

        forms = Form.objects_include_deleted.filter(projects__account=account)
        forms.delete()
        print("Page", Page.objects.filter(account=account).delete())

        profiles = Profile.objects.filter(account=account)
        print("User related resources (might take minutes due to modification log)")
        print(
            "Modification done account users ",
            Modification.objects.filter(user__in=[p.user for p in profiles.all()]).delete(),
        )

        print(
            "BulkCreateUserCsvFile",
            BulkCreateUserCsvFile.objects.filter(created_by__in=[p.user for p in profiles.all()]).delete(),
        )

        print("users_profile (tripl old table)")
        User.objects.raw("delete from users_profile")

        print(
            "Instance created_by",
            Instance.objects.filter(created_by__in=User.objects.filter(iaso_profile__account=account)).delete(),
        )
        print(
            "Instance last_modified_by",
            Instance.objects.filter(last_modified_by__in=User.objects.filter(iaso_profile__account=account)).delete(),
        )

        print("Users", User.objects.filter(iaso_profile__account=account).delete())

        print("Profiles", profiles.delete())

        print("Accounts", account.delete())

        Instance.objects.raw("delete from vector_control_apiimport")

    def handle(self, *args, **options):
        account_id_to_keep = options.get("account_to_keep")
        if account_id_to_keep is None:
            for account in Account.objects.all():
                print(account.id, account.name)
            raise Exception("No account id provided via --account-to-keep")
        for account in Account.objects.all():
            print(account.id, account.name)
        account_to_keep = Account.objects.get(pk=account_id_to_keep)
        print("*****")
        print("keeping", account_id_to_keep, account_to_keep)

        counts_before = dump_counts()

        print("keeping ", account_to_keep.name)
        accounts = Account.objects.filter(~Q(id=account_id_to_keep))
        print("all the others")

        cursor = connection.cursor()
        # OLD triplelym table, it's safe
        cursor.execute("delete from users_profile")
        # audit log, hard to clean, so keeping them in the saas db but no in the tenant db
        cursor.execute("delete from vector_control_apiimport")

        for account in accounts:
            try:
                # with transaction.atomic():
                self.delete_account(account)

                # uncomment to dry run
                # raise Exception("don't delete for now")
            except Exception as err:
                traceback.print_exception(type(err), err, err.__traceback__)
                print("can't delete account", account, err, traceback.format_exc())

        # TODO delete remaining
        # iaso.models.base.DataSource	27	27	0
        # iaso.models.base.SourceVersion	38	38	0

        projects = Project.objects.filter(account=account_to_keep)
        datasources_to_keep = flatten([p.data_sources.all() for p in projects])
        datasources_to_delete = DataSource.objects.filter(~Q(id__in=[ds.id for ds in datasources_to_keep]))
        print("**** Delete orphan datasources unused by the account to keep")
        for data_source in datasources_to_delete.all():
            print(data_source.id, data_source.name, data_source.description)
            print(InstanceFile.objects.filter(instance__org_unit__version__in=data_source.versions.all()).delete())
            print(Instance.objects.filter(org_unit__version__in=data_source.versions.all()).delete())

        print(datasources_to_delete.delete())

        # raise err
        counts_after = dump_counts()

        dump_diffs(counts_before, counts_after)
        print("******* Review external credentials left")
        for ext_cred in ExternalCredentials.objects.all():
            print(ext_cred.url, ext_cred.login, ext_cred.name)
