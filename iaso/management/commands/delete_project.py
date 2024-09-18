from django.core.management.base import BaseCommand
from iaso.models import Account
from iaso.models.base import Instance, Mapping, InstanceFile
from iaso.models.forms import Form


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
