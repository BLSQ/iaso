from django.conf.urls import url
from . import views

urlpatterns = [
    # url(r'^$', views.index, name='index'),
    # this app takes gives the rest parameters to redux router
    url(r'^home/.*$', views.home, name='home'),
    url(r'^testapp/.*$', views.testapp, name='testapp'),
    url(r'^monthly-report/.*$', views.monthly_report, name='monthly_report'),
    url(r'^suspect-cases/.*$', views.suspect_cases, name='suspect_cases'),
    url(r'^gis-tools/.*$', views.gis_tools, name='gis_tools'),
]
