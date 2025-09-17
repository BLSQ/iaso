from beanstalk_worker import task_decorator
from iaso.models import ExportRequest, Task


@task_decorator(task_name="dhis2_submission_exporter_task")
def process_export_request(export_request_id: int, task: Task):
    export_request = ExportRequest.objects.get(export_request_id)
    DataValueExporter().export_instances(export_request)
