from django.conf.urls import url
from . import views


urlpatterns = [
    url(r'^signin', view=views.signin, name='signin'),
    url(r'^user_signin', view=views.user_signin, name='signin'),
    url(r'^image_upload/$', views.image_upload, name='imageupload'),
    url(r'^video_upload/$', views.video_upload, name='videoupload'),
    url(r'^device_event_form/(?P<device_id>\d+)/$', views.device_event_form, name='device_event_form')
]
