from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^status/(?P<task_id>[a-z0-9-]+)$', view=views.status, name='status'),
    url(r'^done/(?P<task_id>[a-z0-9-]+)$', view=views.done, name='done'),
    url(r'^get_file/(?P<task_id>[a-z0-9-]+)/(?P<filename>[\w(\.)+]+)$',
        view=views.get_file, name='get_file'),

    url(r'^devices$', view=views.devices_list, name='devices_list'),
    url(r'^events$', view=views.events_list, name='events_list'),

    url(r'^delete-db-data$', view=views.delete_db_data, name='delete_db_data'),
    url(r'^reimport$', view=views.reimport, name='reimport'),
    url(r'^import_synced$', view=views.import_synced, name='import_synced'),
    url(r'^rebuild_duplicates$', view=views.rebuild_duplicates, name='rebuild_duplicates'),

    url(r'^download_events$', view=views.download_events, name='download_events'),
    url(r'^download_events_dump$', view=views.download_events_dump, name='download_events_dump'),
    url(r'^upload_events_dump$', view=views.upload_events_dump, name='upload_events_dump'),
]
