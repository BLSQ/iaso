from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^gpx_upload/$', views.gpx_upload, name='gpxupload'),
]
