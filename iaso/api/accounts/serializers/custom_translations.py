from iaso.api.common import ModelSerializer
from iaso.models import Account


class AccountCustomTranslationsSerializer(ModelSerializer):
    class Meta:
        model = Account
        fields = [
            "custom_translations",
        ]
        extra_kwargs = {"custom_translations": {"allow_null": True, "required": False, "read_only": True}}
