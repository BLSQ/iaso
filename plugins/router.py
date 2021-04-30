from rest_framework import routers
from django.conf import settings

router = routers.DefaultRouter()


try:
    from .polio.api import router as polio_router
    if settings.PLUGIN_POLIO_ENABLED:
        router.registry.extend(polio_router.registry)
except ImportError:
    print("Polio plugin not installed")
