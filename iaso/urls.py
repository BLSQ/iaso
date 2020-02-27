from django.conf.urls import url, include
from rest_framework import routers
from .api.org_units import OrgUnitViewSet

from .api.org_unit_types import OrgUnitTypeViewSet
from .api.instances import InstancesViewSet
from .api.iaso_devices import IasoDevicesViewSet
from .api.iaso_devices_ownership import IasoDevicesOwnershipViewSet
from .api.data_sources import DataSourceViewSet
from .api.source_versions import SourceVersionViewSet
from .api.forms import FormsViewSet
from .api.links import LinkViewSet
from .api.profiles import ProfilesViewSet
from .api.algorithms import AlgorithmsViewSet
from .api.algorithms_runs import AlgorithmsRunsViewSet
from .api.groups import GroupsViewSet
from .api.periods import PeriodsViewSet
from .api.completeness import CompletenessViewSet
from .api.period_types import PeriodTypesViewSet
from .api.instance_status import InstanceStatusViewSet
from iaso.models import MatchingAlgorithm
from iaso import matching
import pkgutil

router = routers.DefaultRouter()

router.register(r"orgunits", OrgUnitViewSet, base_name="orgunits")
router.register(r"orgunittypes", OrgUnitTypeViewSet, base_name="orgunittypes")
router.register(r"instances", InstancesViewSet, base_name="instances")
router.register(r"forms", FormsViewSet, base_name="forms")
router.register(r"periods", PeriodsViewSet, base_name="periods")
router.register(r"iasodevices", IasoDevicesViewSet, base_name="iasodevices")
router.register(
    r"iasodevicesownership",
    IasoDevicesOwnershipViewSet,
    base_name="iasodevicesownership",
)
router.register(r"datasources", DataSourceViewSet, base_name="datasources")
router.register(r"sourceversions", SourceVersionViewSet, base_name="sourceversion")
router.register(r"links", LinkViewSet, base_name="links")
router.register(r"profiles", ProfilesViewSet, base_name="profiles")
router.register(r"algorithms", AlgorithmsViewSet, base_name="algorithms")
router.register(r"algorithmsruns", AlgorithmsRunsViewSet, base_name="algorithmsruns")
router.register(r"groups", GroupsViewSet, base_name="groups")
router.register(r"completeness", CompletenessViewSet, base_name="completeness")
router.register(r"period_types", PeriodTypesViewSet, base_name="period_types")
router.register(r"instance_status", InstanceStatusViewSet, base_name="instance_status")
urlpatterns = [url(r"^", include(router.urls))]


##########   creating algorithms in the database so that they will appear in the API  ##########
import importlib

for pkg in pkgutil.iter_modules(matching.__path__):
    full_name = "iaso.matching." + pkg.name
    algo_module = importlib.import_module(full_name)
    algo = algo_module.Algorithm()
    MatchingAlgorithm.objects.get_or_create(
        name=full_name, defaults={"description": algo.description}
    )
