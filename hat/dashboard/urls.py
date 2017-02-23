from django.conf.urls import url
from . import views

urlpatterns = [
    # url(r'^$', views.index, name='index'),
    # this app takes gives the rest parameters to redux router
    url(r'^home/.*$', views.home, name='home'),
    url(r'^testapp/.*$', views.testapp, name='testapp'),
    url(r'^monthly-report/.*$', views.monthly_report, name='monthly_report'),
    url(r'^stats/.*$', views.stats, name='stats'),
    url(r'^microplanning/.*$', views.microplanning, name='microplanning'),
]
