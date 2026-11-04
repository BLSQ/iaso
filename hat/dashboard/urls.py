import importlib.util

from django.conf import settings
from django.urls import include, path, re_path

from . import views


app_name = "dashboard"
urlpatterns = [
    path("home/", views.home_iaso, name="home_iaso"),
]

# Plugin modules named dashboard_urls are mounted here, before the catch-all,
# so a plugin can keep a public /dashboard/<plugin>/... page.
for plugin_name in settings.PLUGINS:
    dashboard_urls_module = "plugins." + plugin_name + ".dashboard_urls"
    if importlib.util.find_spec(dashboard_urls_module):
        urlpatterns.append(path("", include(dashboard_urls_module)))

urlpatterns.append(re_path(r"^.*$", views.iaso, name="iaso"))
