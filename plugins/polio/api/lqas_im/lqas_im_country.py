from iaso.api.data_store import DataStoreViewSet
from iaso.models.data_store import JsonDataStore
from plugins.polio.api.permission_classes import PolioReadPermission


# Extending DataStore Viewset to give users with polio and polio config permissions access to lqas endpoints in datastore
class LQASIMCountryViewset(DataStoreViewSet):
    http_method_names = ["get"]
    permission_classes = [PolioReadPermission]

    def get_queryset(self):
        slug = self.kwargs.get("slug", None)
        if slug:
            return JsonDataStore.objects.filter(account=self.request.user.iaso_profile.account, slug=slug)
        return JsonDataStore.objects.none()
