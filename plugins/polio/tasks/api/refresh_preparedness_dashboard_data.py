from datetime import datetime

from rest_framework.response import Response

from iaso.api.tasks.serializers import TaskSerializer
from iaso.api.tasks.views import ExternalTaskModelViewSet
from iaso.models.base import RUNNING, Task


PREPAREDNESS_TASK_NAME = "Refresh Preparedness dashboard data"
PREPAREDNESS_CONFIG_SLUG = "preparedness-pipeline-config"


class RefreshPreparednessDataViewset(ExternalTaskModelViewSet):
    http_method_names = ["get", "patch"]
    model = Task
    task_name = PREPAREDNESS_TASK_NAME
    config_slug = PREPAREDNESS_CONFIG_SLUG

    # Overriding the list method because powerBI sends a GET request
    # So we have to have a GET that behaves like a POST
    def list(self, request):
        user = request.user
        slug = PREPAREDNESS_CONFIG_SLUG
        task = Task.objects.create(
            created_by=user,
            launcher=user,
            account=user.iaso_profile.account,
            name=PREPAREDNESS_TASK_NAME,
            status=RUNNING,
            external=True,
            started_at=datetime.now(),
            should_be_killed=False,
        )
        status = self.launch_task(slug=slug, task_id=task.pk)
        task.status = status
        task.save()
        return Response({"task": TaskSerializer(instance=task).data})

    def get_queryset(self):
        user = self.request.user
        account = user.iaso_profile.account
        queryset = Task.objects.filter(account=account).filter(external=True)
        return queryset
