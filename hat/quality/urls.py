from django.conf.urls import url
from . import views

app_name = 'quality'

urlpatterns = [
    # url(r'^$', views.index, name='index'),
    # this app takes gives the rest parameters to redux router
    url(r'^quality-control/.*$', views.quality_control, name='quality-control'),
    url(r'^alerts/.*$', views.alerts, name='alerts'),
]
