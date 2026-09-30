import json

from django.core.files.storage import default_storage

from beanstalk_worker import task_decorator
from iaso.models import Task
from iaso.static_data_layers import build_static_data_layer


@task_decorator(task_name="generate_static_data_layer")
def generate_static_data_layer(title: str, input_file: str, description: str = "", task: Task = None):
    """Turn a GeoJSON FeatureCollection of points, uploaded to the default storage, into a static vector tile layer.

    The input goes through the storage rather than the task params, which are kept in the DB and the queue message.
    """
    task.report_progress_and_stop_if_killed(progress_message="Reading input")
    with default_storage.open(input_file) as f:
        feature_collection = json.load(f)

    task.report_progress_and_stop_if_killed(progress_message="Generating tiles")
    launcher = task.launcher
    metadata = build_static_data_layer(
        feature_collection,
        title=title,
        account_id=task.account_id,
        description=description,
        created_by=launcher.username if launcher else None,
        task_id=task.id,
    )
    default_storage.delete(input_file)

    task.report_success_with_result(
        message=f"Static data layer '{title}' generated with {metadata['feature_count']} points",
        result_data=metadata,
    )
