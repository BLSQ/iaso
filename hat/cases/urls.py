from django.conf.urls import url
from . import views

app_name = 'cases'

urlpatterns = [
    url(r'^cases/(?P<doc_id>[a-z0-9]+)', view=views.cases_details, name='cases_details'),
    url(r'^encoding$',
        view=views.encoding, name='encoding'),
]
