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
    url(r'^management/detail/deviceId/.*$', views.device_management, name='management_devices_details'),
    url(r'^management/teams/.*$', views.teams_management, name='management_team'),
    url(r'^management/detail/teamId/.*$', views.teams_management, name='management_team_details'),
    url(r'^management/coordinations.*$', views.coordinations_management, name='management_coord'),
    url(r'^management/workzones.*$', views.workzones_management, name='management_workzone'),
    url(r'^management/plannings.*$', views.plannings_management, name='management_planning'),
    url(r'^management/users.*$', views.users_management, name='management_user'),
    url(r'^management/villages.*$', views.villages_management, name='management_village'),
    url(r'^locator/list.*$', views.locator, name='locator_list'),
    url(r'^locator/case.*$', views.locator, name='locator'),
    url(r'^vector/map.*$', views.vector, name='vector'),
    url(r'^vector/sync.*$', views.vector_sync, name='vector_sync'),
    url(r'^vector/upload.*$', views.vector_upload, name='vector_upload'),
    url(r'^quality-control/.*$', views.quality_control, name='quality-control'),
    url(r'^csvexport/(?P<planning_id>\d+)/$', views.csv_export, name='csv_export'),
    url(r'^xlsxexport/(?P<planning_id>\d+)/$', views.xlsx_export, name='xlsx_export'),
    url(r'^password/$', views.change_password, name='change_password'),
    url(r'^datas/tests.*$', views.cases_list, name='cases_list'),
    url(r'^datas/register/list.*$', views.register, name='register'),
    url(r'^datas/register/detail.*$', views.register_detail, name='register_detail'),
    url(r'^datas/register/duplicates/detail.*$', views.register_duplicates_detail, name='register_duplicates_detail'),
    url(r'^datas/register/duplicates.*$', views.register_duplicates, name='register_duplicates'),
]
