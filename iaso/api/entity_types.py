from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters, serializers, status
from rest_framework.response import Response
from unidecode import unidecode

from iaso.api.common import ModelViewSet, TimestampField
from iaso.models import Entity, EntityType
from iaso.permissions.core_permissions import CORE_ENTITY_TYPE_WRITE_PERMISSION


class EntityTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityType
        fields = [
            "id",
            "name",
            "created_at",
            "updated_at",
            "reference_form",
            "entities_count",
            "account",
            "code",
            "fields_detail_info_view",
            "fields_list_view",
            "fields_duplicate_search",
            "prevent_add_if_duplicate_found",
        ]

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    entities_count = serializers.SerializerMethodField()

    @staticmethod
    def get_entities_count(obj: EntityType):
        return Entity.objects.filter(entity_type=obj.id).count()


class EntityTypeViewSet(ModelViewSet):
    """Entity Type API
    /api/entitytypes
    /api/mobile/entitytypes
    /api/mobile/entitytype [Deprecated] will be removed in the future
    """

    results_key = "types"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]

    def get_serializer_class(self):
        return EntityTypeSerializer

    def get_queryset(self):
        search = self.request.query_params.get("search", None)
        queryset = EntityType.objects.filter(account=self.request.user.iaso_profile.account)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset

    def partial_update(self, request, pk=None):
        """
        PATCH /api/entitytypes/{id}/
        Provides an API to edit an Entity Type
        Needs iaso_entity_type_write permission
        """

        if not request.user.has_perm(CORE_ENTITY_TYPE_WRITE_PERMISSION.full_name()):
            return Response(status=status.HTTP_403_FORBIDDEN)

        name = request.data.get("name", None)
        if name is None:
            raise serializers.ValidationError({"name": "This field is required"})
        try:
            entity_type = EntityType.objects.get(pk=pk)
            entity_type.name = name
            entity_type.fields_duplicate_search = request.data.get("fields_duplicate_search", None)
            entity_type.fields_list_view = request.data.get("fields_list_view", None)
            entity_type.fields_detail_info_view = request.data.get("fields_detail_info_view", None)
            entity_type.prevent_add_if_duplicate_found = request.data.get("prevent_add_if_duplicate_found", False)
            entity_type.save()
            return Response(entity_type.as_dict())
        except:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def create(self, request, pk=None):
        """
        POST /api/entitytypes/
        Provides an API to create an Entity Type
        Needs iaso_entity_type_write permission
        """

        if not request.user.has_perm(CORE_ENTITY_TYPE_WRITE_PERMISSION.full_name()):
            return Response(status=status.HTTP_403_FORBIDDEN)
        name = request.data.get("name", None)
        account = request.data.get("account", None)
        if name is not None and account is not None:
            name_to_code = unidecode(name).lower().replace(" ", "_")
            request.data["code"] = f"{name_to_code}_{account}"
        entity_type_serializer = EntityTypeSerializer(data=request.data, context={"request": request})
        entity_type_serializer.is_valid(raise_exception=True)
        entity_type = entity_type_serializer.save()
        return Response(entity_type.as_dict(), status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None, *args, **kwargs):
        """
        DELETE /api/entitytypes/{id}/
        Provides an API to delete the an entity type
        Needs iaso_entity_type_write permission
        """
        if not request.user.has_perm(CORE_ENTITY_TYPE_WRITE_PERMISSION.full_name()):
            return Response(status=status.HTTP_403_FORBIDDEN)

        obj = get_object_or_404(EntityType, pk=pk)
        obj.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
