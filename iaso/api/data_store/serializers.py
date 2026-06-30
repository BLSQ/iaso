from django.utils.text import slugify
from rest_framework import serializers

from iaso.api.common import TimestampField
from iaso.models.data_store import JsonDataStore


class DataStoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = JsonDataStore
        fields = ["created_at", "updated_at", "key", "data"]
        read_only_fields = ["created_at", "updated_at"]

    data = serializers.JSONField(source="content")
    key = serializers.CharField(source="slug")
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    def validate_data(self, request_data):
        if not request_data:
            raise serializers.ValidationError("data cannot be empty")
        return request_data

    def validate_key(self, request_key):
        if len(request_key) < 1:
            raise serializers.ValidationError("key should be at least 1 character long")

        method = self.context["request"].method
        key_already_exists = JsonDataStore.objects.filter(
            account=self.context["request"].user.iaso_profile.account, slug=request_key
        ).exists()

        # return a 400 when trying to create data with a key that already exists
        if key_already_exists and method == "POST":
            raise serializers.ValidationError(
                f"a data store with the {request_key} key already exists for this account"
            )

        # return a 400 if you're changing an a datastore key to another key that already exists fro the account
        if method == "PUT":
            current_slug = self.instance.slug
            if key_already_exists and current_slug != request_key:
                raise serializers.ValidationError(
                    f"a data store with the {request_key} key already exists for this account"
                )
        return slugify(request_key)

    def create(self, validated_data):
        account = self.context["request"].user.iaso_profile.account
        # Using objects.create will give values to created_at and updated_at, whereas instanciating the class will onlyfill out the values of the fields passed in args
        data_store = JsonDataStore.objects.create(**validated_data, account=account)
        return data_store
