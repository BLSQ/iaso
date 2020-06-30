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
from .jsondocument import JSONDocumentViewSet
from .planning import PlanningViewSet
from .province import ProvinceViewSet
from .qcstats import QCStatsViewSet
from .qctests import QCTestsViewSet
from .screening_types import ScreeningTypeViewSet
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
from .user_levels import UserLevelsViewSet
from .home import HomeViewSet
from .team_types import TeamTypeViewSet
from .problems import ProblemsViewSet
from .qcdetails import QCDetailsViewSet
from .logs import LogsViewSet
from .source_types import SourceTypeViewSet
from .tests_api import TestsViewSet
from .treatments_choices import TreatmentsChoicesViewSet
from .treatments import TreatmentsViewSet
from .cases_user_types import CasesUserTypes


router = routers.DefaultRouter()
router.register(r"plannings", PlanningViewSet, basename="planning")
router.register(r"assignations", AssignationViewSet, basename="assignations")
router.register(r"provinces", ProvinceViewSet, basename="provinces")
router.register(r"as", ASViewSet, basename="as")
router.register(r"zs", ZSViewSet, basename="zs")
router.register(r"coordinations", CoordinationViewSet, basename="coordinations")
router.register(r"teams", TeamViewSet, basename="teams")
router.register(r"villages", VillageViewSet, basename="village")
router.register(r"algo", AlgoViewSet, basename="algo")
router.register(r"cases", CasesViewSet, basename="cases")
router.register(r"qcstats", QCStatsViewSet, basename="qcstats")
router.register(r"qctests", QCTestsViewSet, basename="qctests")
router.register(r"checks", QCChecksViewSet, basename="checks")
router.register(r"qccheckstats", QCCheckStatsViewSet, basename="qc_check_stats")
router.register(r"traps", TrapsViewSet, basename="traps")
router.register(
    r"sites", TrapsViewSet, basename="traps_as_sites"
)  # for compatibility with existing mobile application
router.register(r"new_sites", SitesViewSet, basename="sites")
router.register(r"targets", TargetsViewSet, basename="targets")
router.register(r"catches", CatchesViewSet, basename="catches")
router.register(r"metrics", MetricsViewSet, basename="metrics")
router.register(r"teststats", TestStatsViewSet, basename="teststats")
router.register(r"workzones", WorkZoneViewSet, basename="workzones")
router.register(r"profiles", ProfilesViewSet, basename="profiles")
router.register(r"institutions", InstitutionsViewSet, basename="institutions")
router.register(r"permissions", PermissionsViewSet, basename="permissions")
router.register(r"usertypes", UserTypeViewSet, basename="usertypes")
router.register(r"stats", StatsViewSet, basename="stats")
router.register(r"patients", PatientsViewSet, basename="patients")
router.register(
    r"patientduplicates", PatientDuplicatesViewSet, basename="patientduplicates"
)
router.register(r"villagetypes", VillageTypeViewSet, basename="village_types")
router.register(r"devices", DevicesViewSet, basename="devices")
router.register(r"testsmapping", TestsMappingViewSet, basename="tests_mapping")
router.register(r"habitats", HabitatsViewSet, basename="habitats")
router.register(
    r"vectorapiimports", VectorApiImportViewSet, basename="vectorapiimports"
)
router.register(
    r"vectorgpsimports", VectorGpsImportViewSet, basename="vectorgpsimports"
)
router.register(r"testertypes", TesterTypeViewSet, basename="testertypes")
router.register(r"currentuser", CurrentUserViewSet, basename="currentuser")
router.register(r"userlevels", UserLevelsViewSet, basename="userlevels")
router.register(r"home", HomeViewSet, basename="home")
router.register(r"teamtypes", TeamTypeViewSet, basename="teamtypes")
router.register(r"catchesProblems", ProblemsViewSet, basename="catchesProblems")
router.register(r"qcdetails", QCDetailsViewSet, basename="qcdetails")
router.register(r"sourcetypes", SourceTypeViewSet, basename="sourcetypes")
router.register(r"tests", TestsViewSet, basename="tests")
router.register(r"treatments", TreatmentsViewSet, basename="treatments")
router.register(r"screeningtypes", ScreeningTypeViewSet, basename="screeningtypes")
router.register(r"jsondocument", JSONDocumentViewSet, basename="jsondocument")
router.register(
    r"treatmentschoices", TreatmentsChoicesViewSet, basename="treatmentschoices"
)
router.register(r"casesusertypes", CasesUserTypes, basename="casesusertypes")


router.register(r"logs", LogsViewSet, basename="logs")
urlpatterns = [url(r"^", include(router.urls))]
