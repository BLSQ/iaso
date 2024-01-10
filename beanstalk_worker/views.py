import http

from datetime import timedelta

from django.apps import apps
from django.contrib.auth.models import User
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

from iaso.models.base import Task, RUNNING, QUEUED

from . import task_service
from logging import getLogger

logger = getLogger(__name__)


@csrf_exempt
def task(request):
    task_service.run_task(request.body)
    return HttpResponse()


@csrf_exempt
def cron(request):
    module, method = request.headers["x-aws-sqsd-taskname"].rsplit(".", 1)
    task_service.run(module, method, [], {})
    return HttpResponse()


@csrf_exempt
def run_all(request):
    count = task_service.run_all()

    return HttpResponse(f"Ran {count} tasks")


@csrf_exempt
def task_launcher(request, task_name: str, user_name: str):
    if task_name.startswith("plugins.polio") and not apps.is_installed("plugins.polio"):
        error = f"Skipping task {task_name}: because polio plugin is not enabled"
        logger.info(error)
        return JsonResponse(
            {"status": "skipped", "error": error},
            status=http.HTTPStatus.BAD_REQUEST,
        )
    try:
        the_user = User.objects.get(username=user_name)
    except User.DoesNotExist:
        return JsonResponse({"status": "fail", "error": f"User not found for {user_name}"})
    except Exception as e:
        logger.exception(e)
        return JsonResponse(
            {"status": "fail", "error": f"Error while loading user {user_name}", "error_details": str(e)},
            status=http.HTTPStatus.BAD_REQUEST,
        )

    try:
        task_module_str: str
        task_module_str, task_fn_str = task_name.rsplit(sep=".", maxsplit=1)
    except Exception as e:
        logger.exception("Error while loading task")
        return JsonResponse(
            {
                "status": "fail",
                "error": f"Bad task name argument {task_name}. Should be module.function",
                "error_details": str(e),
            },
            status=http.HTTPStatus.BAD_REQUEST,
        )
    try:
        import importlib

        task_module = importlib.import_module(task_module_str)
        the_task_fn = getattr(task_module, task_fn_str)

    except Exception as e:
        logger.exception("Error while loading task")
        return JsonResponse(
            {
                "status": "fail",
                "error": f"Error while loading task {task_name} - {task_module_str} : {task_fn_str}",
                "error_details": str(e),
            },
            status=http.HTTPStatus.BAD_REQUEST,
        )

    time_threshold = timezone.now() - timedelta(hours=12)
    running_tasks_count = Task.objects.filter(
        launcher=the_user,
        params__method=task_fn_str,
        params__module=task_module_str,
        status__in=[RUNNING, QUEUED],
        created_at__gte=time_threshold,
    ).count()

    if running_tasks_count > 0:
        return JsonResponse(
            {
                "status": "fail",
                "error": f"Error while launching the task {task_name} - already running for this user and in the last 12 hours",
            },
            status=http.HTTPStatus.OK,
        )

    call_args = {"user": the_user}
    try:
        if len(request.POST) > 0:
            call_args = {**call_args, **request.POST}

        if len(request.GET) > 0:
            call_args = {**call_args, **request.GET}

        the_task = the_task_fn(**call_args)
        return JsonResponse({"status": "success", "task": the_task.as_dict()}, status=http.HTTPStatus.OK)

    except Exception as e:
        logger.exception(e)
        return JsonResponse(
            {
                "status": "fail",
                "error": f"Error while launching the task {task_name} with call args {call_args}",
                "error_details": str(e),
            },
            status=http.HTTPStatus.BAD_REQUEST,
        )
