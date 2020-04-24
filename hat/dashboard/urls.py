from django.conf.urls import url
from . import views
from django.conf import settings

app_name = "dashboard"
if settings.FLAVOR == "trypelim":
    urlpatterns = [
        # url(r'^$', views.index, name='index'),
        # this app takes gives the rest parameters to redux router
        url(r"^home/.*$", views.home, name="home"),
        url(r"^stats/epidemiology.*$", views.epidemiology, name="epidemiology"),
        url(
            r"^stats/data_monitoring.*$", views.data_monitoring, name="data_monitoring"
        ),
        url(r"^stats/reports.*$", views.reports, name="reports"),
        url(r"^plannings/list.*$", views.plannings, name="plannings"),
        url(r"^plannings/micro.*$", views.plannings_micro, name="micro"),
        url(r"^plannings/macro.*$", views.plannings_macro, name="macro"),
        url(r"^plannings/routes.*$", views.plannings_routes, name="routes"),
        url(
            r"^management/devices.*$",
            views.device_management,
            name="management_devices",
        ),
        url(
            r"^management/detail/deviceId/.*$",
            views.device_management,
            name="management_devices_details",
        ),
        url(r"^management/teams/.*$", views.teams_management, name="management_team"),
        url(
            r"^management/detail/teamId/.*$",
            views.teams_management,
            name="management_team_details",
        ),
        url(
            r"^management/coordinations.*$",
            views.coordinations_management,
            name="management_coord",
        ),
        url(
            r"^management/workzones.*$",
            views.workzones_management,
            name="management_workzone",
        ),
        url(r"^management/users.*$", views.users_management, name="management_user"),
        url(
            r"^management/villages.*$",
            views.villages_management,
            name="management_village",
        ),
        url(
            r"^management/logs.*$",
            views.logs,
            name="logs",
        ),
        url(
            r"^management/logs/detail.*$",
            views.log_detail,
            name="log_detail",
        ),
        url(r'^management/zones.*$', views.zones_management, name='management_zone'),
        url(r'^management/areas.*$', views.areas_management, name='management_area'),
        url(r"^locator/list.*$", views.locator, name="locator_list"),
        url(r"^locator/case.*$", views.locator, name="locator"),
        url(r"^vector/map.*$", views.vector, name="vector"),
        url(r"^vector/sync.*$", views.vector_sync, name="vector_sync"),
        url(r"^vector/upload.*$", views.vector_upload, name="vector_upload"),
        url(
            r"^quality-control/dashboard.*$",
            views.quality_control,
            name="quality-control",
        ),
        url(
            r"^quality-control/stats.*$",
            views.quality_control_stats,
            name="quality-control-stats",
        ),
        url(
            r"^quality-control/image.*$",
            views.quality_control_image,
            name="quality-control-image",
        ),
        url(
            r"^quality-control/video.*$",
            views.quality_control_video,
            name="quality-control-video",
        ),
        url(r"^password/$", views.change_password, name="change_password"),
        url(r"^datas/tests.*$", views.cases_list, name="cases_list"),
        url(r"^datas/tests/detail.*$", views.cases_detail, name="cases_detail"),
        url(r"^datas/register/list.*$", views.register, name="register"),
        url(
            r"^datas/register/detail.*$", views.register_detail, name="register_detail"
        ),
        url(
            r"^quality-control/monitoring.*$",
            views.quality_control_monitoring,
            name="quality-control-monitoring",
        ),
        url(
            r"^datas/register/duplicates/detail.*$",
            views.register_duplicates_detail,
            name="register_duplicates_detail",
        ),
        url(
            r"^datas/register/duplicates.*$",
            views.register_duplicates,
            name="register_duplicates",
        ),
        url(r"^datas/monitoring.*$", views.monitoring, name="monitoring"),
    ]
elif settings.FLAVOR == "iaso":
    urlpatterns = [
        url(r"^$", views.iaso, name="iaso"),
        url(r"^forms.*$", views.iaso, name="iaso_forms"),
        url(r"^instances.*$", views.iaso, name="iaso_instances"),
        url(r"^instance.*$", views.iaso, name="iaso_instance_detail"),
        url(r"^orgunits.*$", views.iaso, name="iaso_orgunits"),
        url(r"^orgunits/detail.*$", views.iaso, name="iaso_orgunits_details"),
        url(r"^completeness.*$", views.iaso, name="iaso_completeness"),
        url(r"^settings.*$", views.iaso, name="iaso_settings"),
    ]
