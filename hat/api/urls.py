from django.conf.urls import url, include
from rest_framework import routers
from .case_viewset import CaseViewSet
from .dataset_viewset import DatasetViewSet
from .sync import setup_sync_user

router = routers.DefaultRouter()
router.register(r'cases', CaseViewSet, base_name='cases')
router.register(r'datasets', DatasetViewSet, base_name='datasets')

urlpatterns = [
    url(r'^sync', view=setup_sync_user, name='sync'),
    url(r'^', include(router.urls)),
]
