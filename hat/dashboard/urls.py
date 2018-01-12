from django.conf.urls import url
from . import views

urlpatterns = [
    # url(r'^$', views.index, name='index'),
    # this app takes gives the rest parameters to redux router
    url(r'^home/.*$', views.home, name='home'),
    url(r'^monthly-report/.*$', views.monthly_report, name='monthly_report'),
    url(r'^stats/.*$', views.stats, name='stats'),
    url(r'^microplanning/plannings$', views.plannings, name='plannings'),
    url(r'^microplanning/planning/(?P<planning_id>\d+)$', views.planning, name='planning'),
    url(r'^microplanning/coordination/(?P<coordination_id>\d+)$', views.coordination, name='coordination'),
    url(r'^microplanning/.*$', views.microplanning, name='microplanning'),
    url(r'^teams-devices/.*$', views.teams_devices, name='teams-devices'),
]
