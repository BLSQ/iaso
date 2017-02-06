from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^status/(?P<task_id>[a-z0-9-]+)$', views.status, name='status'),
    url(r'^delete-db-data$', views.delete_db_data, name='delete_db_data'),
    url(r'^delete-couchdb-data$', views.delete_couchdb_data, name='delete_couchdb_data'),
    url(r'^reimport$', views.reimport, name='reimport'),
    url(r'^rebuild_duplicates$', views.rebuild_duplicates, name='rebuild_duplicates'),
    url(r'^download_log$', views.download_log, name='download_log'),
]
