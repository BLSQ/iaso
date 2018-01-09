from django.conf.urls import url, include
from rest_framework import routers
from .dataset import DatasetViewSet
from .planning import PlanningViewSet

router = routers.DefaultRouter()
router.register(r'datasets', DatasetViewSet, base_name='datasets')
router.register(r'planning', PlanningViewSet, base_name='planning')

urlpatterns = [
    url(r'^', include(router.urls)),
]
