from django.conf.urls import url
from . import views

app_name = 'cases'

urlpatterns = [
    url(r'^duplicates$', view=views.duplicatespair_list, name='duplicates_list'),
    url(r'^duplicates/(?P<pair_id>[0-9]+)',
        view=views.duplicatespair_detail, name='duplicates_details'),
    url(r'^duplicates/merge/(?P<pair_id>[0-9]+)',
        view=views.duplicatespair_merge, name='duplicates_merge'),
    url(r'^duplicates/ignore/(?P<pair_id>[0-9]+)',
        view=views.duplicatespair_ignore, name='duplicates_ignore'),
    url(r'^cases$', view=views.cases_list, name='cases_list'),
    url(r'^cases/(?P<doc_id>[a-z0-9]+)', view=views.cases_details, name='cases_details'),
    url(r'^analysis$', views.analysis, name='analysis'),
    url(r'^download/status/(?P<task_id>[a-z0-9-]+)$',
        view=views.download_state, name='download_state'),
    url(r'^download/done/(?P<task_id>[a-z0-9-]+)$',
        view=views.download_done, name='download_done'),
    url(r'^download/failed/(?P<task_id>[a-z0-9-]+)$',
        view=views.download_failed, name='download_failed'),
    url(r'^download/get/(?P<task_id>[a-z0-9-]+)$',
        view=views.download_get, name='download_get'),
    url(r'^encoding$',
        view=views.encoding, name='encoding'),
]
