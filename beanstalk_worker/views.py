from django.http import HttpResponse
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
    task_service.run_all()
    return HttpResponse()
