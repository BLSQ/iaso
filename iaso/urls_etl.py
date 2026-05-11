from rest_framework import routers

from iaso.api.instances.views_etl import ETLInstanceViewSet


router = routers.DefaultRouter()

router.register(r"instances", ETLInstanceViewSet, basename="instances")


urlpatterns = router.urls
