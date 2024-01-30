from plugins.polio.api.urls import router, nested_router
from django.urls import include, path

no_plugin_name_in_path = True

urlpatterns = [
    path(r"", include(router.urls)),
    path(r"", include(nested_router.urls)),
]
