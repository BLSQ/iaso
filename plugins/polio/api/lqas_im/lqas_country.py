from iaso.api.data_store import DataStoreViewSet
from hat.menupermissions import models as permission
from rest_framework import permissions

from iaso.models.data_store import JsonDataStore


class LQASCountryPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        polio = permission.POLIO
        polio_admin = permission.POLIO_CONFIG

        if request.method == "GET":
            can_get = (
                request.user
                and request.user.is_authenticated
                and ((request.user.has_perm(polio) or request.user.has_perm(polio_admin)) or request.user.is_superuser)
            )
            return can_get
        else:
            return False


# Extending DataStore Viewset to give users with polio and polio config permissions access to lqas endpoints in datastore
class LQASCountryViewset(DataStoreViewSet):
    http_method_names = ["get"]
    permission_classes = [LQASCountryPermission]

    def get_queryset(self):
        return JsonDataStore.objects.filter(account=self.request.user.iaso_profile.account, slug__contains="lqas")
