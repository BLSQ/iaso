import pprint

from django.shortcuts import get_object_or_404
from plugins.polio.tasks.refresh_preparedness_data import refresh_data
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.http import JsonResponse


@csrf_exempt
def refresh_preparedness_data(request, launcher_user_id):
    the_user = get_object_or_404(User, pk=launcher_user_id)
    the_task = refresh_data(user=the_user)

    return JsonResponse({"status": "OK", "task": the_task.as_dict()})
