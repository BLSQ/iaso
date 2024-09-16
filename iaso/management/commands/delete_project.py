import traceback
import datetime
from collections import defaultdict

import django
from django.contrib.auth.models import User
from django.contrib.sessions.models import Session
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
from iaso.models.base import DataSource, ExternalCredentials, Instance, Mapping, Profile, InstanceFile, InstanceLock
from iaso.models.base import Task, QUEUED, KILLED
from iaso.models.entity import Entity, EntityType
from iaso.models.forms import Form
from iaso.models.microplanning import Assignment, Team, Planning
from iaso.models.org_unit import OrgUnit, OrgUnitReferenceInstance
from iaso.models.pages import Page
from iaso.models.project import Project
from iaso.models.device import Device

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


class Command(BaseCommand):
    help = "Local hosting delete a project, forms, instances,..."

    def add_arguments(self, parser):
        parser.add_argument("--account-to-keep", type=int)
        parser.add_argument("--project-app-id-to-delete", type=str)

    def handle(self, *args, **options):
        print("delete Project")

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

        project_app_id_to_delete = options.get("project_app_id_to_delete")

        for project in account.project_set.order_by("id").all():
            print(project.id, project.name, project.app_id)

        project = account_to_keep.project_set.get(app_id=project_app_id_to_delete)

        print("deleting vector_control_apiimport")
        Form.objects.raw(
            f"delete vector_control_apiimport where headers->>'QUERY_STRING' like 'app_id={project.app_id}%'"
        )
        forms = Form.objects_include_deleted.filter(projects__in=[project])

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
                print(
                    "can't hard delete form ",
                    f,
                )

        print("project", project.delete())
