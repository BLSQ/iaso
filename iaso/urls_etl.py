from rest_framework import routers

from iaso.api.instances.views_etl import ETLInstanceViewSet
from iaso.api.org_unit_change_requests.views_etl import ETLOrgUnitChangeRequestViewSet


app_name = "api-etl"


router = routers.DefaultRouter()

router.register(r"validation", ETLInstanceViewSet, basename="instances")
router.register(r"org-unit-change-requests", ETLOrgUnitChangeRequestViewSet, basename="org-unit-change-requests")


urlpatterns = router.urls
