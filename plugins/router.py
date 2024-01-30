import importlib

from django.conf import settings
from rest_framework import routers

router = routers.DefaultRouter()

for plugin_name in settings.PLUGINS:
    api = importlib.import_module(f"plugins.{plugin_name}.api")
    if hasattr(api, "router"):
        router.registry.extend(api.router.registry)
    else:
        print(f"No router for plugin {plugin_name}")

    if hasattr(api, "nested_router"):
        router.registry.extend(api.nested_router.registry)
