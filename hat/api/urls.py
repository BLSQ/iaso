from django.conf.urls import url, include
from rest_framework import routers

from hat.api.patientduplicates import PatientDuplicatesViewSet
from hat.api.qcchecks import QCChecksViewSet
from .AS import ASViewSet
from .ZS import ZSViewSet
from .algo import AlgoViewSet
from .assignation import AssignationViewSet
from .cases import CasesViewSet
from .coordination import CoordinationViewSet
from .planning import PlanningViewSet
from .province import ProvinceViewSet
from .qcstats import QCStatsViewSet
from .qctests import QCTestsViewSet
from .team import TeamViewSet
from .village import VillageViewSet
from .qc_check_stats import QCCheckStatsViewSet
from .traps import TrapsViewSet
from .sites import SitesViewSet
from .targets import TargetsViewSet
from .metrics import MetricsViewSet
from .teststats import TestStatsViewSet
from .workzone import WorkZoneViewSet
from .profile import ProfilesViewSet
from .institutions import InstitutionsViewSet
from .usertype import UserTypeViewSet
from .permissions import PermissionsViewSet
from .stats import StatsViewSet
from .patients import PatientsViewSet
from .village_types import VillageTypeViewSet
from .devices import DevicesViewSet
from .tests_mapping import TestsMappingViewSet
from .catches import CatchesViewSet
from .habitats import HabitatsViewSet
from .vector_api_import import VectorApiImportViewSet
from .vector_gps_import import VectorGpsImportViewSet
from .tester_types import TesterTypeViewSet
from .current_user import CurrentUserViewSet

router = routers.DefaultRouter()
router.register(r"plannings", PlanningViewSet, base_name="planning")
router.register(r"assignations", AssignationViewSet, base_name="assignations")
router.register(r"provinces", ProvinceViewSet, base_name="provinces")
router.register(r"as", ASViewSet, base_name="as")
router.register(r"zs", ZSViewSet, base_name="zs")
router.register(r"coordinations", CoordinationViewSet, base_name="coordinations")
router.register(r"teams", TeamViewSet, base_name="teams")
router.register(r"villages", VillageViewSet, base_name="village")
router.register(r"algo", AlgoViewSet, base_name="algo")
router.register(r"cases", CasesViewSet, base_name="cases")
router.register(r"qcstats", QCStatsViewSet, base_name="qcstats")
router.register(r"qctests", QCTestsViewSet, base_name="qctests")
router.register(r"checks", QCChecksViewSet, base_name="checks")
router.register(r"qccheckstats", QCCheckStatsViewSet, base_name="qc_check_stats")
router.register(r"traps", TrapsViewSet, base_name="traps")
router.register(r"sites", TrapsViewSet, base_name="traps_as_sites") #for compatibility with existing mobile application
router.register(r"new_sites", SitesViewSet, base_name="sites")
router.register(r"targets", TargetsViewSet, base_name="targets")
router.register(r"catches", CatchesViewSet, base_name="catches")
router.register(r"metrics", MetricsViewSet, base_name="metrics")
router.register(r"teststats", TestStatsViewSet, base_name="teststats")
router.register(r"workzones", WorkZoneViewSet, base_name="workzones")
router.register(r"profiles", ProfilesViewSet, base_name="profiles")
router.register(r"institutions", InstitutionsViewSet, base_name="institutions")
router.register(r"permissions", PermissionsViewSet, base_name="permissions")
router.register(r"usertypes", UserTypeViewSet, base_name="usertypes")
router.register(r"stats", StatsViewSet, base_name="stats")
router.register(r"patients", PatientsViewSet, base_name="patients")
router.register(r"patientduplicates", PatientDuplicatesViewSet, base_name="patientduplicates")
router.register(r"villagetypes", VillageTypeViewSet, base_name="village_types")
router.register(r"devices", DevicesViewSet, base_name="devices")
router.register(r"testsmapping", TestsMappingViewSet, base_name="tests_mapping")
router.register(r"habitats", HabitatsViewSet, base_name="habitats")
router.register(r"vectorapiimports", VectorApiImportViewSet, base_name="vectorapiimports")
router.register(r"vectorgpsimports", VectorGpsImportViewSet, base_name="vectorgpsimports")
router.register(r"testertypes", TesterTypeViewSet, base_name="testertypes")
router.register(r"currentuser", CurrentUserViewSet, base_name="currentuser")


urlpatterns = [url(r"^", include(router.urls))]
