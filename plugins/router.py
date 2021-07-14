import importlib

from rest_framework import routers
from django.conf import settings

router = routers.DefaultRouter()


try:
    if settings.PLUGIN_POLIO_ENABLED:
        from .polio.api import router as polio_router

        router.registry.extend(polio_router.registry)
except ImportError:
    print("Polio plugin not installed")


for plugin_name in settings.PLUGINS:
    api = importlib.import_module(f"plugins.{plugin_name}.api")
    if hasattr(api, "router"):
        router.registry.extend(api.router.registry)
    else:
        print(f"No router for plugin {plugin_name}")
