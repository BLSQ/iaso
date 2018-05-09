from django.conf.urls import url
from . import views

app_name = 'dashboard'

urlpatterns = [
    # url(r'^$', views.index, name='index'),
    # this app takes gives the rest parameters to redux router
    url(r'^home/.*$', views.home, name='home'),
    url(r'^monthly-report/.*$', views.monthly_report, name='monthly_report'),
    url(r'^stats/.*$', views.stats, name='stats'),
    url(r'^microplanning/plannings$', views.plannings, name='plannings'),
    url(r'^microplanning/planning/©', views.planning, name='planning'),
    url(r'^microplanning/coordination/(?P<coordination_id>\d+)$', views.coordination, name='coordination'),
    url(r'^microplanning/.*$', views.microplanning, name='microplanning'),
    url(r'^microplanning/routes.*$', views.microplanning, name='microplanning_routes'),
    url(r'^management/.*$', views.device_management, name='management'),
    url(r'^management/devices.*$', views.device_management, name='management_devices'),
    url(r'^management/teams.*$', views.managementAll, name='management_team'),
    url(r'^management/coordinations.*$', views.managementAll, name='management_coord'),
    url(r'^management/plannings.*$', views.managementAll, name='management_planning'),
    url(r'^locator/.*$', views.locator, name='locator'),
    url(r'^vector/.*$', views.vector, name='vector'),
    url(r'^quality-control/.*$', views.quality_control, name='quality-control'),
    url(r'^csvexport/(?P<planning_id>\d+)/$', views.csv_export, name='csv_export')
]
