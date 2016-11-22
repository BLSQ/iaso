from django.conf.urls import url, include
from . import views

import_cases_urlpatterns = [
    url(r'^upload$', views.upload_cases, name='upload'),
    url(r'^state/(?P<task_id>[a-z0-9-]+)$', views.upload_cases_state, name='state'),
    url(r'^done/(?P<task_id>[a-z0-9-]+)$', views.upload_cases_done, name='done'),
]

export_cases_urlpatterns = [
    url(r'^download$', views.download_cases, name='download'),
    url(r'^state/(?P<task_id>[a-z0-9-]+)$', views.download_cases_state, name='state'),
    url(r'^done/(?P<task_id>[a-z0-9-]+)$', views.download_cases_done, name='done'),
    url(r'^get/(?P<task_id>[a-z0-9-]+)$', views.download_cases_get, name='get'),
]

import_locations_urlpatterns = [
    url(r'^upload$', views.upload_locations, name='upload'),
    url(r'^state/(?P<task_id>[a-z0-9-]+)$', views.upload_locations_state, name='state'),
    url(r'^done/(?P<task_id>[a-z0-9-]+)$', views.upload_locations_done, name='done'),
]

import_reconciled_urlpatterns = [
    url(r'^upload$', views.upload_reconciled, name='upload'),
    url(r'^state/(?P<task_id>[a-z0-9-]+)$', views.upload_reconciled_state, name='state'),
    url(r'^done/(?P<task_id>[a-z0-9-]+)$', views.upload_reconciled_done, name='done'),
]


urlpatterns = [
    url('^$', views.index, name='index'),
    url('^import/', include(import_cases_urlpatterns, 'import_cases')),
    url('^export/', include(export_cases_urlpatterns, 'export_cases')),
    url('^import_locations/', include(import_locations_urlpatterns, 'import_locations')),
    url('^import_reconciled/', include(import_reconciled_urlpatterns, 'import_reconciled')),
]
