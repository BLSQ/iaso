from django.conf.urls import url, include
from rest_framework import routers
from .case_viewset import CaseViewSet
from .dataset_viewset import DatasetViewSet
from .task_viewset import TaskViewSet, TaskResultViewSet
from .sync import setup_sync_user

router = routers.DefaultRouter()
router.register(r'cases', CaseViewSet, base_name='cases')
router.register(r'datasets', DatasetViewSet, base_name='datasets')
router.register(r'tasks', TaskViewSet, base_name='tasks')
router.register(r'taskresults', TaskResultViewSet, base_name='taskresults')

urlpatterns = [
    url(r'^sync', view=setup_sync_user, name='sync'),
    url(r'^', include(router.urls)),
]
