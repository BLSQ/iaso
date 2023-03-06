import pprint
from plugins.polio.tasks.refresh_preparedness_data import refresh_data
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def refresh_preparedness_data(request):

    the_task = refresh_data()
    print(f"Task {the_task} created")
    the_task()
    print(f"Task {the_task} launched")
    pprint.pprint(the_task.as_dict())
