from django.conf.urls import url, include
from rest_framework import routers

from hat.api.qcchecks import QCChecksViewSet
from .dataset import DatasetViewSet
from .planning import PlanningViewSet
from .village import VillageViewSet
from .province import ProvinceViewSet
from .ZS import ZSViewSet
from .AS import ASViewSet
from .assignation import AssignationViewSet
from .coordination import CoordinationViewSet
from .team import TeamViewSet
from .algo import AlgoViewSet
from .cases import CasesViewSet
from .qcstats import QCStatsViewSet
from .qctests import QCTestsViewSet
from .qc_check_stats import QCCheckStatsViewSet

router = routers.DefaultRouter()
router.register(r'datasets', DatasetViewSet, base_name='datasets')
router.register(r'plannings', PlanningViewSet, base_name='planning')
router.register(r'assignations', AssignationViewSet, base_name='assignations')
router.register(r'provinces', ProvinceViewSet, base_name='provinces')
router.register(r'as', ASViewSet, base_name='as')
router.register(r'zs', ZSViewSet, base_name='zs')
router.register(r'coordinations', CoordinationViewSet, base_name='coordinations')
router.register(r'teams', TeamViewSet, base_name='teams')
router.register(r'villages', VillageViewSet, base_name='village')
router.register(r'algo', AlgoViewSet, base_name='algo')
router.register(r'cases', CasesViewSet, base_name='cases')
router.register(r'qcstats', QCStatsViewSet, base_name='qcstats')
router.register(r'qctests', QCTestsViewSet, base_name='qctests')
router.register(r'checks', QCChecksViewSet, base_name='checks')
router.register(r'qccheckstats', QCCheckStatsViewSet, base_name='qc_check_stats')

urlpatterns = [
    url(r'^', include(router.urls)),
]
