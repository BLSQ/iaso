from rest_framework import routers

from .registry import PublicRegistryViewSet


router = routers.SimpleRouter()

router.register(r"public/registry", PublicRegistryViewSet, basename="publicregistry")
