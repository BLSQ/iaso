from drf_spectacular.utils import extend_schema

from iaso.api.common import ModelViewSet
from iaso.api.data_store.permissions import DataStorePermission
from iaso.api.data_store.serializers import DataStoreSerializer
from iaso.models.data_store import JsonDataStore
from iaso.permissions.core_permissions import CORE_DATASTORE_READ_PERMISSION, CORE_DATASTORE_WRITE_PERMISSION


@extend_schema(tags=["Data store"])
class DataStoreViewSet(ModelViewSet):
    f"""Data store API

    This API is restricted to authenticated users having the "{CORE_DATASTORE_READ_PERMISSION}" permission
    for read operations and the "{CORE_DATASTORE_WRITE_PERMISSION}" permission for write operations.

    GET /api/datastore/
    GET /api/datastore/<slug>/
    POST /api/datastore/
    PUT /api/datastore/<slug>/
    DELETE /api/datastore/<slug>/
    """

    http_method_names = ["get", "post", "put", "delete"]
    permission_classes = [DataStorePermission]
    serializer_class = DataStoreSerializer
    lookup_field = "slug"
    lookup_url_kwarg = "slug"

    def get_queryset(self):
        return JsonDataStore.objects.filter(account=self.request.user.iaso_profile.account)

    @extend_schema(responses={204: None})
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
