from django.conf.urls import url
from . import views


urlpatterns = [
    url(r'^signin', view=views.signin, name='signin'),
    url(r'^image_upload/$', views.image_upload, name='imageupload'),
    url(r'^video_upload/$', views.video_upload, name='videoupload')
]
