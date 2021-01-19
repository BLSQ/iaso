from django.conf import settings
from django.conf.urls import url

from . import views

app_name = "beanstalk_worker"
urlpatterns = [url(fr"^task/$", views.task, name="task"), url(fr"^cron/$", views.cron, name="cron")]

if settings.DEBUG:
    urlpatterns.append(url(fr"^run_all/$", views.run_all, name="run_all"))
