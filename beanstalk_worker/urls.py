from django.conf import settings
from django.urls import path

from . import views

app_name = "beanstalk_worker"
urlpatterns = [
    path("task/", views.task, name="task"),
    path("cron/", views.cron, name="cron"),
    path("launch_task/<task_name>/<user_name>/", views.task_launcher, name="launch_task"),
]

if settings.DEBUG:
    urlpatterns.append(path("run_all/", views.run_all, name="run_all"))
