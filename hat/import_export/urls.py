from django.conf.urls import url, include
from . import views

import_urlpatterns = [
    url(r'^upload$', views.upload, name='upload'),
    url(r'^state/(?P<task_id>[a-z0-9-]+)$', views.upload_state, name='state'),
    url(r'^done/(?P<task_id>[a-z0-9-]+)$', views.upload_done, name='done'),
]

export_urlpatterns = [
    url(r'^download$', views.download, name='download'),
    url(r'^state/(?P<task_id>[a-z0-9-]+)$', views.download_state, name='state'),
    url(r'^done/(?P<task_id>[a-z0-9-]+)$', views.download_done, name='done'),
    url(r'^get/(?P<task_id>[a-z0-9-]+)$', views.download_get, name='get'),
]

urlpatterns = [
    url('^$', views.index, name='index'),
    url('^import/', include(import_urlpatterns, 'import')),
    url('^export/', include(export_urlpatterns, 'export')),
]
