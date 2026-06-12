from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import Account, SourceVersion


class AccountSetDefaultVersionSerializer(ModelSerializer):
    default_version = serializers.PrimaryKeyRelatedField(
        queryset=SourceVersion.objects.none(),
        error_messages={
            "does_not_exist": "Account not allowed to access this default_source.",
        },
        write_only=True,
        required=True,
    )

    class Meta:
        model = Account
        fields = ["default_version"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields["default_version"].queryset = (
            SourceVersion.objects.filter(data_source__projects__account=self.instance)
            .select_related("data_source")
            .distinct()
        )
