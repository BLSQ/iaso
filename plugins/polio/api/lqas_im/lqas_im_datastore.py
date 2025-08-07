from rest_framework.exceptions import ValidationError

from iaso.api.data_store import DataStoreViewSet
from plugins.polio.api.lqas_im.lqas_data_manager import LqasDataManager


class LqasDataStoreViewSet(DataStoreViewSet):
    def perform_create(self, serializer):
        instance = super().perform_create(serializer)
        manager = LqasDataManager()

        try:
            manager.parse_json_and_create_lqas_activities(serializer.validated_data["data"])
        except Exception as e:
            raise ValidationError(f"LQAS parsing failed: {str(e)}")

        return instance

    def perform_update(self, serializer):
        instance = super().perform_create(serializer)
        manager = LqasDataManager()

        try:
            manager.parse_json_and_update_lqas_activities(serializer.validated_data["data"])
        except Exception as e:
            raise ValidationError(f"LQAS parsing failed: {str(e)}")

        return instance
