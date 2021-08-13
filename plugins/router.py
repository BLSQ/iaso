import importlib

from rest_framework import routers
from django.conf import settings

router = routers.DefaultRouter()


for plugin_name in settings.PLUGINS:
    api = importlib.import_module(f"plugins.{plugin_name}.api")
    if hasattr(api, "router"):
        router.registry.extend(api.router.registry)
    else:
        print(f"No router for plugin {plugin_name}")
