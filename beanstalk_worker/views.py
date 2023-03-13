import json

from django.contrib.auth.models import User
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt

from . import task_service


@csrf_exempt
def task(request):
    task_service.run_task(request.body)
    return HttpResponse()


@csrf_exempt
def cron(request):
    module, method = request.META["HTTP_X_AWS_SQSD_TASKNAME"].rsplit(".", 1)
    task_service.run(module, method, [], {})
    return HttpResponse()


@csrf_exempt
def run_all(request):
    count = task_service.run_all()

    return HttpResponse(f"Ran {count} tasks")


@csrf_exempt
def task_launcher(request, task_name, user_name):
    try:
        the_user = User.objects.get(username=user_name)
    except User.DoesNotExist:
        return JsonResponse({"status": "fail", "error": f"User not found for {user_name}"})
    except Exception as e:
        return JsonResponse(
            {"status": "fail", "error": f"Error while loading user {user_name}", "error_details": str(e)}
        )

    try:
        import importlib

        task_parts = task_name.split(".")
        task_fn_str = task_parts.pop()
        task_module_str = ".".join(task_parts)

        task_module = importlib.import_module(task_module_str)
        the_task_fn = getattr(task_module, task_fn_str)

    except Exception as e:
        return JsonResponse(
            {
                "status": "fail",
                "error": f"Error while loading task {task_name} - {task_module_str} : {task_fn_str}",
                "error_details": str(e),
            }
        )

    try:
        call_args = {"user": the_user}
        if len(request.POST) > 0:
            call_args = {**call_args, **request.POST}

        if len(request.GET) > 0:
            call_args = {**call_args, **request.GET}

        the_task = the_task_fn(**call_args)
        return JsonResponse({"status": "success", "task": the_task.as_dict()})

    except Exception as e:
        return JsonResponse(
            {
                "status": "fail",
                "error": f"Error while launching the task {task_name} with call args {call_args}",
                "error_details": str(e),
            }
        )
