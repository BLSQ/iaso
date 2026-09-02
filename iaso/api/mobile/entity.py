import math

from django.db.models import Count, Window
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_spectacular.utils import extend_schema
from rest_framework import filters, permissions, serializers
from rest_framework.exceptions import AuthenticationFailed, NotFound, ParseError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from iaso.api.common import DeletionFilterBackend, HasPermission, ModelViewSet, Paginator, TimestampField
from iaso.api.query_params import LIMIT, PAGE
from iaso.api.serializers import AppIdSerializer
from iaso.models import Entity, EntityType, FormVersion, Instance, Project
from iaso.models.entity import InvalidJsonContentError, InvalidLimitDateError, ProjectNotFoundError, UserNotAuthError
from iaso.permissions.core_permissions import CORE_ENTITIES_PERMISSION


def filter_for_mobile_entity(queryset, request, skip_limit_date_filter=False):
    if queryset is not None:
        try:
            queryset = queryset.filter_for_mobile_entity(
                request.query_params.get("limit_date"),
                request.query_params.get("json_content"),
                skip_limit_date_filter=skip_limit_date_filter,
            )
        except InvalidLimitDateError as e:
            raise ParseError(e.message)
        except InvalidJsonContentError as e:
            raise ParseError(e.message)

    return queryset


def filter_on_app_id(queryset, user, app_id):
    try:
        return queryset.filter_for_app_id(user, app_id)
    except ProjectNotFoundError as e:
        raise NotFound(e.message)
    except UserNotAuthError as e:
        raise AuthenticationFailed(e.message)


def filter_on_user_and_app_id(queryset, user, app_id, limit_date=None):
    try:
        return queryset.filter_for_user_and_app_id(user, app_id, limit_date=limit_date)
    except ProjectNotFoundError as e:
        raise NotFound(e.message)
    except UserNotAuthError as e:
        raise AuthenticationFailed(e.message)
    except InvalidLimitDateError as e:
        raise ParseError(e.message)


class LargeResultsSetPagination(PageNumberPagination):
    page_size = 1000
    page_size_query_param = LIMIT
    page_query_param = PAGE
    max_page_size = 1000


class MobileEntityAttributesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Instance
        fields = [
            "id",
            "form_id",
            "form_version_id",
            "created_at",
            "updated_at",
            "org_unit_id",
            "json",
        ]

    form_id = serializers.IntegerField(read_only=True)
    id = serializers.CharField(read_only=True, source="uuid")
    org_unit_id = serializers.CharField(read_only=True)
    form_version_id = serializers.SerializerMethodField()
    created_at = TimestampField(read_only=True, source="source_created_at_with_fallback")
    updated_at = TimestampField(read_only=True, source="source_updated_at_with_fallback")

    def get_form_version_id(self, obj):
        if obj.json is None:
            return None
        possible_form_versions = self.context.get("possible_form_versions")
        key = "%s|%s" % (obj.json.get("_version"), str(obj.form.id))
        return possible_form_versions.get(key)


class MobileEntitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entity
        fields = [
            "id",
            "created_at",
            "updated_at",
            "defining_instance_id",
            "entity_type_id",
            "instances",
        ]

    created_at = TimestampField()
    updated_at = TimestampField()

    instances = serializers.SerializerMethodField()
    id = serializers.CharField(read_only=True, source="uuid")
    defining_instance_id = serializers.CharField(read_only=True, source="attributes.uuid")
    entity_type_id = serializers.CharField(read_only=True, source="entity_type.id")

    def get_instances(self, entity):
        possible_form_versions = self.context.get("possible_form_versions")
        ok_instances = []

        for inst in entity.instances.all():
            if inst.deleted == False:
                if not inst.json:
                    continue

                key = "%s|%s" % (inst.json.get("_version"), str(inst.form_id))
                form_version = possible_form_versions.get(key, None)

                if form_version is not None:
                    ok_instances.append(inst)

        return MobileEntityAttributesSerializer(ok_instances, many=True, context=self.context).data  # type: ignore

    @staticmethod
    def get_entity_type_name(obj: Entity):
        return obj.entity_type.name if obj.entity_type else None


class MobileEntitiesSetPagination(Paginator):
    """
    DRF's default pagination issues two separate queries: one for `.count()`, one for the page
    slice. Both re-run the same (expensive, for this endpoint) entity filtering. `Window` lets
    Postgres compute the total count and the page in the same query execution, roughly halving
    the DB cost -- measured ~2x fewer buffer blocks touched on both a narrow and a whole-country
    org unit scope, same query plan either way.
    """

    page_size_query_param = LIMIT
    page_query_param = PAGE
    page_size = 1000
    max_page_size = 1000

    def get_iaso_page_number(self, request):
        try:
            return int(request.query_params.get(self.page_query_param, 1))
        except (TypeError, ValueError):
            raise ParseError(f"Invalid {self.page_query_param}")

    def paginate_queryset(self, queryset, request, view=None):
        page_size = self.get_page_size(request)
        if not page_size:
            return None

        page_number = self.get_iaso_page_number(request)
        if page_number < 1:
            raise NotFound(self.invalid_page_message)

        offset = (page_number - 1) * page_size
        windowed_qs = queryset.annotate(_iaso_total_count=Window(expression=Count("id")))[offset : offset + page_size]
        results = list(windowed_qs)

        if results:
            total_count = results[0]._iaso_total_count
        elif page_number == 1:
            # Page 1 came back empty -> the whole queryset matched nothing, no fallback query needed:
            # if page 1 is empty, so is every other page.
            total_count = 0
        else:
            # An empty page beyond page 1 is ambiguous on its own -- a genuinely empty queryset, or a
            # page number past the end. The one case that still needs a real count() query, but it's
            # the rare/cold path (a client paging past the last page), not the common one.
            total_count = queryset.count()

        num_pages = math.ceil(total_count / page_size) if total_count else 1
        if page_number > num_pages:
            raise NotFound(self.invalid_page_message)

        self.count = total_count
        self.num_pages = num_pages
        self.current_page_number = page_number
        self.current_page_size = page_size
        self.next_exists = offset + page_size < total_count
        self.previous_exists = page_number > 1
        self.request = request

        return results

    def get_paginated_response(self, data):
        return Response(
            {
                "count": self.count,
                self.get_results_key(): data,
                "has_next": self.next_exists,
                "has_previous": self.previous_exists,
                "page": self.current_page_number,
                "pages": self.num_pages,
                "limit": self.current_page_size,
            }
        )


@extend_schema(tags=["Mobile", "Entities"])
class MobileEntityViewSet(ModelViewSet):
    f"""Entity API for mobile

    list: /api/mobile/entities

    pagination by default: 1000 entities

    It's possible to filter out entities with no activity before a certain date with the parameter limit_date

    details = /api/mobile/entities/uuid

    sample usage: /api/mobile/entities/?limit_date=2022-12-29&{LIMIT}=1&{PAGE}=1

    """

    results_key = "results"
    include_results_key_if_not_paginated = False
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend, DeletionFilterBackend]
    permission_classes = [permissions.IsAuthenticated, HasPermission(CORE_ENTITIES_PERMISSION)]
    pagination_class = MobileEntitiesSetPagination

    lookup_field = "uuid"

    def get_serializer_class(self):
        return MobileEntitySerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        user = self.request.user

        qs = FormVersion.objects.filter(form__projects__account=user.iaso_profile.account).values_list(
            "version_id", "form_id", "id"
        )

        context["possible_form_versions"] = {
            f"{version_id}|{form_id}": version_pk for version_id, form_id, version_pk in qs
        }

        return context

    def get_queryset(self):
        user = self.request.user
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=True)

        project = Project.objects.get_for_user_and_app_id(user, app_id)

        entity_types = EntityType.objects.filter(reference_form__projects=project).only("id")

        queryset = Entity.objects.filter(entity_type__in=entity_types)

        # Merge the org-unit-scope check (inside filter_on_user_and_app_id) and the limit_date check
        # (inside filter_for_mobile_entity) into a single correlated Exists(...) subquery against
        # iaso_instance, instead of two separate ones -- see filter_for_user's comment. skip_limit_date_filter
        # tells filter_for_mobile_entity not to re-add limit_date as a second Exists(...).
        limit_date = self.request.query_params.get("limit_date")
        queryset = filter_on_user_and_app_id(queryset, user, app_id, limit_date=limit_date)
        queryset = filter_for_mobile_entity(queryset, self.request, skip_limit_date_filter=True)

        # select_related (a JOIN) is right here, not prefetch_related: `filter_for_mobile_entity` already
        # filters on `attributes__deleted`, which forces Postgres to join iaso_instance into this query
        # regardless -- prefetch_related would keep that join *and* add a second round trip to re-fetch
        # the same rows. What actually wastes work is pulling every iaso_instance column (json, location,
        # file, ...) into that join when the serializer only ever reads `attributes.uuid` -- `.only()` keeps
        # the single JOIN but drops the unused columns from the SELECT list.
        queryset = (
            queryset.select_related("entity_type", "attributes")
            .only(
                "id",
                "uuid",
                "created_at",
                "updated_at",
                "entity_type_id",
                "attributes_id",
                "entity_type__id",
                "attributes__id",
                "attributes__uuid",
            )
            .prefetch_related("instances")
        )

        return queryset.order_by("id")


class DeletedMobileEntitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entity
        fields = ["id", "uuid", "deleted_at", "merged_to_uuid", "entity_type_id"]

    deleted_at = TimestampField()
    merged_to_uuid = serializers.SerializerMethodField()

    def get_merged_to_uuid(self, entity):
        if entity.merged_to:
            return entity.merged_to.uuid


@extend_schema(tags=["Entities", "Mobile"])
class MobileEntityDeletedViewSet(ModelViewSet):
    """Entity API for mobile

    list: /api/mobile/entities/deleted

    Returns the full list of (soft-) deleted entities.
    No pagination at the moment to keep thing simple.
    """

    results_key = "results"
    include_results_key_if_not_paginated = False
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(CORE_ENTITIES_PERMISSION),
    ]
    pagination_class = MobileEntitiesSetPagination

    def get_serializer_class(self):
        return DeletedMobileEntitySerializer

    def get_queryset(self):
        user = self.request.user
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=True)

        queryset = Entity.objects_only_deleted
        queryset = filter_on_user_and_app_id(queryset, user, app_id)

        return (
            queryset.prefetch_related("merged_to")
            .only(
                "id",
                "uuid",
                "deleted_at",
                "merged_to_id",
                "entity_type_id",
            )
            .order_by("id")
        )
