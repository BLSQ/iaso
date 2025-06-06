from django.http import JsonResponse
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.viewsets import ViewSet

from iaso.api.common import Paginator
from iaso.api.instances.instances import InstanceSerializer
from iaso.models import Instance
from plugins.registry.models import PublicRegistryConfig


class InstanceSerializer(serializers.ModelSerializer):
    form_descriptor = serializers.SerializerMethodField()
    file_content = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    form_name = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField()
    org_unit = serializers.SerializerMethodField()
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    altitude = serializers.SerializerMethodField()
    last_modified_by = serializers.SerializerMethodField()
    created_by = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Instance
        fields = [
            "uuid",
            "export_id",
            "file_name",
            "file_content",
            "file_url",
            "id",
            "form_id",
            "form_name",
            "created_at",
            "updated_at",
            "org_unit",
            "latitude",
            "longitude",
            "altitude",
            "period",
            "status",
            "correlation_id",
            "created_by",
            "last_modified_by",
            "form_descriptor",
        ]

    def __init__(self, *args, **kwargs):
        self.whitelisted_fields = kwargs.pop("whitelisted_fields", [])
        super().__init__(*args, **kwargs)

    def get_latitude(self, obj):
        return obj.location.y if obj.location else None

    def get_longitude(self, obj):
        return obj.location.x if obj.location else None

    def get_altitude(self, obj):
        return obj.location.z if obj.location else None

    def get_file_url(self, obj):
        return obj.file.url if obj.file else None

    def get_form_name(self, obj):
        return obj.form.name if obj.form else None

    def get_created_at(self, obj):
        return obj.created_at.timestamp() if obj.created_at else None

    def get_updated_at(self, obj):
        return obj.updated_at.timestamp() if obj.updated_at else None

    def get_form_descriptor(self, obj):
        form_version = obj.get_form_version()
        return form_version.get_or_save_form_descriptor() if form_version is not None else None

    def get_last_modified_by(self, obj):
        if obj.last_modified_by is not None:
            return obj.last_modified_by.username

    def get_created_by(self, obj):
        if obj.created_by:
            return {
                "username": obj.created_by.username,
                "first_name": obj.created_by.first_name,
                "last_name": obj.created_by.last_name,
            }

        return None

    def get_file_content(self, obj):
        return obj.get_and_save_json_of_xml()

    def get_org_unit(self, obj):
        return obj.org_unit.as_dict() if obj.org_unit else None

    def get_status(self, obj):
        return getattr(obj, "status", None)

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Apply whitelisted fields filtering
        if "file_content" in representation and representation["file_content"] is not None:
            representation["file_content"] = {
                key: value for key, value in representation["file_content"].items() if key in self.whitelisted_fields
            }

        if "form_descriptor" in representation and representation["form_descriptor"] is not None:
            form_descriptor = representation["form_descriptor"]

            if "_xpath" in form_descriptor and form_descriptor["_xpath"] is not None:
                form_descriptor["_xpath"] = {
                    key: value for key, value in form_descriptor["_xpath"].items() if key in self.whitelisted_fields
                }

            representation["form_descriptor"] = form_descriptor

        return representation


class PublicRegistryConfigSerializer(serializers.ModelSerializer):
    root_orgunit = serializers.PrimaryKeyRelatedField(read_only=True)
    data_source = serializers.PrimaryKeyRelatedField(read_only=True)
    source_version = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = PublicRegistryConfig
        fields = ["host", "slug", "whitelist", "account", "root_orgunit", "data_source", "source_version", "app_id"]


class PublicRegistryViewSet(ViewSet):
    permission_classes = []

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "registry_slug",
                openapi.IN_QUERY,
                description="Slug of the public registry configuration",
                type=openapi.TYPE_STRING,
                required=True,
            ),
        ]
    )
    @action(detail=False, methods=["GET"], url_path="config", url_name="config")
    def config(self, request: Request) -> JsonResponse:
        registry_slug = request.query_params.get("registry_slug", None)
        if not registry_slug:
            return JsonResponse({"error": "registry_slug parameter is required"}, status=400)

        public_registry_config = PublicRegistryConfig.objects.filter(slug=registry_slug).first()
        if not public_registry_config:
            return JsonResponse({"error": "Public registry configuration not found for this slug"}, status=404)

        serializer = PublicRegistryConfigSerializer(public_registry_config)
        return JsonResponse(serializer.data)

    # http://127.0.0.1:8000/api/public/registry/instances/7/
    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "instance_id",
                openapi.IN_PATH,
                description="ID of the instance",
                type=openapi.TYPE_INTEGER,
                required=True,
            ),
        ]
    )
    @action(detail=False, methods=["GET"], url_path="instances/(?P<instance_id>[^/.]+)", url_name="instance_detail")
    def instance_detail(self, request: Request, instance_id: int) -> JsonResponse:
        try:
            instance = Instance.objects.get(pk=instance_id)
        except Instance.DoesNotExist:
            return JsonResponse({"error": "Instance not found"}, status=404)

        # Get the registry_slug parameter from the request
        registry_slug = request.query_params.get("registry_slug", None)

        # Determine the public registry configuration based on the registry_slug or current URL
        public_registry_config = None
        if registry_slug:
            public_registry_config = PublicRegistryConfig.objects.filter(slug=registry_slug).first()
        else:
            current_host = request.get_host()  # Example: http://127.0.0.1:8000/
            public_registry_config = PublicRegistryConfig.objects.filter(host=current_host).first()

        if not public_registry_config:
            return JsonResponse({"error": "Public registry configuration not found for this URL or slug"}, status=404)

        # Get the whitelisted fields from the configuration
        whitelisted_fields = public_registry_config.whitelist.get("fields", [])

        # Serialize the instance with only whitelisted fields
        instance_data = InstanceSerializer(instance, many=False, whitelisted_fields=whitelisted_fields).data

        return JsonResponse(instance_data)

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "registry_slug",
                openapi.IN_QUERY,
                description="Slug of the public registry configuration",
                type=openapi.TYPE_STRING,
                required=False,
            ),
            openapi.Parameter(
                "page",
                openapi.IN_QUERY,
                description="Page number",
                type=openapi.TYPE_INTEGER,
                required=False,
            ),
            openapi.Parameter(
                "limit",
                openapi.IN_QUERY,
                description="Number of items per page",
                type=openapi.TYPE_INTEGER,
                required=False,
            ),
        ]
    )
    @action(detail=False, methods=["GET"], url_path="instances", url_name="instances")
    def instances(self, request: Request) -> JsonResponse:
        # Get the registry_slug parameter from the request
        registry_slug = request.query_params.get("registry_slug", None)

        # Determine the public registry configuration based on the registry_slug or current URL
        public_registry_config = None
        if registry_slug:
            public_registry_config = PublicRegistryConfig.objects.filter(slug=registry_slug).first()
        else:
            current_host = request.get_host()  # Example: http://127.0.0.1:8000/
            public_registry_config = PublicRegistryConfig.objects.filter(host=current_host).first()

        if not public_registry_config:
            return JsonResponse({"error": "Public registry configuration not found for this URL or slug"}, status=404)

        # Get the whitelisted fields from the configuration
        whitelisted_fields = public_registry_config.whitelist.get("fields", [])

        # Fetch instances and only include whitelisted fields
        org_unit_type_id = request.query_params.get("orgUnitTypeId", None)
        form_ids = request.query_params.get("form_ids", None)
        org_unit_parent_id = request.query_params.get("orgUnitParentId", None)
        org_unit_status = request.query_params.get("org_unit_status", None)

        filters = {
            "show_deleted": None,
            "only_reference": None,
        }
        orders = ["-created_at"]

        instances = Instance.objects.filter(project__account=public_registry_config.account_id)
        instances = instances.exclude(file="").exclude(device__test_device=True)
        instances = instances.prefetch_related("org_unit__org_unit_type")
        instances = instances.prefetch_related("org_unit__version__data_source")
        instances = instances.prefetch_related("form")
        instances = instances.prefetch_related("created_by")
        instances = instances.for_filters(**filters)

        # Apply additional filter separately
        if org_unit_type_id:
            instances = instances.filter(org_unit__org_unit_type__pk=org_unit_type_id)

        if form_ids:
            instances = instances.filter(form_id__in=form_ids.split(","))

        if org_unit_parent_id:
            instances = instances.filter(org_unit__parent_id=org_unit_parent_id)

        if org_unit_status:
            instances = instances.filter(org_unit__validation_status=org_unit_status)

        instances = instances.order_by(*orders)

        paginator = Paginator()
        page = paginator.paginate_queryset(instances, request)
        if page is not None:
            return paginator.get_paginated_response(
                InstanceSerializer(page, many=True, whitelisted_fields=whitelisted_fields).data
            )

        return JsonResponse(
            {"instances": InstanceSerializer(instances, many=True, whitelisted_fields=whitelisted_fields).data}
        )
