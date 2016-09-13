from django.conf.urls import url, include
from rest_framework import routers
from .case_viewset import CaseViewSet
from .vis_viewset import VisualizationViewSet
from .dataset_viewset import DatasetViewSet

router = routers.DefaultRouter()
router.register(r'cases', CaseViewSet, base_name='cases')
router.register(r'visualizations', VisualizationViewSet, base_name='visualizations')
router.register(r'datasets', DatasetViewSet, base_name='datasets')

urlpatterns = [
    url(r'^', include(router.urls)),
]
