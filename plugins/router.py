import importlib
import importlib.util

from django.conf import settings
from rest_framework import routers


router = routers.DefaultRouter()

for plugin_name in settings.PLUGINS:
    api_spec = importlib.util.find_spec(f"plugins.{plugin_name}.api")
    if api_spec is not None:
        api = importlib.import_module(f"plugins.{plugin_name}.api")
        if hasattr(api, "router"):
            router.registry.extend(api.router.registry)
        else:
            print(f"No router for plugin {plugin_name}")
    else:
        print(f"No api module for plugin {plugin_name}")
