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


router = routers.DefaultRouter()

router.register(r"orgunits", OrgUnitViewSet, base_name="orgunits")
router.register(r"orgunittypes", OrgUnitTypeViewSet, base_name="orgunittypes")
router.register(r"instances", InstancesViewSet, base_name="instances")
router.register(r"forms", FormsViewSet, base_name="forms")
router.register(r"iasodevices", IasoDevicesViewSet, base_name="iasodevices")
router.register(
    r"iasodevicesownership",
    IasoDevicesOwnershipViewSet,
    base_name="iasodevicesownership",
)
router.register(r"datasources", DataSourceViewSet, base_name="datasources")
router.register(r"sourceversions", SourceVersionViewSet, base_name="sourceversion")
router.register(r"links", LinkViewSet, base_name="links")
urlpatterns = [url(r"^", include(router.urls))]
