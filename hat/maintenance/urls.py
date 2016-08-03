from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^status/(?P<task_id>[a-z0-9-]+)$', views.status, name='status'),
    url(r'^delete-data$', views.delete_data, name='delete_data'),
    url(r'^reimport$', views.reimport, name='reimport'),
]
