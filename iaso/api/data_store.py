from iaso.api.common import ModelViewSet
from iaso.models.base import Account
from iaso.models.data_store import JsonDataStore
from rest_framework import serializers, permissions
from drf_yasg.utils import swagger_auto_schema
from django.utils.text import slugify
from hat.menupermissions import models as permission


class DataStoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = JsonDataStore
        fields = ["created_at", "updated_at", "key", "data"]

    data = serializers.JSONField(source="content")  # type: ignore
    key = serializers.CharField(source="slug")

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


class DataStorePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        read_perm = permission.DATASTORE_READ
        write_perm = permission.DATASTORE_WRITE

        if request.method == "GET":
            can_get = (
                request.user
                and request.user.is_authenticated
                and request.user.has_perm(read_perm)
                or request.user.is_superuser
            )
            return can_get
        elif request.method == "POST" or request.method == "PUT" or request.method == "DELETE":
            can_post = (
                request.user
                and request.user.is_authenticated
                and request.user.has_perm(write_perm)
                or request.user.is_superuser
            )
            return can_post
        else:
            return False


@swagger_auto_schema(tags=["datastore"])
class DataStoreViewSet(ModelViewSet):
    http_method_names = ["get", "post", "put", "delete"]
    permission_classes = [DataStorePermission]
    serializer_class = DataStoreSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return JsonDataStore.objects.filter(account=self.request.user.iaso_profile.account)
