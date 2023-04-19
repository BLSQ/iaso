from iaso.api.common import ModelViewSet
from iaso.models.data_store import JsonDataStore
from rest_framework import serializers, permissions
from drf_yasg.utils import swagger_auto_schema


class DataStoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = JsonDataStore
        fields = ["created_at", "updated_at", "key", "data"]

    data = serializers.JSONField(source="content")
    key = serializers.CharField(source="slug")
    
    def validate_data(self,request_data):
        if not request_data:
            raise serializers.ValidationError("data cannot be empty")
        return request_data
    #TODO We should probably have stricter check on the format of the key/slug
    def validate_key(self,request_key):
        if len(request_key) < 1:
            raise serializers.ValidationError("key should be at least 1 character long")
        if ' ' in request_key:
            raise serializers.ValidationError("no white space allowed in key")
        return request_key
    
    def create(self, validated_data):
        account = self.context["request"].user.iaso_profile.account
        #Using objects.create will give values to created_at and updated_at, whereas instanciating the class will onlyfill out the values of the fields passed in args
        data_store = JsonDataStore.objects.create(**validated_data,account=account)
        return data_store


class DataStorePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        read_perms = ("menupermissions.iaso_datastore_read",)
        write_perms = ("menupermissions.iaso_datastore_write",)

        if request.method == "GET":
            can_get = (
                request.user and any(request.user.has_perm(perm) for perm in read_perms) or request.user.is_superuser
            )
            return can_get
        elif request.method == "POST" or request.method == "PUT":
            can_post = (
                request.user and any(request.user.has_perm(perm) for perm in write_perms) or request.user.is_superuser
            )
            return can_post
        else:
            return False


@swagger_auto_schema(tags=["datastore"])
class DataStoreViewSet(ModelViewSet):
    http_method_names = ["get", "post", "put"]
    permission_classes = [DataStorePermission]
    serializer_class = DataStoreSerializer
    lookup_field = "slug"

    def get_queryset(self):
        user = self.request.user
        account = user.iaso_profile.account
        queryset = JsonDataStore.objects.all()
        return queryset.filter(account=account)

