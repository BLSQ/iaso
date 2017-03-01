from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^duplicates$', views.duplicatespair_list, name='duplicates_list'),
    url(r'^duplicates/(?P<pair_id>[0-9]+)',
        views.duplicatespair_detail, name='duplicates_details'),
    url(r'^duplicates/merge/(?P<pair_id>[0-9]+)',
        views.duplicatespair_merge, name='duplicates_merge'),
    url(r'^duplicates/ignore/(?P<pair_id>[0-9]+)',
        views.duplicatespair_ignore, name='duplicates_ignore'),
    url(r'^cases$', views.cases_list, name='cases_list'),
    url(r'^cases/(?P<doc_id>[a-z0-9]+)', views.cases_details, name='cases_details'),
    url(r'^analysis$', views.analysis, name='analysis'),
]
