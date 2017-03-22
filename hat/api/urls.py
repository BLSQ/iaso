from django.conf.urls import url, include
from rest_framework import routers
from .dataset_viewset import DatasetViewSet

router = routers.DefaultRouter()
router.register(r'datasets', DatasetViewSet, base_name='datasets')

urlpatterns = [
    url(r'^', include(router.urls)),
]
