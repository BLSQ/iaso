from django.conf.urls import url
from . import views

app_name = 'cases'

urlpatterns = [
    url(r'^encoding$',
        view=views.encoding, name='encoding'),
]
