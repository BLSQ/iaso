from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^signin', view=views.signin, name='signin'),
]
