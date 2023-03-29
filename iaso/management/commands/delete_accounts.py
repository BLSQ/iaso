import traceback
from collections import defaultdict

import django
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand
from django.db import connection
from django.db.models import Count
from django.db.models import Q
from django.db.models import TextField
from django.db.models.functions import Cast

from hat.audit.models import Modification
from iaso.models import Account, OrgUnitType, CommentIaso, StoragePassword, StorageDevice, StorageLogEntry
from iaso.models import BulkCreateUserCsvFile
from iaso.models import ExportLog, ExportRequest
from iaso.models.base import DataSource, ExternalCredentials, Instance, Mapping, Profile, InstanceFile
from iaso.models.base import Task, QUEUED, KILLED
from iaso.models.entity import Entity, EntityType
from iaso.models.forms import Form
from iaso.models.microplanning import Assignment, Team, Planning
from iaso.models.org_unit import OrgUnit
from iaso.models.pages import Page
from iaso.models.project import Project

from django_sql_dashboard.models import Dashboard


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


def dump_modification_stats():
    for tuple in Modification.objects.values("content_type").annotate(content_type_count=Count("content_type")).all():
        print(ContentType.objects.get(pk=tuple["content_type"]), tuple["content_type_count"])


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
            try:
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
                print("Teams with parents")

                teams = [t for t in Team.objects.order_by("path").all()]
                teams.sort(key=lambda x: str(x.path).count("."), reverse=True)
                # delete leafs before parents
                for team in teams:
                    print("Hard delete team", team, team.path)
                    team.delete_hard()

                datasources = project.data_sources.all()
                for data_source in datasources:
                    print("missing related datasource", datasources)
                    print(
                        InstanceFile.objects.filter(instance__org_unit__version__in=data_source.versions.all()).delete()
                    )
                    print(Instance.objects.filter(org_unit__version__in=data_source.versions.all()).delete())
                print("deleting datasources might take awhile")
                print("datasources", datasources.delete())
                print("StoragePassword", StoragePassword.objects.filter(project=project).delete())
                print("project", project.delete())
            except Exception as err:
                # Sometimes the "delete by project" don't because there are multiple projects sharing a common pyramid
                # the statements outside this will try to take care of it
                # that's why I'm catching the error, and give a chance to the next project and the code below
                traceback.print_exception(type(err), err, err.__traceback__)
                print("can't delete project", project, err, traceback.format_exc())

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

        print(
            "StorageLogEntry",
            StorageLogEntry.objects.filter(device__in=StorageDevice.objects.filter(account=account)).delete(),
        )
        print("StorageDevice", StorageDevice.objects.filter(account=account).delete())

        print("Users", User.objects.filter(iaso_profile__account=account).delete())

        print("Profiles", profiles.delete())

        print("Accounts", account.delete())

        Instance.objects.raw("delete from vector_control_apiimport")

    def delete_modification_logs_and_comments(self):
        dump_modification_stats()

        # this part is a bit brittle, may should become a loop on ContentType.objects.all() ?

        print(
            "instance related",
            Modification.objects.filter(
                content_type=ContentType.objects.get_by_natural_key(app_label="iaso", model="instance")
            )
            .exclude(
                object_id__in=Instance.objects.all().annotate(id_as_str=Cast("id", TextField())).values("id_as_str")
            )
            .delete(),
        )

        print(
            "form related",
            Modification.objects.filter(
                content_type=ContentType.objects.get_by_natural_key(app_label="iaso", model="form")
            )
            .exclude(object_id__in=Form.objects.all().annotate(id_as_str=Cast("id", TextField())).values("id_as_str"))
            .delete(),
        )

        orgunit_content_type = ContentType.objects.get_by_natural_key(app_label="iaso", model="orgunit")

        print(
            "orgunit related",
            Modification.objects.filter(content_type=orgunit_content_type)
            .exclude(
                object_id__in=OrgUnit.objects.all().annotate(id_as_str=Cast("id", TextField())).values("id_as_str")
            )
            .delete(),
        )
        print(
            "Comments on orgunit to clean",
            CommentIaso.objects.filter(content_type=orgunit_content_type)
            .exclude(
                object_pk__in=OrgUnit.objects.all().annotate(id_as_str=Cast("id", TextField())).values("id_as_str")
            )
            .delete(),
        )

        dump_modification_stats()

    def handle(self, *args, **options):
        account_id_to_keep = options.get("account_to_keep")
        if account_id_to_keep is None:
            for account in Account.objects.order_by("id").all():
                print(account.id, account.name)
            raise Exception("No account id provided via --account-to-keep")
        for account in Account.objects.order_by("id").all():
            print(account.id, account.name)
        account_to_keep = Account.objects.get(pk=account_id_to_keep)
        print("*****")
        print("keeping", account_id_to_keep, account_to_keep)

        print("****** counting")
        print("   the first time is slow tons of audit_modification and apiimports")
        counts_before = dump_counts()

        print("keeping ", account_to_keep.name)
        accounts = Account.objects.filter(~Q(id=account_id_to_keep)).order_by("id")
        print("all the others")

        cursor = connection.cursor()

        # OLD triplelym table, it's safe
        try:
            cursor.execute("delete from users_profile")
        except django.db.utils.ProgrammingError:
            pass
        # audit log, hard to clean, so keeping them in the saas db but no in the tenant db
        cursor.execute("delete from vector_control_apiimport")

        # See discussion, submission that were created but not assigned to a project/user
        # iaso.models.project.Project.DoesNotExist: Could not find project for user AnonymousUser
        # https://bluesquare.slack.com/archives/C032F8GFAUD/p1668423313730229?thread_ts=1668006249.898909&cid=C032F8GFAUD

        print(
            "Delete unrelated file instances",
            InstanceFile.objects.filter(
                instance__in=Instance.objects.filter(project=None, form=None, org_unit=None)
            ).delete(),
        )
        print("Delete unrelated instances", Instance.objects.filter(project=None, form=None, org_unit=None).delete())

        print(
            "Avoid running queued tasks once restarting on new server : ",
            Task.objects.filter(status=QUEUED).update(status=KILLED),
        )

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

        forms_without_projects = [f for f in Form.objects_include_deleted.all() if len(f.projects.all()) == 0]

        print(
            "Delete unrelated file instances (forms without project)",
            InstanceFile.objects.filter(instance__in=Instance.objects.filter(form__in=forms_without_projects)).delete(),
        )

        print(
            "Delete unrelated instances (forms without project)",
            Instance.objects.filter(form__in=forms_without_projects).delete(),
        )

        print("******* delete unrelated projects")

        print(Project.objects.filter(account=None).delete())
        print(Form.objects_include_deleted.filter(form_id=None).delete())

        for f in forms_without_projects:
            print(OrgUnitType.objects.filter(reference_form=f).update(reference_form=None))
            f.org_unit_types.clear()
            print("deleting hard", f.name)
            f.delete_hard()

        print("sql dashboard", Dashboard.objects.all().delete())

        cursor.execute(
            "delete from iaso_exportrequest where id not in ( select export_request_id from iaso_exportstatus )"
        )

        print("******* Deleting Modification (might take a while too)")

        self.delete_modification_logs_and_comments()

        print("******* Starting delete of orphaned export log")

        print("Delete orphaned export log", ExportLog.objects.filter(exportstatus=None).count())

        # This table is so big and the content too, that django is fetching all the deleted models (not only the id)
        # that I had to delete it with this strange construct deleting by x records and via sql instead of django queryset .delete()
        has_more_export_logs = True
        while has_more_export_logs:
            export_logs_ids = ExportLog.objects.filter(exportstatus=None).values_list("id", flat=True)[0:500]
            if len(export_logs_ids) > 0:
                cursor.execute(
                    "delete from iaso_exportlog where id in (" + ",".join([str(id) for id in export_logs_ids]) + " )"
                )
                print("deleted", export_logs_ids)
            has_more_export_logs = len(export_logs_ids) > 0

        # raise err
        counts_after = dump_counts()

        dump_diffs(counts_before, counts_after)
        print("******* Review external credentials left")
        for ext_cred in ExternalCredentials.objects.all():
            print(ext_cred.url, ext_cred.login, ext_cred.name)

        print("Done !")
