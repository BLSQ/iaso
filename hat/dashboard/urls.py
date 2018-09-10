from django.conf.urls import url
from . import views

app_name = 'dashboard'

urlpatterns = [
    # url(r'^$', views.index, name='index'),
    # this app takes gives the rest parameters to redux router
    url(r'^home/.*$', views.home, name='home'),
    url(r'^monthly-report/.*$', views.monthly_report, name='monthly_report'),
    url(r'^stats/.*$', views.stats, name='stats'),
    url(r'^plannings/micro.*$', views.plannings_micro, name='micro'),
    url(r'^plannings/macro.*$', views.plannings_macro, name='macro'),
    url(r'^plannings/routes.*$', views.plannings_routes, name='routes'),
    url(r'^management/devices.*$', views.device_management, name='management_devices'),
    url(r'^management/teams.*$', views.teams_management, name='management_team'),
    url(r'^management/coordinations.*$', views.coordinations_management, name='management_coord'),
    url(r'^management/workzones.*$', views.workzones_management, name='management_workzone'),
    url(r'^management/plannings.*$', views.plannings_management, name='management_planning'),
    url(r'^management/users.*$', views.users_management, name='management_user'),
    url(r'^locator/list.*$', views.locator, name='locator_list'),
    url(r'^locator/case.*$', views.locator, name='locator'),
    url(r'^vector/.*$', views.vector, name='vector'),
    url(r'^quality-control/.*$', views.quality_control, name='quality-control'),
    url(r'^csvexport/(?P<planning_id>\d+)/$', views.csv_export, name='csv_export'),
    url(r'^password/$', views.change_password, name='change_password'),
]

