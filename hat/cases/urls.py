from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^duplicates$', views.duplicatespair_list, name='duplicates_list'),
    url(r'^duplicates/(?P<pair_id>[0-9]+)',
        views.duplicatespair_detail, name='duplicates_details'),
]
