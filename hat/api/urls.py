from django.conf.urls import url, include
from rest_framework import routers
from .dataset import DatasetViewSet
from .planning import PlanningViewSet
from .village import VillageViewSet
from .assignation import AssignationList
router = routers.DefaultRouter()
router.register(r'datasets', DatasetViewSet, base_name='datasets')
router.register(r'plannings', PlanningViewSet, base_name='planning')
router.register(r'villages', VillageViewSet, base_name='village')

urlpatterns = [
    url(r'^', include(router.urls)),
    url(r'^assignations/(?P<planning_id>.+)/(?P<team_id>.+)/$', AssignationList.as_view()),
]
