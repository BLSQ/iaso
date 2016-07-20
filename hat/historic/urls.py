from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^upload$', views.upload, name='upload'),
    url(r'^upload-state/(?P<task_id>[a-z0-9-]+)$', views.upload_state, name='upload_state'),
    url(r'^upload-done/(?P<task_id>[a-z0-9-]+)$', views.upload_done, name='upload_done'),
    url(r'^download$', views.download, name='download'),
    url(r'^download-state/(?P<task_id>[a-z0-9-]+)$', views.download_state, name='download_state'),
    url(r'^download-done/(?P<task_id>[a-z0-9-]+)$', views.download_done, name='download_done'),
    url(r'^download-get/(?P<task_id>[a-z0-9-]+)$', views.download_get, name='download_get'),
]
