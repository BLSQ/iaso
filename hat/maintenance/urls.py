from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^status/(?P<task_id>[a-z0-9-]+)$', views.status, name='status'),
    url(r'^done/(?P<task_id>[a-z0-9-]+)$', views.done, name='done'),
    url(r'^delete-db-data$', views.delete_db_data, name='delete_db_data'),
    url(r'^reimport$', views.reimport, name='reimport'),
    url(r'^rebuild_duplicates$', views.rebuild_duplicates, name='rebuild_duplicates'),
    url(r'^download_events$', views.download_events, name='download_events'),
    url(r'^download_events_dump$', views.download_events_dump, name='download_events_dump'),
    url(r'^events_dump_done/(?P<task_id>[a-z0-9-]+)$',
        views.events_dump_done, name='events_dump_done'),
    url(r'^get_events_dump/(?P<task_id>[a-z0-9-]+)$',
        views.get_events_dump, name='get_events_dump'),
    url(r'^upload_events_dump$', views.upload_events_dump, name='upload_events_dump'),
    url(r'^clean_events$', views.clean_events, name='clean_events'),
    url(r'^import_synced$', views.import_synced, name='import_synced'),
    url(r'^devices$', view=views.devices_list, name='devices_list'),
]
