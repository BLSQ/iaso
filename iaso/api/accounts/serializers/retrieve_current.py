from django.conf import settings
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import Account, AccountFeatureFlag, DataSource, SourceVersion


class NestedDataSourceSerializer(ModelSerializer):
    url = serializers.CharField(source="credentials.url", read_only=True, allow_null=True)

    class Meta:
        model = DataSource
        fields = ["id", "url", "name", "tree_config_status_fields"]
        read_only_fields = fields


class NestedDefaultVersionSerializer(ModelSerializer):
    data_source = NestedDataSourceSerializer(read_only=True)

    class Meta:
        model = SourceVersion
        fields = ["id", "data_source", "number"]
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
    user_manual_path = serializers.SerializerMethodField()
    forum_path = serializers.SerializerMethodField()

    class Meta:
        model = Account
        fields = [
            "id",
            "name",
            "default_version",
            "other_accounts",
            "modules",
            "feature_flags",
            "user_manual_path",
            "forum_path",
        ]
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
    def get_other_accounts(self, _obj):
        return OtherAccountSerializer(self.other_account_qs, many=True).data

    @extend_schema_field(OpenApiTypes.STR)
    def get_user_manual_path(self, obj):
        return obj.user_manual_path or settings.USER_MANUAL_PATH

    @extend_schema_field(OpenApiTypes.STR)
    def get_forum_path(self, obj):
        return obj.forum_path or settings.FORUM_PATH
