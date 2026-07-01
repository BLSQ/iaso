from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import Account, AccountFeatureFlag, DataSource, SourceVersion


class NestedDataSourceSerializer(ModelSerializer):
    url = serializers.CharField(source="credentials.url", read_only=True, allow_null=True)

    class Meta:
        model = DataSource
        fields = ["id", "url"]
        read_only_fields = fields


class NestedDefaultVersionSerializer(ModelSerializer):
    data_source = NestedDataSourceSerializer(read_only=True)

    class Meta:
        model = SourceVersion
        fields = ["id", "data_source"]
        read_only_fields = fields


class OtherAccountSerializer(ModelSerializer):
    class Meta:
        model = Account
        fields = ["id", "name"]
        read_only_fields = fields


class FeatureFlagNestedSerializer(ModelSerializer):
    class Meta:
        model = AccountFeatureFlag
        fields = ["name", "code"]


class AccountRetrieveCurrentSerializer(ModelSerializer):
    other_accounts = serializers.SerializerMethodField()
    default_version = NestedDefaultVersionSerializer(allow_null=True, required=False)
    feature_flags = FeatureFlagNestedSerializer(allow_null=True, many=True, required=False)

    class Meta:
        model = Account
        fields = ["id", "name", "default_version", "other_accounts", "modules", "feature_flags"]
        read_only_fields = fields

    def __init__(self, *args, **kwargs):
        self.other_account_qs = kwargs.pop("other_account_qs", None)

        super(AccountRetrieveCurrentSerializer, self).__init__(*args, **kwargs)

        if self.other_account_qs is None:
            if getattr(self.context.get("request", None), "user", None):
                self.other_account_qs = (
                    Account.objects.filter_for_user(self.context["request"].user)
                    .exclude(id=self.instance.id)
                    .distinct("id")
                )

    @extend_schema_field(OtherAccountSerializer(many=True, allow_null=True, allow_empty=True))
    def get_other_accounts(self, obj):
        return OtherAccountSerializer(self.other_account_qs, many=True).data
