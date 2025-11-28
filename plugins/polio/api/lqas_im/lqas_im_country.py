from iaso.api.common import ModelViewSet, ReadOnlyOrHasPermission
from iaso.api.data_store import DataStoreSerializer
from iaso.models.data_store import JsonDataStore
from iaso.models.project import Project
from plugins.polio.permissions import POLIO_CONFIG_PERMISSION, POLIO_PERMISSION


# Extending DataStore Viewset to give users with polio and polio config permissions access to lqas endpoints in datastore
class LQASIMCountryViewset(ModelViewSet):
    http_method_names = ["get"]
    permission_classes = [ReadOnlyOrHasPermission(POLIO_PERMISSION, POLIO_CONFIG_PERMISSION)]
    serializer_class = DataStoreSerializer
    lookup_field = "slug"

    class Meta:
        model = JsonDataStore
        fields = ["created_at", "updated_at", "key", "data"]

    def get_queryset(self):
        slug = self.kwargs.get("slug", None)
        app_id = self.request.query_params.get("app_id", None)
        user = self.request.user
        if slug is None:
            return JsonDataStore.objects.none()

        queryset = JsonDataStore.objects.filter(slug=slug)
        if not user.is_anonymous:
            queryset = queryset.filter(account=user.iaso_profile.account)
        elif app_id:
            try:
                project = Project.objects.get_for_user_and_app_id(user, app_id)
                queryset = queryset.filter(account=project.account)
            except Project.DoesNotExist:
                pass
        else:
            queryset = JsonDataStore.objects.none()
        return queryset
